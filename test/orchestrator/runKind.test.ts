import { describe, expect, it } from "vitest";
import { ArticleSchema } from "../../src/schemas/article.js";
import { inferPipelineRunKind } from "../../src/orchestrator/runArticleJob.js";

function article(overrides: Record<string, unknown> = {}) {
  return ArticleSchema.parse({
    id: "article-1",
    title: null,
    status: "Queued",
    topic: "Topic",
    audience: "Audience",
    contentType: "pattern",
    depth: "overview",
    createdAt: "2026-07-13T12:00:00.000Z",
    updatedAt: "2026-07-13T12:00:00.000Z",
    ...overrides,
  });
}

describe("inferPipelineRunKind", () => {
  it("classifies initial, continuation, iteration, and retry runs", () => {
    const review = {
      iteration: 0,
      feedback: null,
      history: [],
      updatedAt: "2026-07-13T12:00:00.000Z",
    };

    expect(inferPipelineRunKind(article())).toBe("initial");
    expect(
      inferPipelineRunKind(
        article({ status: "AwaitingDraftReview", draftReview: { ...review, state: "approved" } })
      )
    ).toBe("continuation");
    expect(
      inferPipelineRunKind(
        article({
          status: "AwaitingDraftReview",
          draftReview: { ...review, state: "iteration_requested", feedback: "Try again" },
        })
      )
    ).toBe("iteration");
    expect(
      inferPipelineRunKind(
        article({ status: "Failed", draftReview: { ...review, state: "approved" } })
      )
    ).toBe("retry");
  });
});
