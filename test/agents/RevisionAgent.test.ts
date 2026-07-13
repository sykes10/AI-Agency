import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentEventInput } from "../../src/schemas/events.js";

const generateTextMock = vi.fn();

vi.mock("ai", () => ({
  generateText: generateTextMock,
  Output: { object: (opts: unknown) => opts },
  stepCountIs: (n: number) => n,
}));

vi.mock("../../src/llm/provider.js", () => ({
  model: {},
  DEFAULT_MAX_TOKENS: 8192,
  PROVIDER_NAME: "anthropic",
  MODEL_ID: "claude-sonnet-5",
}));

const INPUT = {
  draft: { title: "Original", subtitle: "Sub", body: "Original body." },
  outline: {
    title: "Original",
    subtitle: "Sub",
    targetAudience: "Frontend engineers",
    estimatedReadingTimeMinutes: 5,
    introduction: "intro",
    sections: [],
    takeaways: [],
    conclusion: "end",
  },
  research: {
    topic: "topic",
    definitions: [],
    references: [],
    usefulLinks: [],
    examples: [],
    misunderstoodConcepts: [],
    openQuestions: [],
    recentChanges: [],
    commonMistakes: [],
  },
  technicalReview: {
    issues: [
      { issue: "Incorrect claim", severity: "high" as const, suggestedFix: "Correct it", reason: "Evidence" },
    ],
  },
  editorialReview: {
    suggestions: [
      { location: "Paragraph 1", issue: "Wordy", suggestion: "Tighten it" },
    ],
  },
};

describe("RevisionAgent", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
  });

  it("produces a Revised Draft with exactly one decision per review finding", async () => {
    const revisedDraft = {
      title: "Original",
      subtitle: "Sub",
      body: "Corrected and tightened body.",
      resolutions: [
        { source: "technical", findingIndex: 0, decision: "applied", reason: "Corrected the claim." },
        { source: "editorial", findingIndex: 0, decision: "applied", reason: "Tightened paragraph 1." },
      ],
    };
    generateTextMock.mockResolvedValue({ output: revisedDraft, finishReason: "stop", usage: {} });

    const { RevisionAgent } = await import("../../src/agents/RevisionAgent.js");
    const events: AgentEventInput[] = [];
    const result = await new RevisionAgent().run(INPUT, {
      articleId: "article-1",
      emit: async (event) => {
        events.push(event);
      },
    });

    expect(result).toEqual(revisedDraft);
    expect(events.map((event) => event.type)).toEqual([
      "AgentStarted",
      "OutputProduced",
      "AgentCompleted",
    ]);
  });

  it("rejects a revision that omits a review finding", async () => {
    generateTextMock.mockResolvedValue({
      output: {
        title: "Original",
        subtitle: "Sub",
        body: "Only partly revised.",
        resolutions: [
          { source: "technical", findingIndex: 0, decision: "applied", reason: "Corrected it." },
        ],
      },
      finishReason: "stop",
      usage: {},
    });

    const { RevisionAgent } = await import("../../src/agents/RevisionAgent.js");
    await expect(
      new RevisionAgent().run(INPUT, { articleId: "article-1", emit: async () => {} })
    ).rejects.toThrow("Revision must resolve every editorial finding exactly once");
  });
});
