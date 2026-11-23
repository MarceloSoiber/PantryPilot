#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const [basePath, englishPath, outputPath] = process.argv.slice(2);
const limit = Number.parseInt(process.env.CORPUS_LIMIT ?? '100', 10);
const batchSize = Number.parseInt(process.env.CORPUS_BATCH_SIZE ?? '5', 10);
const baseUrl = (process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1').replace(/\/$/, '');
const model = process.env.LM_STUDIO_MODEL ?? 'openai/gpt-oss-20b';

if (!basePath || !englishPath || !outputPath || !Number.isInteger(limit) || limit < 1) {
  throw new Error(
    'Usage: node scripts/build-bilingual-corpus.mjs <recipes.jsonl> <en.jsonl> <output.json>',
  );
}

const quotas = new Map([
  ['dinner', 30],
  ['lunch', 20],
  ['breakfast', 15],
  ['snack', 15],
  ['other', 15],
  ['dessert', 5],
]);

function parseJsonLines(text) {
  return text.trim().split('\n').filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSONL at line ${index + 1}: ${error.message}`);
    }
  });
}

function totalMinutes(recipe) {
  return recipe.time_min.prep + recipe.time_min.cook;
}

function selectRecipes(baseRecords, englishRecords) {
  const baseById = new Map(baseRecords.map((recipe) => [recipe.id, recipe]));
  const candidates = englishRecords
    .map((english) => ({ base: baseById.get(english.id), english }))
    .filter(({ base }) => base
      && Number.isInteger(base.time_min?.prep)
      && Number.isInteger(base.time_min?.cook)
      && totalMinutes(base) <= 30
      && base.ingredients.length >= 3
      && base.ingredients.length <= 12
      && base.step_count <= 7)
    .sort((left, right) => totalMinutes(left.base) - totalMinutes(right.base)
      || left.base.ingredients.length - right.base.ingredients.length
      || left.english.name.localeCompare(right.english.name));

  const selected = [];
  for (const [category, quota] of quotas) {
    selected.push(...candidates.filter(({ base }) => base.category === category).slice(0, quota));
  }

  if (selected.length < limit) {
    const selectedIds = new Set(selected.map(({ base }) => base.id));
    selected.push(...candidates.filter(({ base }) => !selectedIds.has(base.id)).slice(0, limit - selected.length));
  }

  return selected.slice(0, limit);
}

function translationPayload(recipes) {
  return recipes.map(({ base, english }) => ({
    id: base.id,
    title: english.name,
    summary: english.summary,
    ingredients: english.ingredients.map(({ name, note }) => ({ name, note })),
    steps: english.steps,
  }));
}

function extractJson(content) {
  const withoutFence = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(withoutFence);
}

async function askModel(system, payload) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LM Studio returned ${response.status}: ${await response.text()}`);
  }

  const body = await response.json();
  return extractJson(body.choices?.[0]?.message?.content ?? '');
}

function numericTokens(value) {
  return String(value).match(/\d+(?:[.,]\d+)?/g) ?? [];
}

function validateTranslation(source, translation) {
  const errors = [];
  if (source.id !== translation.id) errors.push('recipe id changed');
  if (!translation.title?.trim()) errors.push('missing translated title');
  if (!translation.summary?.trim()) errors.push('missing translated summary');
  if (!Array.isArray(translation.ingredients) || translation.ingredients.length !== source.ingredients.length) {
    errors.push('ingredient count changed');
  }
  if (!Array.isArray(translation.steps) || translation.steps.length !== source.steps.length) {
    errors.push('step count changed');
  }

  for (const field of ['title', 'summary']) {
    const expected = numericTokens(source[field]);
    const actual = numericTokens(translation[field]);
    if (expected.join('|') !== actual.join('|')) errors.push(`${field} numeric tokens changed`);
  }

  source.ingredients.forEach((ingredient, index) => {
    const translated = translation.ingredients?.[index];
    if (!translated?.name?.trim()) errors.push(`ingredient ${index} has no name`);
    const expected = numericTokens(ingredient.note ?? '');
    const actual = numericTokens(translated?.note ?? '');
    if (expected.join('|') !== actual.join('|')) errors.push(`ingredient ${index} note numeric tokens changed`);
  });

  source.steps.forEach((step, index) => {
    const translated = translation.steps?.[index];
    if (!translated?.trim()) errors.push(`step ${index} is empty`);
    if (numericTokens(step).join('|') !== numericTokens(translated).join('|')) {
      errors.push(`step ${index} numeric tokens changed`);
    }
  });

  return errors;
}

