## 1. Usage Attribution

- [x] 1.1 Extend Model Usage events with backward-compatible run, run-kind, and attempt fields
- [x] 1.2 Infer pipeline run kind and enrich model usage from each stage attempt
- [x] 1.3 Add tests for usage attribution and legacy event compatibility

## 2. Usage Aggregation API

- [x] 2.1 Extract a typed Article usage summarizer with aggregate totals and grouped breakdown rows
- [x] 2.2 Return the detailed summary from the Article usage endpoint without removing existing fields
- [x] 2.3 Test grouping, partial pricing, retries, multiple runs, and legacy usage

## 3. Editorial Workspace

- [x] 3.1 Add an expandable semantic cost table to the Article workspace
- [x] 3.2 Render run kinds, stages, attempts, models, token categories, searches, and pricing state
- [x] 3.3 Add responsive styling and clear empty or legacy states

## 4. Verification

- [x] 4.1 Run the test suite, typecheck, strict OpenSpec validation, and diff checks
