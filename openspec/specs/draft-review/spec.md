# Draft Review Specification

## Purpose

Define the editor-controlled checkpoint where a Draft can be approved,
rejected, or iterated without overwriting its decision history or prior Drafts.

## Requirements

### Requirement: Request editor review after Writing

The system SHALL create a pending Draft Review whenever Writing produces a
Draft and SHALL pause downstream pipeline execution until that Draft is
approved.

#### Scenario: Produce the first Draft

- **WHEN** Writing completes the first Draft
- **THEN** the system records Draft iteration zero, requests Draft Review, and moves the Article to `AwaitingDraftReview`

#### Scenario: Block downstream review

- **WHEN** Technical Review is reached without an approved Draft
- **THEN** the system stops processing and keeps the Article at the Draft Review checkpoint

### Requirement: Approve a Draft

The editor SHALL be able to approve a pending Draft without feedback, after
which the system SHALL resume the pipeline at Technical Review.

#### Scenario: Approve a pending Draft

- **WHEN** the editor approves a Draft awaiting review
- **THEN** the system records the approval in Draft Review history and resumes pipeline execution

### Requirement: Reject a Draft

The editor SHALL be able to reject a pending Draft only with non-empty feedback,
and the system SHALL leave the Article in `Rejected` without continuing the
pipeline.

#### Scenario: Reject with feedback

- **WHEN** the editor rejects a pending Draft and supplies feedback
- **THEN** the system records the decision and feedback and moves the Article to `Rejected`

#### Scenario: Reject without feedback

- **WHEN** the editor attempts to reject a Draft without feedback
- **THEN** the system rejects the decision request and leaves Draft Review unchanged

### Requirement: Request a Draft Iteration

The editor SHALL be able to request another Draft iteration with non-empty
feedback from either `AwaitingDraftReview` or `Rejected`.

#### Scenario: Iterate a pending Draft

- **WHEN** the editor requests iteration with feedback for a pending Draft
- **THEN** the system records the decision, increments the iteration number, and resumes Writing with the prior Draft and feedback

#### Scenario: Continue from rejection

- **WHEN** an Article is `Rejected` and the editor requests iteration with feedback
- **THEN** the system resumes at Writing

#### Scenario: Attempt another action after rejection

- **WHEN** an Article is `Rejected` and the editor attempts approval or rejection
- **THEN** the system rejects the request because only iteration is allowed

### Requirement: Preserve Draft versions and decisions

The system MUST preserve every generated Draft iteration and every Draft Review
decision with its iteration, feedback, action, and timestamp.

#### Scenario: Generate an iterated Draft

- **WHEN** Writing completes after an iteration request
- **THEN** the system stores the new Draft as a new numbered version while retaining earlier versions

#### Scenario: Read Draft history

- **WHEN** an editor requests Draft versions
- **THEN** the system returns all available numbered Draft versions in iteration order

### Requirement: Protect active processing

The system SHALL reject Draft Review decisions while the Article is actively
being processed.

#### Scenario: Decide during active execution

- **WHEN** an editor submits a Draft Review decision while the Article job is active
- **THEN** the system rejects the request without changing Draft Review state

