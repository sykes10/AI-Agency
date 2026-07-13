## ADDED Requirements

### Requirement: Derive a validated Article brief

The system SHALL derive one validated Article brief for each pipeline
invocation containing the Article topic, requested audience, content type,
depth, target word range, and publication profile.

#### Scenario: Build an overview brief

- **WHEN** an Article with `overview` depth begins or resumes pipeline execution
- **THEN** the system creates a brief with the Article values and a target range of 1,200 to 1,800 words

#### Scenario: Build a deep-dive brief

- **WHEN** an Article with `deep-dive` depth begins or resumes pipeline execution
- **THEN** the system creates a brief with the Article values and a target range of 2,500 to 4,000 words

#### Scenario: Validate a derived brief

- **WHEN** the system derives an Article brief
- **THEN** it validates every brief field before any model-driven stage consumes it

### Requirement: Preserve publication identity and requested audience

The Article brief SHALL identify Frontend Blueprints and its editorial purpose,
default readership, and voice, while the Article's requested audience MUST
control the knowledge assumptions used for that Article.

#### Scenario: Requested audience differs from the publication default

- **WHEN** an Article targets an audience other than competent frontend engineers
- **THEN** every consuming agent uses the requested audience for assumed knowledge while retaining the Frontend Blueprints publication voice

### Requirement: Define content-type guidance

The Article brief formatter SHALL provide distinct structural guidance for
Pattern and Blueprint content.

#### Scenario: Format a Pattern brief

- **WHEN** the Article content type is `pattern`
- **THEN** the formatted brief calls for a recurring problem, context and forces, decision, trade-offs, and when not to use it

#### Scenario: Format a Blueprint brief

- **WHEN** the Article content type is `blueprint`
- **THEN** the formatted brief calls for system boundaries, components, data flow, failure modes, implementation, and operations

### Requirement: Avoid Article storage migration

The system SHALL derive the Article brief at execution time without adding the
derived target range or publication profile to persisted Article records.

#### Scenario: Load an existing Article

- **WHEN** a previously stored Article resumes pipeline execution
- **THEN** the system derives a complete current brief from its existing fields without modifying its stored record

