import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("PlanningAgent", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
  });

  it("produces a validated Outline from a ResearchReport and emits lifecycle events", async () => {
    const { PlanningAgent } = await import("../../src/agents/PlanningAgent.js");
    const agent = new PlanningAgent();

    const outline = {
      title: "Understanding Event Loops",
      subtitle: "A practical guide",
      targetAudience: "Backend engineers",
      estimatedReadingTimeMinutes: 8,
      introduction: "intro",
      sections: [
        { heading: "What is an event loop", summary: "sum", codeExamples: [], illustrationIdeas: [] },
      ],
      takeaways: ["takeaway 1"],
      conclusion: "conclusion",
    };
    generateTextMock.mockResolvedValue({ output: outline, finishReason: "stop", usage: {} });

    const events: AgentEventInput[] = [];
    const result = await agent.run(
      {
        research: {
          topic: "event loops",
          definitions: [],
          references: [],
          usefulLinks: [],
          examples: [],
          misunderstoodConcepts: [],
          openQuestions: [],
          recentChanges: [],
          commonMistakes: [],
        },
      },
      {
        articleId: "test-article",
        emit: async (event) => {
          events.push(event);
        },
      }
    );

    expect(result).toEqual(outline);
    expect(generateTextMock).toHaveBeenCalledTimes(1);
    expect(events.map((e) => e.type)).toEqual(["AgentStarted", "OutputProduced", "AgentCompleted"]);
  });

  it("throws if the model output does not match the outline schema", async () => {
    const { PlanningAgent } = await import("../../src/agents/PlanningAgent.js");
    const agent = new PlanningAgent();
    generateTextMock.mockResolvedValue({
      output: { not: "an outline" },
      finishReason: "stop",
      usage: {},
    });

    await expect(
      agent.run(
        {
          research: {
            topic: "t",
            definitions: [],
            references: [],
            usefulLinks: [],
            examples: [],
            misunderstoodConcepts: [],
            openQuestions: [],
            recentChanges: [],
            commonMistakes: [],
          },
        },
        { articleId: "a", emit: async () => {} }
      )
    ).rejects.toThrow();
  });
});
