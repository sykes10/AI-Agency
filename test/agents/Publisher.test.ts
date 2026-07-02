import { describe, it, expect } from "vitest";
import { Publisher } from "../../src/agents/Publisher.js";

describe("Publisher", () => {
  it("deterministically assembles markdown/html/toc/reading time from draft+seo+outline", async () => {
    const publisher = new Publisher();
    const events: string[] = [];

    const result = await publisher.run(
      {
        draft: { title: "Understanding Event Loops", subtitle: "A guide", body: "word ".repeat(400) },
        seo: {
          slug: "understanding-event-loops",
          metaTitle: "Understanding Event Loops",
          metaDescription: "A guide to event loops",
          keywords: ["event loop", "nodejs"],
          faq: [],
          schemaSuggestions: [],
          internalLinkingSuggestions: [],
          externalLinkingSuggestions: [],
        },
        outline: {
          title: "Understanding Event Loops",
          subtitle: "A guide",
          targetAudience: "Backend engineers",
          estimatedReadingTimeMinutes: 5,
          introduction: "intro",
          sections: [
            { heading: "What Is an Event Loop?", summary: "s", codeExamples: [], illustrationIdeas: [] },
          ],
          takeaways: [],
          conclusion: "end",
        },
      },
      { articleId: "a", emit: async (e) => { events.push(e.type); } }
    );

    expect(result.markdown).toContain("# Understanding Event Loops");
    expect(result.markdown).toContain("slug:");
    expect(result.html).toContain("<h1>Understanding Event Loops</h1>");
    expect(result.tableOfContents).toEqual([
      { heading: "What Is an Event Loop?", anchor: "what-is-an-event-loop" },
    ]);
    expect(result.readingTimeMinutes).toBe(2); // 400 words / 200 wpm
    expect(events).toEqual(["AgentStarted", "OutputProduced", "AgentCompleted"]);

    // Running it again with the exact same input produces an identical result (deterministic).
    const result2 = await publisher.run(
      {
        draft: { title: "Understanding Event Loops", subtitle: "A guide", body: "word ".repeat(400) },
        seo: {
          slug: "understanding-event-loops",
          metaTitle: "Understanding Event Loops",
          metaDescription: "A guide to event loops",
          keywords: ["event loop", "nodejs"],
          faq: [],
          schemaSuggestions: [],
          internalLinkingSuggestions: [],
          externalLinkingSuggestions: [],
        },
        outline: {
          title: "Understanding Event Loops",
          subtitle: "A guide",
          targetAudience: "Backend engineers",
          estimatedReadingTimeMinutes: 5,
          introduction: "intro",
          sections: [
            { heading: "What Is an Event Loop?", summary: "s", codeExamples: [], illustrationIdeas: [] },
          ],
          takeaways: [],
          conclusion: "end",
        },
      },
      { articleId: "a", emit: async () => {} }
    );
    expect(result2).toEqual(result);
  });
});
