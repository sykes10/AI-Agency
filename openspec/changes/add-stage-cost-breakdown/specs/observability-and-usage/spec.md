## MODIFIED Requirements

### Requirement: Record model usage by stage

The system SHALL emit a Model Usage event for each model call with its stage,
model, input tokens, output tokens, reasoning tokens, cache token counts, web
search count, and estimated cost when pricing is known. New events emitted
during Article processing SHALL also record the pipeline run identifier, run
kind, and one-based stage attempt, while events without that attribution MUST
remain readable.

#### Scenario: Price a known model call

- **WHEN** a model call completes for a model with configured pricing
- **THEN** the system records token usage, web searches, and a non-null estimated cost

#### Scenario: Record an unknown model price

- **WHEN** a model call completes for a model without configured pricing
- **THEN** the system records its usage with a null estimated cost

#### Scenario: Attribute an orchestrated model call

- **WHEN** a model call completes during a pipeline stage attempt
- **THEN** its Model Usage event records that invocation's run identifier, run kind, and one-based attempt

#### Scenario: Read a legacy usage event

- **WHEN** an existing Model Usage event has no run or attempt attribution
- **THEN** the system validates and includes the event as historical unattributed usage

### Requirement: Summarize Article usage

The system SHALL provide an Article-level usage summary across all recorded
Model Usage events, preserving aggregate totals and adding rows grouped by run
identifier, run kind, stage, model, and attempt.

#### Scenario: Summarize fully priced usage

- **WHEN** every Model Usage event for an Article has a known estimated cost
- **THEN** the summary returns totals for calls, tokens, searches, and cost with `fullyPriced` set to true

#### Scenario: Summarize partially priced usage

- **WHEN** one or more Model Usage events have no estimated cost
- **THEN** the summary totals known costs and usage and sets `fullyPriced` to false

#### Scenario: Group attributed usage

- **WHEN** an Article has Model Usage events from multiple stages, attempts, models, or pipeline runs
- **THEN** the summary returns a separate breakdown row for each unique combination with its own totals and pricing completeness

#### Scenario: Group legacy usage

- **WHEN** an Article has Model Usage events without run attribution
- **THEN** the summary includes those events in an explicitly historical breakdown row and in the Article totals