async function translateBatch(sourceRecords) {
  const result = await askModel(
    [
      'You are a translation engine, not a recipe author.',
      'Translate English recipe text to Brazilian Portuguese only.',
      'Never add, remove, infer, consolidate, or alter information.',
      'Keep every recipe id, ingredient-array length, step-array length, and every numeric token unchanged.',
      'Translate only title, summary, ingredient name/note, and steps.',
      'Return JSON only: {"translations":[{"id","title","summary","ingredients":[{"name","note"}],"steps":[string]}]}.',
    ].join(' '),
    { recipes: sourceRecords },
  );

  if (!Array.isArray(result.translations)) throw new Error('Translation response has no translations array');
  return result.translations;
}

async function verifyBatch(pairs) {
  const result = await askModel(
    [
      'You are a strict translation fidelity reviewer.',
      'Compare each English source recipe with its Brazilian Portuguese translation.',
      'Reject any translation that adds, removes, changes, or infers a culinary fact.',
      'Do not judge style. Return JSON only: {"reviews":[{"id","status":"pass"|"fail","issues":[string]}]}.',
    ].join(' '),
    { recipes: pairs },
  );

  if (!Array.isArray(result.reviews)) throw new Error('Verification response has no reviews array');
  return new Map(result.reviews.map((review) => [review.id, review]));
}

function asCorpusRecord({ base, english }, portuguese, review, deterministicErrors) {
  return {
    id: base.id,
    source: base,
    text: {
      en: english,
      'pt-BR': {
        ...portuguese,
        machine_translated: true,
        translated_from: 'en',
        translation_provider: 'lm-studio',
        translation_model: model,
        translation_temperature: 0,
        fidelity_status: deterministicErrors.length === 0 && review?.status === 'pass' ? 'verified' : 'rejected',
        fidelity_issues: [...deterministicErrors, ...(review?.issues ?? [])],
      },
    },
  };
}

async function main() {
  const [baseText, englishText] = await Promise.all([readFile(basePath, 'utf8'), readFile(englishPath, 'utf8')]);
  const selected = selectRecipes(parseJsonLines(baseText), parseJsonLines(englishText));
  if (selected.length !== limit) throw new Error(`Only ${selected.length} recipes matched the requested limit of ${limit}`);

  const built = [];
  for (let index = 0; index < selected.length; index += batchSize) {
    const batch = selected.slice(index, index + batchSize);
    const sourceRecords = translationPayload(batch);
    const translations = await translateBatch(sourceRecords);
    const translationsById = new Map(translations.map((translation) => [translation.id, translation]));
    const pairs = sourceRecords.map((source) => ({ source, translation: translationsById.get(source.id) }));
    const reviews = await verifyBatch(pairs);

    for (const recipe of batch) {
      const source = translationPayload([recipe])[0];
      const portuguese = translationsById.get(recipe.base.id) ?? { id: recipe.base.id, title: '', summary: '', ingredients: [], steps: [] };
      const errors = validateTranslation(source, portuguese);
      built.push(asCorpusRecord(recipe, portuguese, reviews.get(recipe.base.id), errors));
    }

    console.error(`Processed ${built.length}/${selected.length} recipes`);
  }

  const rejected = built.filter((recipe) => recipe.text['pt-BR'].fidelity_status !== 'verified');
  if (rejected.length > 0) {
    throw new Error(`Refusing to write corpus: ${rejected.length} translations failed fidelity validation`);
  }

  const corpus = {
    schema_version: '2.0',
    corpus_id: 'pantrypilot-quick-recipes-v1',
    languages: ['en', 'pt-BR'],
    selection: {
      recipe_count: built.length,
      max_total_minutes: 30,
      min_ingredients: 3,
      max_ingredients: 12,
      max_steps: 7,
      category_quotas: Object.fromEntries(quotas),
    },
    provenance: {
      source_name: 'Open Recipe Corpus',
      source_repository: 'https://github.com/Rippy1911/open-recipe-corpus',
      source_files: [
        'data/recipes.jsonl',
        'data/text/en.jsonl',
      ],
      source_license: 'CC BY-SA 4.0',
      source_license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
      retrieved_at: new Date().toISOString(),
      translation_policy: 'docs/CONTENT_FIDELITY_POLICY.md',
    },
    recipes: built,
  };

  await mkdir(dirname(resolve(outputPath)), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(corpus, null, 2)}\n`);
  console.error(`Wrote ${outputPath}`);
}

await main();
