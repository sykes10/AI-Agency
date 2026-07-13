# Product Roadmap

This roadmap prioritizes improvements by expected user value relative to
implementation effort. The application is currently a single-owner tool, with
occasional access granted to trusted people. Multi-tenant and multi-instance
scaling are not current goals.

## Guiding principles

- Keep every generated artifact and make changes traceable.
- Optimize article quality and cost before adding more pipeline stages.
- Prefer reversible actions, especially for reruns and deletion.
- Keep deployment infrastructure simple until reliability or concurrency
  requirements justify additional components.
- Measure prompt changes against representative articles instead of relying on
  subjective prompt edits alone.

## Phase 1: Visibility and quick workflow wins

Highest ROI, low implementation effort.

### 1. Per-stage cost breakdown

Extend the existing article usage summary into a table grouped by stage, model,
run, and attempt.

Show:

- Model calls and web searches.
- Input, cached input, output, and reasoning tokens.
- Estimated cost for each stage and the whole article.
- Original-run cost separately from retry and iteration cost.
- A clear indicator when some usage cannot be priced.

Add `runId` and `attempt` to model-usage events so costs from retries can be
attributed accurately.

**Done when:** the article workspace explains where its total cost came from
and how much each retry or iteration added.

### 2. Prompt context alignment

Pass a shared article brief to every relevant agent:

```ts
{
  topic,
  audience,
  contentType,
  depth,
  targetWordRange,
  publicationProfile
}
```

Remove implicit audience assumptions from later stages. Make `pattern` and
`blueprint` articles produce meaningfully different structures, and use depth
to control scope and target length.

**Done when:** Research, Planning, Writing, Review, Revision, and SEO all
operate from the same article brief.

### 3. Make failed-stage retry explicit

The orchestrator already skips completed stages when retrying a failed job.
Reflect that behavior in the workspace:

- Rename the action to **Retry failed stage**.
- Display the failed stage and error summary.
- Display the attempt number.
- Preserve all previously completed artifacts.

**Done when:** it is clear that retrying a failure will not repay for completed
stages.

### 4. Archive and delete articles

Add reversible archive as the primary removal action. Archived articles should
be hidden from the default library and accessible from an Archive view.

Add permanent deletion as a separate confirmed action that removes the article,
artifacts, events, and associated files. Do not allow permanent deletion while
a job is active.

**Done when:** articles can be archived, restored, and deliberately deleted
without accidental data loss.

## Phase 2: Prompt quality and control

High quality impact with moderate implementation effort.

### 5. Strengthen source and prompt safety

- Treat web pages, research, drafts, reviews, and editor feedback as untrusted
  data rather than instructions.
- Delimit contextual inputs clearly in every prompt.
- Prefer primary and official sources during research.
- Record source publication or update dates when available.
- Distinguish sourced facts, community opinions, and unresolved uncertainty.
- Keep citations associated with the claims they support.

### 6. Improve individual agent contracts

#### Research

Require source hierarchy, claim-to-source traceability, relevant dates, and an
explicit list of unresolved questions. Ignore instructions found in retrieved
content.

#### Planning

Give every outline a section and word budget. A pattern should cover its
problem, forces, decision, trade-offs, and when not to use it. A blueprint
should cover boundaries, data flow, failure modes, implementation, and
operations.

#### Writing

Use the requested audience and depth, preserve research links, avoid claims not
supported by the research, and stay within the target length.

#### Technical review

Report only material and actionable findings. Each finding should have a stable
ID, severity, exact location, evidence, confidence, and proposed correction.
Independently verify critical claims when needed.

#### Editorial review

Prioritize structure and clarity over minor style preferences. Cap findings and
include an exact location and suggested replacement for each actionable issue.

#### Revision

Prioritize technical correctness over editorial preference, make the smallest
change that resolves each accepted finding, preserve working code and
citations, and run a final consistency check. Resolve findings by stable ID
rather than array position.

#### SEO

Do not invent internal links. Supply a real content catalog or return no
internal-link suggestions. Generate FAQ content only when supported by the
article.

#### Publisher

Keep publishing deterministic. Add validation and linting rather than another
model call.

