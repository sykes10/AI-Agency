## Why

The Article's audience, depth, and content type are lost after early pipeline
stages, while later prompts fall back to hardcoded readership assumptions. This
causes avoidable outline drift, inconsistent scope, and revision work.

## What Changes

- Derive one validated Article brief from the Article before pipeline execution.
- Include topic, requested audience, content type, depth, target word range, and
  the Frontend Blueprints publication profile in that brief.
- Pass the same brief through Research, Planning, Writing, Technical Review,
  Editorial Review, Revision, and SEO.
- Make Planning and Writing distinguish Pattern structure from Blueprint
  structure and respect the requested depth and length range.
- Replace hardcoded audience assumptions in later agents with the requested
  audience while retaining the publication's established voice and style.
- Test brief derivation, propagation, input validation, and prompt context.

## Capabilities

### New Capabilities

- `article-brief`: Deterministic derivation and validation of the shared
  editorial context supplied to model-driven stages.

### Modified Capabilities

- `editorial-pipeline`: Relevant stages consume the shared Article brief and
  align their work to its audience, content type, depth, length, and publication
  profile.

## Impact

- New Article brief schema and formatting helper.
- Input schemas and prompts for all seven model-driven agents.
- Orchestrator stage inputs.
- Agent and orchestration tests.
- No API, storage-format, model-selection, or Publisher behavior change.
