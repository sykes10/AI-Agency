## MODIFIED Requirements

### Requirement: Show cost and activity

The workspace SHALL display the Article's aggregate estimated cost when model
usage exists, SHALL provide an expandable tabular breakdown grouped by pipeline
run, stage, model, and attempt, and SHALL provide an activity drawer populated
from the Article's event stream. The breakdown MUST show calls, input, cached
input, output, reasoning tokens, searches, cost, and incomplete-pricing state.

#### Scenario: Show fully priced cost

- **WHEN** an Article has fully priced model usage
- **THEN** the workspace labels the aggregate amount as estimated and exposes call and token totals

#### Scenario: Show partially priced cost

- **WHEN** some Article usage cannot be priced
- **THEN** the workspace labels the aggregate amount as partially estimated in both the total and affected breakdown rows

#### Scenario: Inspect cost by stage

- **WHEN** the editor expands the cost breakdown
- **THEN** the workspace displays each run, stage, model, and attempt row with its calls, token categories, searches, and estimated cost

#### Scenario: Distinguish additional work

- **WHEN** usage was produced by a retry, Draft iteration, or post-approval continuation
- **THEN** the workspace labels the corresponding breakdown row with that run kind

#### Scenario: Show legacy usage

- **WHEN** usage predates run and attempt attribution
- **THEN** the workspace labels the corresponding row as historical usage

#### Scenario: Receive pipeline activity

- **WHEN** the workspace receives a historical or live Article event
- **THEN** it appends the event to the Article activity display and refreshes relevant Article state for material events
