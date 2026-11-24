# Quick Recipes Corpus v1

This seed corpus contains 100 recipes selected for quick preparation: no more than
30 declared minutes, 3–12 ingredients and at most 7 steps. Drink records are excluded.

## Languages and fidelity

- `text.en` is the English text distributed by the licensed upstream corpus. For this
  seed, it is machine-translated from Polish; the original language remains in
  `source.source_lang` and the translation metadata is retained in each record.
- `text.pt-BR` is deliberately `null` until a local LM Studio translation passes the
  deterministic and semantic fidelity checks.
- No Russian text is distributed in this version.
- The application may answer in Portuguese from recovered evidence, but it must
  identify the result as a grounded translation or summary and never claim that an
  unpublished Portuguese text is source text.

See [`docs/CONTENT_FIDELITY_POLICY.md`](../../docs/CONTENT_FIDELITY_POLICY.md) for
the rules that govern translation and answer generation.

## Source and license

The corpus is a selected derivative of the
[Open Recipe Corpus](https://github.com/Rippy1911/open-recipe-corpus):

- Data source: `data/recipes.jsonl` and `data/text/en.jsonl`
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Per-recipe attribution, source URL, revision and credit line are retained in each
  record under `source.provenance`.

Any translated or derived distribution must preserve those per-recipe credits and use
compatible share-alike terms.
