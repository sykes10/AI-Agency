# Editorial Pipeline Specification

## Purpose

Define the ordered agent pipeline that converts an Article brief into reviewed,
revised, search-ready, and deterministically published editorial artifacts.

## Requirements

### Requirement: Execute specialized stages in order

The system SHALL execute Research, Planning, Writing, Technical Review,
Editorial Review, Revision, SEO, and Publisher stages in dependency order, with
the Draft Review checkpoint between Writing and Technical Review.

#### Scenario: Process an approved Article

- **WHEN** each stage succeeds and the editor approves the Draft
- **THEN** the system executes every remaining stage in order and finishes the Article as `Published`

#### Scenario: Pause for Draft Review

- **WHEN** Writing creates a Draft that has not been approved
- **THEN** the system stops before Technical Review and leaves the Article awaiting the editor's decision

### Requirement: Produce structured artifacts

Each model-driven stage MUST return output that conforms to its stage-specific
Zod schema before the artifact is stored or consumed by another stage.

#### Scenario: Accept valid structured output

- **WHEN** an agent returns output conforming to its stage schema
- **THEN** the system stores the artifact and makes it available to dependent stages

#### Scenario: Reject invalid structured output

- **WHEN** an agent returns output that does not conform to its stage schema
- **THEN** the stage attempt fails and the invalid artifact is not stored

### Requirement: Preserve stage responsibilities

The system SHALL keep research, planning, writing, technical review, editorial
review, revision, SEO, and publishing as separate responsibilities connected
only through structured inputs and outputs.

#### Scenario: Consume upstream artifacts

- **WHEN** a stage begins
- **THEN** it receives the validated upstream artifacts required for its responsibility without directly invoking another agent

### Requirement: Select models and output budgets by stage

The system SHALL select an OpenAI model and maximum output-token budget for
each model-driven stage, with support for a global model override and a
stage-specific environment override.

#### Scenario: Use default stage configuration

- **WHEN** no model override is configured
- **THEN** each stage uses its declared default OpenAI model and output-token budget

#### Scenario: Use a stage-specific override

- **WHEN** a stage-specific model environment variable is configured
- **THEN** that model is used for the corresponding stage

### Requirement: Retry transient stage failures

The orchestrator SHALL make up to three total attempts for a failed stage,
emit a Retry event before each additional attempt, and use increasing backoff
between attempts.

#### Scenario: Recover on a later attempt

- **WHEN** a stage fails and then succeeds within its allowed attempts
- **THEN** the system stores the successful artifact and continues the pipeline

#### Scenario: Exhaust stage attempts

- **WHEN** all allowed attempts for a stage fail
- **THEN** the system records the Article as `Failed`, emits a failure event, and stops processing

### Requirement: Resume without repeating completed stages

The orchestrator SHALL treat an existing valid artifact as completion of its
stage and skip that stage during a resumed run.

#### Scenario: Retry a failed Article

- **WHEN** an editor retries an Article after a stage failure
- **THEN** the system skips stages with existing artifacts and resumes at the first incomplete stage

### Requirement: Publish deterministically

The Publisher SHALL combine the Revised Draft, SEO report, and Outline into
validated publication metadata and final Markdown without making another model
call.

#### Scenario: Complete publication

- **WHEN** Revision and SEO artifacts are available
- **THEN** Publisher creates publication metadata and final Markdown and the Article becomes `Published`

