# Artifact Persistence Specification

## Purpose

Define how Article records, stage artifacts, Draft versions, final Markdown,
and event history are durably represented in the current filesystem store.

## Requirements

### Requirement: Isolate Article files

The filesystem store SHALL keep each Article's record, artifacts, Draft
versions, event log, and final output beneath a directory identified by that
Article's unique identifier.

#### Scenario: Create Article storage

- **WHEN** an Article is created
- **THEN** the system creates its Article directory and writes its metadata record there

#### Scenario: Read one Article

- **WHEN** an Article is loaded
- **THEN** the store reads only the record and artifact files associated with that Article identifier

### Requirement: Store stage artifacts separately

The store SHALL persist Research, Outline, current Draft, Technical Review,
Editorial Review, Revised Draft, SEO, and publication metadata as separate JSON
artifacts.

#### Scenario: Save a completed stage

- **WHEN** a stage produces valid structured output
- **THEN** the store writes that output to the stage's artifact file without modifying other stage artifacts

#### Scenario: Read an unavailable artifact

- **WHEN** an editor requests a known stage that has not produced an artifact
- **THEN** the system returns a null artifact rather than failing the Article lookup

### Requirement: Validate persisted data on load

The store MUST validate Article records and every present artifact against the
current Zod schemas before returning the assembled Article.

#### Scenario: Load valid persisted data

- **WHEN** an Article record and its artifacts conform to their schemas
- **THEN** the store returns a validated Article aggregate

#### Scenario: Apply legacy defaults

- **WHEN** a persisted Article predates a backward-compatible default such as content type
- **THEN** the store applies the supported legacy default while assembling the Article

#### Scenario: Encounter invalid persisted data

- **WHEN** a present artifact does not conform to its schema
- **THEN** the load fails rather than passing invalid data to a downstream stage

### Requirement: Preserve Draft iterations

The store MUST write each Draft to a numbered version file in addition to the
current Draft artifact.

#### Scenario: Save the initial Draft

- **WHEN** the first Draft is produced
- **THEN** the store writes Draft version zero and updates the current Draft artifact

#### Scenario: Save a later Draft

- **WHEN** a Draft Iteration is produced
- **THEN** the store writes the corresponding numbered version and retains all earlier version files

### Requirement: Materialize final Markdown

The store SHALL write the Publisher's Markdown to a standalone final Markdown
file in addition to storing publication metadata.

#### Scenario: Store publication output

- **WHEN** Publisher creates valid publication metadata
- **THEN** the store saves the metadata artifact and writes its Markdown as the Article's final Markdown file

