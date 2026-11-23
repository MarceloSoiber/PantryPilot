# Quick Recipes Corpus v0

This is the PantryPilot seed corpus for recipes that declare a total preparation and
cooking time of 30 minutes or less.

## Contents

- `quick-recipes-v0.json`: 35 complete, structured recipe records.
- Languages supplied by the source: English and Russian.
- Each record retains its title, summary, ingredients, quantities, steps, timing,
  servings, dietary tags, nutrition estimate, storage notes and source-country data
  when supplied upstream.

## RAG ingestion guidance

Use one recipe as the source record, then generate separate retrieval chunks for:

1. overview and constraints;
2. ingredients and substitutions;
3. preparation steps;
4. safety and storage notes.

Every generated chunk must retain the recipe `slug` plus the provenance fields at the
root of the JSON. Do not use this file as training data without keeping attribution
and license metadata available to the retrieval layer.

## Source and license

The dataset is a time-filtered derivative of **UniTools World Recipes v2.0.0**:

- Source: <https://theunitools.com/data/unitools-recipes-v1.json>
- Source homepage: <https://theunitools.com/en/data>
- Attribution: **UniTools — theunitools.com**
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

The filter used by PantryPilot preserves only entries whose declared preparation time
plus cooking time is at most 30 minutes. The corpus and any derivative distribution
must retain attribution and be shared under compatible CC BY-SA terms.

## Limitations

Recipe metadata is source-provided and has not yet been independently reviewed for
allergens, dietary suitability, food safety or cultural authenticity. The application
must show safety guidance and avoid making allergy or medical guarantees.