### 7. Version prompts and add evaluations

- Assign a version to every production prompt.
- Store prompt version, model, and article-brief version with each artifact.
- Build a fixture set of 5–10 representative article briefs.
- Evaluate factuality, audience fit, structure, style, citation quality,
  reviewer usefulness, and cost.
- Compare a proposed prompt or model against the current baseline before
  promoting it.

**Done when:** prompt changes have measurable quality and cost results and can
be traced to the artifacts they produced.

## Phase 3: Safe hosted deployment

Required before exposing the application on a public domain.

### 8. Add simple access control

Put the entire application behind an identity-aware proxy such as Cloudflare
Access. Allow only explicit email addresses and use email one-time PINs. Avoid
building passwords and account recovery into the application at this stage.

Move to application-level authentication and owner/editor/viewer permissions
only if per-article access or sharing links become a real requirement.

**Done when:** an unauthorised visitor cannot load either the UI or API, and
access can be added or revoked by email address.

### 9. Make artifact storage durable

The local `articles/` directory must not live on an ephemeral deployment
filesystem.

For the initial single-instance deployment, use a mounted persistent volume
with automated backups. Keep the existing article-directory layout to minimize
migration work.

Move metadata and text artifacts to Postgres when one or more of these becomes
true:

- More than one application instance is needed.
- Querying and comparing artifact versions becomes cumbersome.
- Per-user or per-article authorization is introduced.
- Reliable transactional deletion is required.
- Restore, audit, or retention requirements outgrow filesystem backups.

The eventual relational model should include:

- `articles`
- `pipeline_runs`
- `artifact_versions`
- `model_usage`
- `review_decisions`

Use object storage for images, attachments, diagrams, and export bundles, not
as the primary database for small JSON and Markdown artifacts.

**Done when:** deployment, restart, and host maintenance cannot silently erase
article data, and backups have been restored successfully in a test.

### 10. Add deployment observability

- Record stage duration and attempt count.
- Surface failed runs and their errors in the library.
- Add an optional per-article cost warning.
- Add backup-health and failed-job notifications.
- Prevent API secrets and raw prompt context from appearing in logs.

## Phase 4: Versioned reruns and reliability

Higher effort; implement after the core workflow is proven.

### 11. Rerun any completed stage

Keep **Retry failed stage** separate from deliberate regeneration. Add:

- **Rerun this stage** for a new version of one artifact.
- **Rerun from this stage** to regenerate that stage and all dependants.
- Attempt history and artifact comparison.
- Restore or select a previous artifact version.

Never overwrite an old artifact. A rerun should create a new version and mark
dependent artifacts as superseded until they are regenerated.

Dependency order:

```text
Research
  -> Outline
    -> Draft
      -> Technical and editorial reviews
        -> Revision
          -> SEO
            -> Metadata
```

### 12. Durable background execution

The current in-process job runner is acceptable for a single process, but a
restart can interrupt work. Introduce a durable database-backed job table or
queue when uninterrupted execution becomes important.

The worker design should provide:

- Idempotent stage execution.
- Job leases and heartbeats.
- Recovery after process restart.
- Concurrency limits.
- Cancellation and retry policies.
- Protection against two workers processing the same article.

## Phase 5: Publishing and collaboration

Lower ROI until the core generation and review workflow is stable.

- Export Markdown and MDX.
- Commit approved articles to a configured Git repository.
- Publish through a CMS webhook.
- Add read-only sharing, comments, and mentions.
- Add owner, editor, and viewer roles.
- Add email or chat notifications for review requests and failures.

## Recommended implementation order

1. Per-stage cost breakdown.
2. Shared prompt context and content-type behavior.
3. Failed-stage retry UX.
4. Archive and permanent delete.
5. Prompt safety and agent contract improvements.
6. Prompt versions and evaluation fixtures.
7. Access control.
8. Durable hosted storage and tested backups.
9. Deployment observability.
10. Versioned reruns.
11. Durable background jobs.
12. Publishing and collaboration integrations.

## Related documentation

- [Future optimizations](future-optimizations.md)
- [Project context](../CONTEXT.md)
- [Writing style](../WRITING-STYLE.md)
