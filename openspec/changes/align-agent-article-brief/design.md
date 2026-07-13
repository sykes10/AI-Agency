## Context

Article creation persists topic, audience, content type, and depth. Research
receives topic, audience, and depth, but content type is omitted. Planning and
all later model-driven agents receive only upstream artifacts, so they must
infer or invent the original brief. Writing, Editorial Review, Revision, and
SEO also hardcode parts of the Frontend Blueprints readership in their system
prompts.

The publication and its style guide remain fixed for this single-owner tool.
Target length is not currently an editor-entered field, but depth already gives
a stable signal from which to derive it.

## Goals / Non-Goals

**Goals:**

- Define a validated, typed Article brief shared by every model-driven stage.
- Derive it deterministically from the current Article and publication config.
- Give content type and depth concrete structural and length meaning.
- Preserve the requested audience across the entire pipeline.
- Centralize prompt-ready brief formatting and test its propagation.

**Non-Goals:**

- Add Article creation fields or change the public API.
- Persist the derived brief or migrate existing Article records.
- Make publication profiles user-configurable.
- Version prompts or add prompt evaluations in this change.
- Rewrite reviewer output schemas or source-safety rules.

## Decisions

### Derive one brief at pipeline start

Add an `ArticleBriefSchema` containing topic, audience, content type, depth,
target word range, and publication profile. `runArticleJob` will build and
validate the brief once after loading the Article, then pass it into
`buildPipeline`. Every relevant stage closure will supply that same brief to
its agent.

Rebuilding the brief inside every stage was rejected because it weakens the
guarantee that one invocation uses one coherent editorial contract. Persisting
it was rejected because all values are deterministic and no migration is
needed.

### Derive target length from depth

Use 1,200–1,800 words for `overview` and 2,500–4,000 words for `deep-dive`.
These are targets rather than output-schema constraints: Planning budgets the
shape, Writing aims for the range, and reviewers use it to identify obvious
scope drift.

Hard enforcement on Draft word count was rejected because code samples and
topic complexity make exact limits brittle.

### Keep one fixed publication profile

The default profile identifies Frontend Blueprints, its production-grade
mental-model purpose, its default competent-frontend-engineer readership, and
its direct, opinionated, evidence-led voice. The Article's requested audience
always controls assumed knowledge; the profile controls publication identity
and style.

This resolves the current conflict where a request for another audience can be
silently replaced by the hardcoded default reader.

### Centralize brief formatting and content-type guidance

A shared formatter will render the validated brief for prompts and append
specific structural guidance:

- Pattern: recurring problem, context and forces, decision, trade-offs, and
  when not to use it.
- Blueprint: system boundaries, components, data flow, failure modes,
  implementation, and operations.

Agents keep responsibility-specific instructions, but all consume the same
formatted contract. Duplicating brief interpolation across seven prompts was
rejected because fields would drift again.

## Risks / Trade-offs

- **Fixed word ranges may not fit every topic** → Treat them as editorial
  targets and leave output validation semantic rather than numeric.
- **A fixed publication profile limits future publications** → Keep it in one
  exported constant so a later configuration change has one migration point.
- **Longer prompts add repeated input tokens** → The brief is small and should
  reduce larger downstream outline and revision drift.
- **Existing artifacts were produced without the full brief** → Resumed stages
  receive the derived brief now without mutating those artifacts.

## Migration Plan

No stored data migration is required. Deploy the new schema, pipeline
signature, agent inputs, and prompt changes together. Rollback restores the old
agent signatures; persisted Article and artifact formats are unchanged.

## Open Questions

Prompt version recording and configurable target ranges remain separate roadmap
work.

