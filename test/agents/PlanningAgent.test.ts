import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentEventInput } from "../../src/schemas/events.js";

const parseMock = vi.fn();

vi.mock("../../src/llm/anthropicClient.js", () => ({
  anthropic: { messages: { parse: parseMock } },
  MODEL: "claude-sonnet-5",
  DEFAULT_MAX_TOKENS: 8192,
}));

describe("PlanningAgent", () => {
  beforeEach(() => {
    parseMock.mockReset();
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
    parseMock.mockResolvedValue({ parsed_output: outline });

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
    expect(parseMock).toHaveBeenCalledTimes(1);
    expect(events.map((e) => e.type)).toEqual(["AgentStarted", "OutputProduced", "AgentCompleted"]);
  });

  it("throws if the model output does not match the outline schema", async () => {
    const { PlanningAgent } = await import("../../src/agents/PlanningAgent.js");
    const agent = new PlanningAgent();
    parseMock.mockResolvedValue({ parsed_output: { not: "an outline" } });

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
