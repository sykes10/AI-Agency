# Future Optimizations

Context: single-user tool today, but expected to grow in features over time.
Horizontal scaling (multi-instance, multi-tenant) is explicitly **not** a
near-term goal — don't take on DB/queue infra until that changes. The notes
below are about keeping the codebase easy to extend, not about scaling out.

## Pipeline extensibility

`buildPipeline` in [src/orchestrator/Orchestrator.ts](../src/orchestrator/Orchestrator.ts)
is a flat array of `StageDef` objects with a consistent `isDone`/`run`
contract. Adding a new agent (image generation, fact-checking, etc.) is just:

1. Add a new `ArticleStatus` value + transition in
   [stateMachine.ts](../src/orchestrator/stateMachine.ts).
2. Add a new `StageDef` entry to the pipeline array.

This is already a good extension point — no rework needed for adding stages
one at a time.

**Constraint to watch:** the pipeline is strictly linear, and each stage
hardcodes its predecessors' outputs as separate arguments, e.g.
`writingAgent.run({ outline: a.outline!, research: a.research! })`. If a
future feature needs branching (e.g. skip SEO review for some content types)
or parallel stages (e.g. technical + editorial review running concurrently
instead of sequentially), the `for` loop in
[runArticleJob.ts](../src/orchestrator/runArticleJob.ts) will need
restructuring. Mitigate by passing the whole `Article` into `stage.run`
instead of destructured fields, so the pipeline's shape can change without
touching every agent's call signature.

**Minor cleanup:** `ArticleStore` has one save method per artifact type
(`saveResearch`, `saveOutline`, `saveDraft`, ...). Fine at 7 stages; if stage
count grows a lot, consider a generic `save(id, stage, value)` keyed by the
same stage enum already used in
[routes/articles.ts](../src/server/routes/articles.ts) (`ArtifactStageSchema`),
so adding a stage doesn't also require a new store method.

## What's intentionally fine as-is (don't "fix" prematurely)

- **Filesystem-based `ArticleStore`** — one JSON file per artifact, per
  article. Fine for a single-user, single-instance app.
- **In-memory `EventBus`** (`node:events` `EventEmitter` per article ID) —
  fine as long as there's one server process.
- **Fire-and-forget job execution** (`runArticleJob(id).catch(...)` in
  [routes/articles.ts](../src/server/routes/articles.ts)) — no queue, no
  concurrency cap. Acceptable for one user running one or a few jobs at a
  time.

Revisit these three only if multi-instance deployment or true concurrent
multi-user load becomes a real requirement.

## Stage visualization UI

The hook infrastructure for this already exists end-to-end — it just isn't
fully used by the current UI yet.

**Existing pipeline (already built):**

- Agents call `ctx.emit(...)` during a run (see any agent + `AgentContext` in
  [src/agents/Agent.ts](../src/agents/Agent.ts)).
- `EventLogger.append` ([src/events/EventLogger.ts](../src/events/EventLogger.ts))
  persists each event to a per-article append-only log file **and** publishes
  it to the in-memory `EventBus`.
- `EventBus` ([src/events/EventBus.ts](../src/events/EventBus.ts)) fans the
  event out to any subscriber for that article ID.
- `GET /articles/:id/events` ([src/server/routes/events.ts](../src/server/routes/events.ts))
  streams those events to the browser over SSE.

**Event types already defined** in
[src/schemas/events.ts](../src/schemas/events.ts) — far more granular than
what the UI currently shows:

`AgentStarted`, `ThinkingStarted`, `ThinkingCompleted`, `ToolRequested`,
`ToolCompleted`, `ArtifactCreated`, `OutputProduced`, `AgentCompleted`,
`ReviewGenerated`, `Retry`, `StatusChanged`, `Completed`, `Failed`.

**Gap:** [web/app.js](../web/app.js) only handles `StatusChanged`,
`ArtifactCreated`, `Completed`/`Failed` (see lines 75-89). It ignores
`AgentStarted`, `ThinkingStarted/Completed`, `ToolRequested/Completed`,
`OutputProduced`, and `Retry` — which is most of what you'd want for a rich
per-stage visualization (e.g. showing an agent "thinking", a tool call in
flight, or a retry happening live).

**Suggested approach for the visualization UI:**

1. Replace the current linear if/else in `watchArticle`'s `EventSource`
   handler with a switch/dispatch over all event types, not just the 3
   currently handled.
2. Model UI state per stage (`agentName` → `{status, timeline: Event[]}`)
   rather than only tracking overall `ArticleStatus`, since multiple events
   arrive per stage (started → thinking → tool calls → artifact → completed).
3. `EventLogger.readAll(articleId)` already replays the full history from the
   append-only log — use it to hydrate state on page load/reconnect, then
   switch to the live SSE stream for updates, instead of only showing events
   from the moment the page was opened.
4. No backend changes are required to start this — the event schema and
   transport already carry everything needed. This is purely a frontend
   (`web/app.js` + markup) build-out.
