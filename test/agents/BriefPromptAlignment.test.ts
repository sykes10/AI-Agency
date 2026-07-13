import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildArticleBrief } from "../../src/schemas/articleBrief.js";

const generateTextMock = vi.fn();

vi.mock("ai", () => ({
  generateText: generateTextMock,
  Output: { object: (opts: unknown) => opts },
  stepCountIs: (n: number) => n,
}));

vi.mock("../../src/llm/provider.js", () => ({
  modelFor: () => ({}),
  MODEL_IDS: {
    research: "gpt-5.6-terra",
    writing: "gpt-5.6-sol",
    technicalReview: "gpt-5.6-sol",
    editorialReview: "gpt-5.6-terra",
    seo: "gpt-5.6-luna",
  },
  MAX_OUTPUT_TOKENS: {
    research: 16_384,
    writing: 32_768,
    technicalReview: 16_384,
    editorialReview: 16_384,
    seo: 8_192,
  },
}));

vi.mock("../../src/llm/getWebSearchTool.js", () => ({
  getWebSearchTool: () => null,
}));

const USAGE = {
  inputTokens: 100,
  inputTokenDetails: { noCacheTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0 },
  outputTokens: 50,
  outputTokenDetails: { textTokens: 45, reasoningTokens: 5 },
  totalTokens: 150,
};

const BRIEF = buildArticleBrief({
  topic: "Event-driven API design",
  audience: "Backend engineers",
  contentType: "blueprint",
  depth: "deep-dive",
});

const RESEARCH = {
  topic: BRIEF.topic,
  definitions: [],
  references: [],
  usefulLinks: [],
  examples: [],
  misunderstoodConcepts: [],
  openQuestions: [],
  recentChanges: [],
  commonMistakes: [],
};

const OUTLINE = {
  title: "Event-driven APIs",
  subtitle: "Boundaries and failure modes",
  targetAudience: BRIEF.audience,
  estimatedReadingTimeMinutes: 15,
  introduction: "Introduction",
  sections: [],
  takeaways: [],
  conclusion: "Conclusion",
};

const DRAFT = { title: OUTLINE.title, subtitle: OUTLINE.subtitle, body: "Draft body." };

describe("Article brief prompt alignment", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
  });

  it("includes the shared brief in Research, Writing, both Reviews, and SEO", async () => {
    generateTextMock
      .mockResolvedValueOnce({ text: "Research notes", content: [], usage: USAGE })
      .mockResolvedValueOnce({ output: RESEARCH, finishReason: "stop", usage: USAGE })
      .mockResolvedValueOnce({ output: DRAFT, finishReason: "stop", usage: USAGE })
      .mockResolvedValueOnce({ output: { issues: [] }, finishReason: "stop", usage: USAGE })
      .mockResolvedValueOnce({ output: { suggestions: [] }, finishReason: "stop", usage: USAGE })
      .mockResolvedValueOnce({
        output: {
          slug: "event-driven-apis",
          metaTitle: "Event-driven APIs",
          metaDescription: "A production blueprint for event-driven APIs.",
          keywords: [],
          faq: [],
          schemaSuggestions: [],
          internalLinkingSuggestions: [],
          externalLinkingSuggestions: [],
        },
        finishReason: "stop",
        usage: USAGE,
      });

    const [{ ResearchAgent }, { WritingAgent }, { TechnicalReviewerAgent }, { EditorialReviewerAgent }, { SeoAgent }] =
      await Promise.all([
        import("../../src/agents/ResearchAgent.js"),
        import("../../src/agents/WritingAgent.js"),
        import("../../src/agents/TechnicalReviewerAgent.js"),
        import("../../src/agents/EditorialReviewerAgent.js"),
        import("../../src/agents/SeoAgent.js"),
      ]);
    const ctx = { articleId: "article-1", emit: async () => {} };

    await new ResearchAgent().run({ brief: BRIEF }, ctx);
    await new WritingAgent().run({ brief: BRIEF, outline: OUTLINE, research: RESEARCH }, ctx);
    await new TechnicalReviewerAgent().run({ brief: BRIEF, draft: DRAFT, research: RESEARCH }, ctx);
    await new EditorialReviewerAgent().run({ brief: BRIEF, draft: DRAFT }, ctx);
    await new SeoAgent().run({ brief: BRIEF, draft: DRAFT, outline: OUTLINE }, ctx);

    expect(generateTextMock).toHaveBeenCalledTimes(6);
    for (const call of generateTextMock.mock.calls) {
      expect(call[0]?.prompt).toContain("Requested audience: Backend engineers");
      expect(call[0]?.prompt).toContain("Content type: blueprint");
      expect(call[0]?.prompt).toContain("2,500–4,000 words");
      expect(call[0]?.prompt).toContain("Publication: Frontend Blueprints");
    }
    for (const index of [2, 3, 4, 5]) {
      expect(generateTextMock.mock.calls[index]?.[0]?.system).not.toContain(
        "competent frontend engineer"
      );
    }
  });
});
