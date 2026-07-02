# Press Agency v1

## Technical Design Document

### Overview

Press Agency is a multi-agent content creation system that transforms a topic into a high-quality technical article through a series of specialized agents.

Each agent owns a single responsibility and communicates only through structured outputs. No agent attempts to do another agent's work.

The primary goals are:

* Produce technically accurate long-form content.
* Minimize hallucinations.
* Maintain a consistent writing style.
* Generate reusable research artifacts.
* Make every decision observable and replayable.
* Be framework-agnostic and support future visualization.

---

# High-Level Architecture

```
User

↓

Orchestrator

↓

Research

↓

Planner

↓

Writer

↓

Technical Review

↓

Editorial Review

↓

SEO Review

↓

Publisher
```

Each stage receives structured input and produces structured output.

No agent communicates directly with another.

Only the orchestrator manages execution.

---

# Core Principles

## Single Responsibility

Each agent solves exactly one problem.

Never combine:

* research + writing
* writing + editing
* editing + SEO

---

## Structured Outputs

Every response should follow a schema.

Avoid free-form responses whenever possible.

Example:

```json
{
  "summary": "...",
  "references": [],
  "questions": [],
  "risks": []
}
```

---

## Immutable Context

Every stage receives:

* user request
* previous outputs

No stage modifies previous artifacts.

---

## Observable

Every important action emits an event.

```
AgentStarted

Thinking

ToolCalled

ToolFinished

AgentCompleted

OutputProduced
```

This enables replay and visualization later.

---

# Agent Specifications

## 1. Research Agent

### Goal

Become an expert on the requested topic.

### Input

```
Topic

Audience

Desired depth
```

### Responsibilities

Research:

* concepts
* terminology
* official documentation
* recent changes
* community opinions
* common mistakes
* edge cases

### Output

```
Research Report

Definitions

References

Useful links

Examples

Frequently misunderstood concepts

Open questions
```

Never write paragraphs intended for publication.

---

## 2. Planning Agent

### Goal

Transform research into a logical article structure.

### Input

Research Report

### Responsibilities

Create:

* title
* subtitle
* target audience
* estimated reading time
* section hierarchy
* examples
* diagrams to include
* conclusion

### Output

```
Outline

Introduction

Section list

Code examples

Illustration ideas

Takeaways
```

---

## 3. Writing Agent

### Goal

Write the first complete draft.

### Responsibilities

* follow outline
* explain concepts clearly
* use technical language correctly
* provide examples
* avoid repetition

### Style Rules

Write like a senior engineer teaching another engineer.

Never write:

* marketing copy
* exaggerated claims
* clickbait

Prefer:

* examples
* diagrams
* trade-offs
* practical advice

---

## 4. Technical Reviewer

### Goal

Challenge every technical statement.

### Checklist

Verify:

* correctness
* terminology
* API usage
* architectural claims
* edge cases
* security concerns
* performance considerations

Output:

```
Issue

Severity

Suggested Fix

Reason
```

Do not rewrite the article.

Only review it.

---

## 5. Editorial Reviewer

### Goal

Improve readability.

Check:

* paragraph length
* transitions
* duplicated information
* pacing
* clarity
* consistency
* grammar

Output:

Annotated suggestions.

---

## 6. SEO Agent

### Goal

Optimize discoverability without harming technical quality.

Generate:

* slug
* meta title
* meta description
* keywords
* FAQ
* schema suggestions
* internal linking suggestions
* external linking suggestions

SEO is never allowed to change technical correctness.

---

## 7. Publisher

### Goal

Assemble the final artifact.

Outputs:

* Markdown
* HTML
* MDX
* Metadata
* Images list
* Reading time
* Table of contents

---

# Shared Data Model

```
Article

id

title

status

topic

audience

createdAt

updatedAt

research

outline

draft

reviews

seo

metadata
```

---

# Workflow States

```
Queued

↓

Researching

↓

Planning

↓

Writing

↓

Technical Review

↓

Editorial Review

↓

SEO Review

↓

Ready

↓

Published
```

Each transition emits an event.

---

# Agent Interface

Every agent implements:

```
run(input)

↓

validate()

↓

produceOutput()

↓

emitEvents()

↓

returnResult()
```

This makes every agent interchangeable.

---

# Event System

```
AgentStarted

ThinkingStarted

ThinkingCompleted

ToolRequested

ToolCompleted

ArtifactCreated

ReviewGenerated

Retry

Completed

Failed
```

