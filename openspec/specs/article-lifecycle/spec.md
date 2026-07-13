# Article Lifecycle Specification

## Purpose

Define how an Article is created, identified, queried, and moved through its
observable lifecycle while preserving validated inputs and failure state.

## Requirements

### Requirement: Create an Article

The system SHALL create an Article from a non-empty topic, non-empty audience,
content type, and optional depth. It SHALL assign a unique identifier, default
an omitted depth to `deep-dive`, and initialize the Article as `Queued`.

#### Scenario: Create a valid Article

- **WHEN** an editor submits a topic, audience, content type, and depth
- **THEN** the system creates an Article with those values, timestamps, a unique identifier, and `Queued` status

#### Scenario: Apply the default depth

- **WHEN** an editor creates an Article without a depth
- **THEN** the system stores the Article with `deep-dive` depth

#### Scenario: Reject invalid creation input

- **WHEN** an editor submits an empty topic, empty audience, or unsupported content type
- **THEN** the system rejects the request with validation details and does not create an Article

### Requirement: Query Articles

The system SHALL allow an editor to list Article summaries and retrieve a full
Article by identifier, including all currently available artifacts and errors.

#### Scenario: List Article summaries

- **WHEN** an editor requests the Article library
- **THEN** the system returns each Article's identifier, title, status, topic, content type, and timestamps

#### Scenario: Retrieve an Article

- **WHEN** an editor requests an existing Article by identifier
- **THEN** the system returns its metadata, current status, available artifacts, Draft Review, and error state

#### Scenario: Retrieve a missing Article

- **WHEN** an editor requests an unknown Article identifier
- **THEN** the system returns a not-found response

### Requirement: Enforce lifecycle transitions

The system MUST enforce the defined forward Article status sequence while
allowing Draft Review decisions, failure, same-stage retry, and resumption from
`Failed`.

#### Scenario: Advance normally

- **WHEN** a pipeline stage completes and the next stage is ready
- **THEN** the Article advances to the next valid lifecycle status

#### Scenario: Enter failure state

- **WHEN** a stage exhausts its retry attempts
- **THEN** the Article moves to `Failed` and stores the final error message

#### Scenario: Reject an invalid transition

- **WHEN** orchestration attempts a transition that is neither the next valid status nor an allowed review or retry transition
- **THEN** the system rejects the transition

### Requirement: Prevent duplicate active execution

The system SHALL prevent the same Article from being processed more than once
concurrently within the running server process.

#### Scenario: Submit an already active Article

- **WHEN** an Article is already being processed and another execution is requested
- **THEN** the system rejects the duplicate execution request

