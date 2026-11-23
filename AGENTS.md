# PantryPilot — Instructions for Codex Agents

## Product intent

PantryPilot is an AI-powered cooking assistant: it turns available ingredients, time
constraints and declared preferences into practical recipes, substitutions and clear
preparation guidance.

The project is a public portfolio piece. Prefer solutions that are understandable,
testable and easy to explain over premature complexity.

## Scope and safety

- PantryPilot informs and suggests; it does not replace medical, nutritional or food
  safety advice.
- Treat allergies, medical diets, raw-food handling and food preservation as
  safety-critical. Do not promise the absence of cross-contamination.
- Present a visible, proportional disclaimer when a user-facing flow addresses those
  topics. Enforce critical guardrails in code, not solely in prompts.
- Never commit secrets, API keys, local paths, private course material or unlicensed
  recipe content. Use environment variables locally and a secrets manager in
  production.

## Knowledge and RAG rules

- Use only culinary sources with a documented right to use them. Do not bulk-copy
  recipe sites into the corpus.
- Preserve provenance for every corpus item: title, author/source, URL, license,
  access date, ingredients, servings, preparation time, dietary tags, allergens and
  relevant temperatures.
- Responses must distinguish among a sourced recipe, an evidence-backed adaptation
  and a creative suggestion.
- Cite sources for recovered factual claims; deduplicate citations in the response.
- Keep curated corpus content separate from web enrichment. Web content needs a TTL
  and source policy before persistence.
- If evidence is insufficient, say so. A fallback search is bounded and must not loop
  indefinitely.
- Keep model and embedding identifiers configurable. Changing embeddings requires a
  documented reindexing plan.

## Architecture and code

- Start with the smallest modular design that meets the current requirement. Do not
  assume the stack from the AI Researcher capstone applies here.
- Once a monorepo exists, preserve dependency direction: applications may depend on
  shared packages; shared packages must not depend on applications; contracts remain
  framework-independent.
- Validate external input at boundaries. Avoid `any`; use strict types and explicit
  domain errors.
- Inject network and LLM dependencies into services or graph nodes. Do not create
  hidden global clients.
- Consult `docs/PROJECT_MAP.md` before structural decisions. Record accepted,
  material decisions in the project documentation or an ADR.

## Quality

- Write deterministic unit tests for transformations and domain rules.
- Test agent workflows with fakes/fixtures rather than live model or web calls.
- Maintain a demo mode that runs without private credentials or network access when
  the agent workflow is introduced.
- Add an end-to-end test for each user-critical flow as it becomes available.
- A health endpoint only demonstrates process availability; do not treat it as a full
  dependency or schema check.

## Working practices

- Keep commits small, focused and readable as a narrative of how the project was
  built. Use the repository's established conventional-commit style.
- Confirm before adding a new external dependency, changing a public contract or
  schema, running migrations, deploying infrastructure, or doing a broad
  reorganization.
- For small internal changes, proceed and verify proportionally.
- Prefer current official documentation over outdated instructions. Document a
  deliberate deviation when it materially affects the project.
- Do not perform destructive, production or infrastructure operations without
  explicit confirmation.

## Reference project

The AI Researcher capstone informs engineering patterns such as corrective RAG,
traceability, resilience, tests and observability. Do not copy its financial domain,
private material, fixed stack or cloud-specific operational assumptions.
