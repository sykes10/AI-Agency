import { describe, expect, it } from "vitest";
import {
  ArticleBriefSchema,
  buildArticleBrief,
  contentTypeGuidance,
  formatArticleBrief,
} from "../../src/schemas/articleBrief.js";

describe("ArticleBrief", () => {
  it("derives overview and deep-dive target ranges", () => {
    const base = {
      topic: "Event loops",
      audience: "Backend engineers",
      contentType: "pattern" as const,
    };

    expect(buildArticleBrief({ ...base, depth: "overview" }).targetWordRange).toEqual({
      min: 1_200,
      max: 1_800,
    });
    expect(buildArticleBrief({ ...base, depth: "deep-dive" }).targetWordRange).toEqual({
      min: 2_500,
      max: 4_000,
    });
  });

  it("preserves the requested audience over the publication default", () => {
    const brief = buildArticleBrief({
      topic: "Event loops",
      audience: "Backend engineers",
      contentType: "blueprint",
      depth: "deep-dive",
    });
    const formatted = formatArticleBrief(brief);

    expect(brief.publicationProfile.name).toBe("Frontend Blueprints");
    expect(formatted).toContain("Requested audience: Backend engineers");
    expect(formatted).toContain("overrides the publication's default audience");
    expect(formatted).toContain("system boundaries, components, data flow, failure modes");
  });

  it("provides distinct Pattern and Blueprint guidance", () => {
    expect(contentTypeGuidance("pattern")).toContain("context and forces");
    expect(contentTypeGuidance("pattern")).toContain("when not to use it");
    expect(contentTypeGuidance("blueprint")).toContain("operational concerns");
  });

  it("rejects an inverted target word range", () => {
    expect(() =>
      ArticleBriefSchema.parse({
        topic: "Topic",
        audience: "Audience",
        contentType: "pattern",
        depth: "overview",
        targetWordRange: { min: 2_000, max: 1_000 },
        publicationProfile: {
          name: "Publication",
          purpose: "Purpose",
          defaultAudience: "Audience",
          voice: "Voice",
        },
      })
    ).toThrow("Target word range maximum");
  });
});
