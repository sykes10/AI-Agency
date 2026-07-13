## Context

Model Usage events already persist the stage, model, token categories, web
searches, timestamp, and estimated cost for each model call. The usage endpoint
reduces these events to one Article total, and the workspace renders that total
as a small heading label. The missing dimensions are the pipeline invocation
and stage attempt that caused each call.

Pipeline execution can span several invocations: initial generation pauses at
Draft Review, approval continues downstream work, an iteration returns to
Writing, and a failed Article can be retried. Existing JSONL event logs must
remain readable without migration.

## Goals / Non-Goals

**Goals:**

- Attribute new Model Usage events to a pipeline run, run kind, and one-based
  stage attempt.
- Aggregate totals and detailed rows in one reusable, tested function.
- Preserve the existing top-level usage response fields for compatibility.
- Present a compact, expandable breakdown in the Article workspace.
- Make legacy events visible as historical unattributed usage.

**Non-Goals:**

- Enforcing cost budgets or stopping expensive runs.
- Persisting a separate pipeline-run database record.
- Changing model selection or token budgets.
- Repricing historical usage when pricing tables change.
- Adding arbitrary completed-stage reruns.

## Decisions

### Enrich Model Usage at the AgentContext boundary

`runArticleJob` will create a UUID for each invocation and determine its kind
from the Article state (`initial`, `continuation`, `iteration`, or `retry`). For
each stage attempt it will wrap the base `AgentContext` with usage attribution.
The wrapper enriches only Model Usage events before persistence.

This keeps LLM helpers independent of orchestration and automatically covers
both Research calls and every structured call. Passing run metadata through
every agent and LLM helper was rejected because it couples content agents to
pipeline accounting.

### Keep attribution optional in the persisted schema

`runId`, `runKind`, and `attempt` will be optional on Model Usage events so
existing JSONL logs still parse. The summary will group missing attribution
under a legacy row with a one-based default attempt.

A log migration was rejected because the missing provenance cannot be
reconstructed reliably and migration would add risk without improving data.

### Return totals plus flat breakdown rows

The usage response will retain its existing total fields and add `breakdown`,
ordered by first occurrence. Each row is grouped by run ID, run kind, stage,
model, and attempt and contains the same numeric totals and pricing-completeness
flag as the Article summary.

A deeply nested run/stage/attempt API was rejected because it makes consumers
and tests more complex without adding information. The browser can visually
group adjacent flat rows.

### Use a native disclosure and semantic table

The workspace will retain the concise total in the Article heading and place
the detailed table in a `<details>` disclosure below the heading. The table
will expose run kind, stage, attempt, model, calls, token categories, searches,
and cost, with responsive overflow for narrow screens.

A chart was rejected because exact comparisons and attribution are more useful
than proportional visualization at the current number of stages.

## Risks / Trade-offs

- **Run kinds are inferred from Article state** → Keep inference in one tested
  function and use a distinct `continuation` kind after Draft approval.
- **Legacy usage lacks exact attribution** → Display it explicitly as
  historical usage instead of guessing.
- **Flat rows can become numerous after repeated retries** → Keep the section
  collapsed by default and use horizontal scrolling on small screens.
- **Stored estimates reflect the pricing table at call time** → Continue
  summing stored estimates rather than silently repricing old events.

## Migration Plan

Deploy the optional event fields, aggregation, and UI together. Existing logs
continue to validate and appear in a legacy breakdown row. Rollback requires no
data migration because older code ignores additional JSON fields when parsing
through the current non-strict Zod object schema.

## Open Questions

None for this iteration. Cost budgets and pricing snapshots can be specified as
separate roadmap changes.

