## ADDED Requirements

### Requirement: Propagate the Article brief through model-driven stages

The system SHALL pass the same validated Article brief to Research, Planning,
Writing, Technical Review, Editorial Review, Revision, and SEO during one
pipeline invocation.

#### Scenario: Execute the initial pipeline

- **WHEN** an Article begins Research, Planning, and Writing
- **THEN** each stage receives the same brief with topic, audience, content type, depth, target word range, and publication profile

#### Scenario: Continue after Draft approval

- **WHEN** an approved Article continues through Reviews, Revision, and SEO
- **THEN** each remaining model-driven stage receives a brief derived from the Article's original editorial inputs

#### Scenario: Produce a Draft Iteration

- **WHEN** Writing runs again from editor feedback
- **THEN** Writing receives the same editorial brief in addition to the previous Draft and feedback

### Requirement: Align stage output to the Article brief

Each model-driven stage SHALL use the Article brief for its responsibility,
including requested-audience assumptions, content-type structure, depth, target
length, and publication voice where applicable.

#### Scenario: Plan a Pattern

- **WHEN** Planning receives a Pattern brief
- **THEN** it produces an outline organized around the Pattern guidance and target length rather than a generic article structure

#### Scenario: Plan a Blueprint

- **WHEN** Planning receives a Blueprint brief
- **THEN** it produces an outline organized around the Blueprint guidance and target length rather than a generic article structure

#### Scenario: Write for the requested audience

- **WHEN** Writing receives a brief whose requested audience differs from the publication default
- **THEN** it uses the requested audience's assumed knowledge without changing the publication voice

#### Scenario: Review scope and audience fit

- **WHEN** either Review stage evaluates a Draft
- **THEN** it uses the brief to identify material audience, structure, depth, or length drift relevant to that review's responsibility

#### Scenario: Preserve alignment through Revision and SEO

- **WHEN** Revision or SEO processes an approved Draft
- **THEN** it uses the brief to preserve the requested audience, content type, scope, and publication identity
