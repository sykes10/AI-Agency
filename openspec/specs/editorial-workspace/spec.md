# Editorial Workspace Specification

## Purpose

Define the private browser workspace used to create Articles, browse their
progress, inspect artifacts, review Drafts, monitor activity, and retry failures.

## Requirements

### Requirement: Browse the Article library

The workspace SHALL display Article summaries ordered by most recent update and
allow the editor to search by title or topic and filter by workflow group.

#### Scenario: View the library

- **WHEN** the editor opens the home page
- **THEN** the workspace lists Articles with title or topic, content type, status, and update date

#### Scenario: Search Articles

- **WHEN** the editor enters a search query
- **THEN** the workspace shows only Articles whose title or topic contains that query

#### Scenario: Filter Articles

- **WHEN** the editor selects a workflow filter
- **THEN** the workspace shows only Articles belonging to that active, review, or published group

### Requirement: Create an Article from the workspace

The workspace SHALL provide an Article creation form for topic, audience,
content type, and depth and SHALL open the new Article after successful
creation.

#### Scenario: Submit a valid brief

- **WHEN** the editor submits a valid Article brief
- **THEN** the workspace creates the Article and navigates to its Article workspace

#### Scenario: Handle creation failure

- **WHEN** Article creation fails
- **THEN** the workspace displays the error and keeps the creation form available

### Requirement: Navigate Article stages

The Article workspace SHALL show the pipeline stages, mark completed artifacts,
identify the current stage, and prevent unavailable future artifacts from being
selected.

#### Scenario: Open an Article

- **WHEN** the editor opens an existing Article
- **THEN** the workspace displays its title or topic, audience, content type, status, current stage, and completed stages

#### Scenario: Select a completed stage

- **WHEN** the editor selects a stage with an artifact
- **THEN** the workspace loads and displays that stage's artifact

### Requirement: Inspect artifacts safely

The workspace SHALL provide stage-specific previews and a raw JSON view for
available artifacts, sanitize rendered Markdown, and allow only HTTP or HTTPS
reference links.

#### Scenario: Preview an artifact

- **WHEN** the editor selects preview mode
- **THEN** the workspace renders the artifact using the presentation appropriate to its stage

#### Scenario: Inspect raw data

- **WHEN** the editor selects raw mode
- **THEN** the workspace displays the artifact as formatted JSON

#### Scenario: Render Draft Markdown

- **WHEN** a Draft, Revised Draft, or published Markdown is previewed
- **THEN** the workspace sanitizes the rendered HTML before inserting it into the page

### Requirement: Perform Draft Review

The workspace SHALL expose approve, reject, and iterate controls when an
Article is awaiting Draft Review and SHALL require feedback for reject and
iterate decisions.

#### Scenario: Review a pending Draft

- **WHEN** the editor opens the Draft stage of an Article awaiting review
- **THEN** the workspace displays the Draft Review controls and feedback field

#### Scenario: Review a rejected Draft

- **WHEN** the editor opens the Draft stage of a rejected Article
- **THEN** the workspace shows the prior feedback and offers iteration as the available continuation

### Requirement: Show cost and activity

The workspace SHALL display the Article's aggregate estimated cost when model
usage exists and SHALL provide an activity drawer populated from the Article's
event stream.

#### Scenario: Show fully priced cost

- **WHEN** an Article has fully priced model usage
- **THEN** the workspace labels the aggregate amount as estimated and exposes call and token totals

#### Scenario: Show partially priced cost

- **WHEN** some Article usage cannot be priced
- **THEN** the workspace labels the aggregate amount as partially estimated

#### Scenario: Receive pipeline activity

- **WHEN** the workspace receives a historical or live Article event
- **THEN** it appends the event to the Article activity display and refreshes relevant Article state for material events

### Requirement: Retry a failed Article

The workspace SHALL offer retry only when the Article is `Failed` and SHALL
request resumed processing without discarding completed artifacts.

#### Scenario: Retry from the workspace

- **WHEN** the editor selects retry on a failed Article
- **THEN** the workspace requests pipeline execution and resumes watching Article events

