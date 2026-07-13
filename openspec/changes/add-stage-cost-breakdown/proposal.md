## Why

The Article workspace shows only a single aggregate estimate, so the editor
cannot see which pipeline stages, retries, or Draft iterations consume the
budget. The usage events already capture most required data, making a detailed
breakdown a high-value, low-risk improvement.

## What Changes

- Attribute every model call to a pipeline run and stage attempt.
- Aggregate Article usage by run, attempt, stage, and model while preserving the
  existing Article totals.
- Expose the breakdown through the Article usage endpoint.
- Add an expandable cost breakdown to the Article workspace showing calls,
  searches, token categories, pricing completeness, and estimated cost.
- Distinguish initial execution cost from retry and Draft-iteration cost.
- Preserve compatibility with Model Usage events written before run and attempt
  attribution existed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `observability-and-usage`: Model Usage records and Article usage summaries gain
  run, attempt, stage, and model attribution.
- `editorial-workspace`: The aggregate cost display gains a detailed,
  accessible per-stage breakdown.

## Impact

- Event schema and model-usage emission context.
- Pipeline run and stage-attempt orchestration.
- `GET /articles/:id/usage` response shape.
- Article workspace markup, styling, and rendering.
- Usage, orchestration, route, and browser-facing tests.
- No new runtime dependency and no migration of existing event logs.
