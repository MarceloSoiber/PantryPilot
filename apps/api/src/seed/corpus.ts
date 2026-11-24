import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

const ingredientSchema = z.object({
  name: z.string().trim().min(1),
  note: z.string().trim().min(1).optional(),
});

const quantityIngredientSchema = z.object({
  qty: z.number().nullable(),
  unit: z.string().trim().min(1),
});

const recipeTextSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(z.string().trim().min(1)).min(1),
});

const corpusSchema = z.object({
  provenance: z.object({ retrieved_at: z.string().date() }),
  recipes: z.array(z.object({
    id: z.string().trim().min(1),
    source: z.object({
      id: z.string().trim().min(1),
      servings: z.number().int().positive().nullable(),
      time_min: z.object({
        prep: z.number().int().nonnegative(),
        cook: z.number().int().nonnegative(),
      }),
      tags: z.array(z.string().trim().min(1)),
      allergens: z.array(z.string().trim().min(1)),
      ingredients: z.array(quantityIngredientSchema),
      provenance: z.object({
        source: z.string().trim().min(1),
        title: z.string().trim().min(1),
        url: z.string().url(),
        revision: z.number().int().nullable(),
        attribution: z.string().trim().min(1),
        license: z.string().trim().min(1),
      }),
    }),
    text: z.object({ en: recipeTextSchema, 'pt-BR': recipeTextSchema.nullable() }),
  })).min(1),
});

export interface SeedDocument {
  id: string;
  recipeId: string;
  language: string;
  chunkIndex: number;
  title: string;
  content: string;
  ingredients: Array<{ name: string; note?: string; qty: number | null; unit: string }>;
  servings: number | null;
  prepMinutes: number;
  cookMinutes: number;
  dietaryTags: string[];
  allergens: string[];
  relevantTemperaturesC: null;
  sourceName: string;
  sourceTitle: string;
  sourceAuthor: string;
  sourceUrl: string;
  sourceLicense: string;
  sourceAccessedAt: Date;
  sourceRevision: number | null;
}

export async function readSeedDocuments(corpusDirectory: string): Promise<SeedDocument[]> {
  const files = (await readdir(corpusDirectory, { recursive: true }))
    .filter((file) => file.endsWith('.json'))
    .map((file) => join(corpusDirectory, file))
    .sort();
  const documents = await Promise.all(files.map(async (file) => {
    const parsed = corpusSchema.parse(JSON.parse(await readFile(file, 'utf8')));
    return parsed.recipes.map((recipe) => toSeedDocument(recipe, parsed.provenance.retrieved_at));
  }));
  return documents.flat();
}

function toSeedDocument(
  recipe: z.infer<typeof corpusSchema>['recipes'][number],
  retrievedAt: string,
): SeedDocument {
  if (recipe.id !== recipe.source.id || recipe.id !== recipe.text.en.id) {
    throw new Error(`Recipe identifiers do not match for ${recipe.id}`);
  }
  if (recipe.text.en.ingredients.length !== recipe.source.ingredients.length) {
    throw new Error(`Ingredient arrays do not match for ${recipe.id}`);
  }
  const ingredients = recipe.text.en.ingredients.map((ingredient, index) => ({
    ...ingredient,
    ...recipe.source.ingredients[index],
  }));
  const content = [
    recipe.text.en.name,
    recipe.text.en.summary,
    'Ingredients:',
    ...ingredients.map(({ name, note, qty, unit }) => `- ${[qty, unit, name, note].filter(Boolean).join(' ')}`),
    'Steps:',
    ...recipe.text.en.steps.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n');

  return {
    id: `${recipe.id}:en:0`, recipeId: recipe.id, language: 'en', chunkIndex: 0,
    title: recipe.text.en.name, content, ingredients, servings: recipe.source.servings,
    prepMinutes: recipe.source.time_min.prep, cookMinutes: recipe.source.time_min.cook,
    dietaryTags: recipe.source.tags, allergens: recipe.source.allergens, relevantTemperaturesC: null,
    sourceName: recipe.source.provenance.source, sourceTitle: recipe.source.provenance.title,
    sourceAuthor: recipe.source.provenance.attribution, sourceUrl: recipe.source.provenance.url,
    sourceLicense: recipe.source.provenance.license,
    sourceAccessedAt: new Date(`${retrievedAt}T00:00:00.000Z`),
    sourceRevision: recipe.source.provenance.revision,
  };
}
