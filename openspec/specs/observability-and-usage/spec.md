# Observability and Usage Specification

## Purpose

Define the Article-scoped event history, live event stream, model usage records,
and aggregate cost estimate used to make pipeline execution observable.

## Requirements

### Requirement: Persist Article events

The system SHALL validate, timestamp, and append each pipeline event to the
corresponding Article's JSON Lines event log.

#### Scenario: Record an event

- **WHEN** an agent, orchestrator action, Draft Review decision, retry, completion, or failure emits an event
- **THEN** the system appends a timestamped validated event to that Article's event log

#### Scenario: Read event history

- **WHEN** an Article has recorded events
- **THEN** the system can read them in append order as validated events

### Requirement: Stream historical and live events

The system SHALL expose an Article-scoped server-sent event stream that replays
persisted history, forwards newly published events, and sends periodic
keep-alive messages until the client disconnects.

#### Scenario: Connect to an existing Article stream

- **WHEN** a client opens the event stream for an existing Article
- **THEN** the system sends historical events first and then forwards live events for that Article

#### Scenario: Connect to a missing Article stream

- **WHEN** a client requests an event stream for an unknown Article
- **THEN** the system returns a not-found response instead of opening a stream

#### Scenario: Disconnect from a stream

- **WHEN** the client closes the connection
- **THEN** the system stops keep-alives and unsubscribes the connection from live events

### Requirement: Record model usage by stage

The system SHALL emit a Model Usage event for each model call with its stage,
model, input tokens, output tokens, reasoning tokens, cache token counts, web
search count, and estimated cost when pricing is known.

#### Scenario: Price a known model call

- **WHEN** a model call completes for a model with configured pricing
- **THEN** the system records token usage, web searches, and a non-null estimated cost

#### Scenario: Record an unknown model price

- **WHEN** a model call completes for a model without configured pricing
- **THEN** the system records its usage with a null estimated cost

### Requirement: Summarize Article usage

The system SHALL provide an Article-level usage summary across all recorded
Model Usage events.

#### Scenario: Summarize fully priced usage

- **WHEN** every Model Usage event for an Article has a known estimated cost
- **THEN** the summary returns totals for calls, tokens, searches, and cost with `fullyPriced` set to true

#### Scenario: Summarize partially priced usage

- **WHEN** one or more Model Usage events have no estimated cost
- **THEN** the summary totals known costs and usage and sets `fullyPriced` to false