These events will power future visualization.

---

# Future Tool Integrations

Research

* Web search
* Documentation retrieval
* GitHub repositories
* Academic papers

Publishing

* GitHub
* Blog CMS
* Notion
* Markdown export

Media

* Diagram generation
* Image generation
* Code execution
* Syntax highlighting

---

# Configuration

Example configuration:

```yaml
article:
  language: en
  audience: Senior Frontend Engineers
  style: Educational
  tone: Professional
  depth: Deep Dive

review:
  technical: true
  editorial: true
  seo: true

publishing:
  markdown: true
  html: true
```

---

# Future Enhancements

## Knowledge Base

Persist reusable research so future articles can build on previous work.

---

## Memory

Remember:

* preferred writing style
* banned phrases
* preferred examples
* favorite analogies
* terminology preferences

---

## Human Approval Gates

Optional approval after:

* Research
* Outline
* Draft
* Final Review

---

## Planned: Idea-to-PR Workflow (v2)

### Overview

Replace the structured `{topic, audience, depth}` intake with a free-text idea, add a mandatory human approval gate before publish, and make publish mean "open a PR on the articles repo" rather than writing files locally.

### Idea Intake

* New `IdeaIntakeAgent`: takes a raw pasted idea, derives `{topic, audience, depth}`.
* `CreateArticleRequestSchema` gains an `{ idea: string }` variant.
* Raw idea is stored on the `Article` record for traceability/replay.
* Web UI: textarea replaces the topic/audience/depth form.

### Approval Gate

* New `ArticleStatus`: `AwaitingApproval`, inserted between `SEOReview` and the final publish step.
* `runArticleJob` stops at `AwaitingApproval` instead of running straight through to publish.
* `POST /articles/:id/approve` resumes the job to run the publish step.
* `POST /articles/:id/reject` sets a terminal `Rejected` status. No PR is created.
* `POST /articles/:id/iterate` takes feedback text, re-runs from the relevant stage (likely Writing) with the feedback appended as input, clears downstream artifacts (`draft`, `reviews`, `seo`), and returns to `AwaitingApproval`.

### Publish Step (revised)

* Triggered only by Approve — never automatic.
* Assembles the `.mdx` file (frontmatter + body, same shape as current `Publisher.produceOutput`) using `seo.slug` as the filename.
* Fixed convention for v2 (no per-article override): one configured target repo, one content path pattern (e.g. `content/posts/<slug>.mdx`), one branch prefix (e.g. `article/<slug>`).
* Uses the `gh` CLI (relies on the host machine's already-authenticated `gh`) to checkout the target repo, create the branch, commit the file, push, and `gh pr create`.
* `Published` status is renamed to `PRCreated` — the real publish (merge) happens manually on GitHub afterward.
* PR URL is stored on the `Article` record and surfaced in the UI once available.

### Config Needed

* Target repo path/URL, content subfolder, branch prefix — env var or config file, fixed convention, no per-article override in v2.

### Web UI Additions

* Idea textarea + submit (replaces structured form).
* Review screen for `AwaitingApproval`: renders draft/SEO preview with Approve / Reject / Iterate (+ feedback box) actions.
* After approval, show the PR link once created.

### Open Questions

* Should iterate always restart from Writing, or let the user pick which stage to redo?
* Should rejected articles be deletable, or archived indefinitely with status `Rejected`?

---

## Parallel Execution

Run independent tasks simultaneously.

Example:

```
Research

├── Documentation

├── Reddit

├── GitHub

└── Academic Sources
```

Merge results before planning.

---

## Evaluation Layer

Automatically score each article on:

* Technical accuracy
* Completeness
* Readability
* SEO
* Originality
* Citation quality
* Hallucination risk

---

# Non-Functional Requirements

* Every stage must be deterministic where possible.
* Every artifact should be versioned.
* Outputs should be resumable after failures.
* Agents should be independently testable.
* Every execution must be replayable from recorded events.
* Components should be replaceable without affecting the rest of the system.
* The orchestration layer should support retries and future parallel execution.

---

# Version 1 Scope

The first release should include only:

* Research Agent
* Planning Agent
* Writing Agent
* Technical Reviewer
* Editorial Reviewer
* SEO Agent
* Markdown Publisher
* Event logging
* Simple orchestration

The objective is not to build the most intelligent writing system. The objective is to build a reliable, observable, and extensible content production pipeline that can later serve as the reference implementation for a broader AI agent platform.
