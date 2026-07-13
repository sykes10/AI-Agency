import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildArticleBrief } from "../../src/schemas/articleBrief.js";

const researchRunMock = vi.fn();
const planningRunMock = vi.fn();
const writingRunMock = vi.fn();
const technicalRunMock = vi.fn();
const editorialRunMock = vi.fn();
const revisionRunMock = vi.fn();
const seoRunMock = vi.fn();
const publisherRunMock = vi.fn();

vi.mock("../../src/agents/ResearchAgent.js", () => ({
  researchAgent: { name: "research", run: researchRunMock },
}));
vi.mock("../../src/agents/PlanningAgent.js", () => ({
  planningAgent: { name: "planning", run: planningRunMock },
}));
vi.mock("../../src/agents/WritingAgent.js", () => ({
  writingAgent: { name: "writing", run: writingRunMock },
}));
vi.mock("../../src/agents/TechnicalReviewerAgent.js", () => ({
  technicalReviewerAgent: { name: "technical-review", run: technicalRunMock },
}));
vi.mock("../../src/agents/EditorialReviewerAgent.js", () => ({
  editorialReviewerAgent: { name: "editorial-review", run: editorialRunMock },
}));
vi.mock("../../src/agents/RevisionAgent.js", () => ({
  revisionAgent: { name: "revision", run: revisionRunMock },
}));
vi.mock("../../src/agents/SeoAgent.js", () => ({
  seoAgent: { name: "seo", run: seoRunMock },
}));
vi.mock("../../src/agents/Publisher.js", () => ({
  publisher: { name: "publisher", run: publisherRunMock },
}));

const RESEARCH = {
  topic: "t",
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
  title: "Title",
  subtitle: "Sub",
  targetAudience: "Devs",
  estimatedReadingTimeMinutes: 5,
  introduction: "intro",
  sections: [],
  takeaways: [],
  conclusion: "end",
};
const DRAFT = { title: "Title", subtitle: "Sub", body: "word ".repeat(50) };
const TECH_REVIEW = { issues: [] };
const EDIT_REVIEW = { suggestions: [] };
const REVISED_DRAFT = { ...DRAFT, body: "revised body", resolutions: [] };
const SEO = {
  slug: "slug",
  metaTitle: "meta",
  metaDescription: "desc",
  keywords: [],
  faq: [],
  schemaSuggestions: [],
  internalLinkingSuggestions: [],
  externalLinkingSuggestions: [],
};
const BLUEPRINT_BRIEF = buildArticleBrief({
  topic: "t",
  audience: "a",
  contentType: "blueprint",
  depth: "deep-dive",
});
const PATTERN_BRIEF = buildArticleBrief({
  topic: "t",
  audience: "a",
  contentType: "pattern",
  depth: "overview",
});

let tmpDir: string;
let originalCwd: string;

beforeEach(async () => {
  vi.clearAllMocks();
  originalCwd = process.cwd();
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "press-agency-test-"));
  await fs.mkdir(path.join(tmpDir, "articles"), { recursive: true });
  process.chdir(tmpDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("runArticleJob", () => {
  it("pauses for Draft approval, then runs the remaining stages and publishes", async () => {
    researchRunMock.mockResolvedValue(RESEARCH);
    planningRunMock.mockResolvedValue(OUTLINE);
    writingRunMock.mockResolvedValue(DRAFT);
    technicalRunMock.mockResolvedValue(TECH_REVIEW);
    editorialRunMock.mockResolvedValue(EDIT_REVIEW);
    revisionRunMock.mockResolvedValue(REVISED_DRAFT);
    seoRunMock.mockResolvedValue(SEO);
    publisherRunMock.mockResolvedValue({
      markdown: "# Title",
      html: "<h1>Title</h1>",
      mdx: "# Title",
      tableOfContents: [],
      readingTimeMinutes: 1,
      images: [],
    });

    const { articleStore } = await import("../../src/storage/ArticleStore.js");
    const { runArticleJob } = await import("../../src/orchestrator/runArticleJob.js");

    const id = "article-1";
    await articleStore.create(id, { topic: "t", audience: "a", contentType: "blueprint", depth: "deep-dive" });
    await runArticleJob(id);

    let article = await articleStore.load(id);
    expect(article?.status).toBe("AwaitingDraftReview");
    expect(article?.draftReview?.state).toBe("pending");
    expect(technicalRunMock).not.toHaveBeenCalled();

    await articleStore.decideDraft(id, "approve", null);
    await runArticleJob(id);

    article = await articleStore.load(id);
    expect(article?.status).toBe("Published");
    expect(article?.title).toBe("Title");
    expect(researchRunMock).toHaveBeenCalledTimes(1);
    expect(revisionRunMock).toHaveBeenCalledTimes(1);
    expect(researchRunMock).toHaveBeenCalledWith({ brief: BLUEPRINT_BRIEF }, expect.anything());
    expect(planningRunMock).toHaveBeenCalledWith(
      { brief: BLUEPRINT_BRIEF, research: RESEARCH },
      expect.anything()
    );
    expect(technicalRunMock).toHaveBeenCalledWith(
      { brief: BLUEPRINT_BRIEF, draft: DRAFT, research: RESEARCH },
      expect.anything()
    );
    expect(editorialRunMock).toHaveBeenCalledWith(
      { brief: BLUEPRINT_BRIEF, draft: DRAFT },
      expect.anything()
    );
    expect(revisionRunMock).toHaveBeenCalledWith(
      {
        brief: BLUEPRINT_BRIEF,
        draft: DRAFT,
        outline: OUTLINE,
        research: RESEARCH,
        technicalReview: TECH_REVIEW,
        editorialReview: EDIT_REVIEW,
      },
      expect.anything()
    );
    expect(seoRunMock).toHaveBeenCalledWith(
      { brief: BLUEPRINT_BRIEF, draft: REVISED_DRAFT, outline: OUTLINE },
      expect.anything()
    );
    expect(publisherRunMock).toHaveBeenCalledWith(
      { draft: REVISED_DRAFT, seo: SEO, outline: OUTLINE },
      expect.anything()
    );
    expect(publisherRunMock).toHaveBeenCalledTimes(1);

    const { eventLogger } = await import("../../src/events/EventLogger.js");
    const events = await eventLogger.readAll(id);
    expect(events.some((e) => e.type === "Completed")).toBe(true);
    expect(events.filter((e) => e.type === "StatusChanged").map((e: any) => e.to)).toEqual([
      "Researching",
      "Planning",
      "Writing",
      "AwaitingDraftReview",
      "TechnicalReview",
      "EditorialReview",
      "Revising",
      "SEOReview",
      "Ready",
      "Published",
    ]);
  });

  it("retries a failing stage and eventually marks the article Failed after exhausting retries", async () => {
    researchRunMock.mockRejectedValue(new Error("network down"));

    const { articleStore } = await import("../../src/storage/ArticleStore.js");
    const { runArticleJob } = await import("../../src/orchestrator/runArticleJob.js");

    const id = "article-2";
    await articleStore.create(id, { topic: "t", audience: "a", contentType: "blueprint", depth: "deep-dive" });
    await runArticleJob(id);

    expect(researchRunMock).toHaveBeenCalledTimes(3); // initial + 2 retries
    const article = await articleStore.load(id);
    expect(article?.status).toBe("Failed");
    expect(article?.error).toContain("network down");

    const { eventLogger } = await import("../../src/events/EventLogger.js");
    const events = await eventLogger.readAll(id);
    expect(events.filter((e) => e.type === "Retry")).toHaveLength(2);
    expect(events.some((e) => e.type === "Failed")).toBe(true);
  }, 15000);

  it("resumes from the failed stage instead of re-running completed stages", async () => {
    researchRunMock.mockResolvedValue(RESEARCH);
    planningRunMock.mockRejectedValueOnce(new Error("boom")).mockResolvedValue(OUTLINE);
    writingRunMock.mockResolvedValue(DRAFT);
    technicalRunMock.mockResolvedValue(TECH_REVIEW);
    editorialRunMock.mockResolvedValue(EDIT_REVIEW);
    revisionRunMock.mockResolvedValue(REVISED_DRAFT);
    seoRunMock.mockResolvedValue(SEO);
    publisherRunMock.mockResolvedValue({
      markdown: "# Title",
      html: "<h1>Title</h1>",
      mdx: "# Title",
      tableOfContents: [],
      readingTimeMinutes: 1,
      images: [],
    });

    // Force planning to fail all 3 attempts on the first job run so the article ends up Failed
    // at the Planning stage, with research already persisted.
    planningRunMock.mockReset();
    planningRunMock.mockRejectedValue(new Error("boom"));

    const { articleStore } = await import("../../src/storage/ArticleStore.js");
    const { runArticleJob } = await import("../../src/orchestrator/runArticleJob.js");

    const id = "article-3";
    await articleStore.create(id, { topic: "t", audience: "a", contentType: "blueprint", depth: "deep-dive" });
    await runArticleJob(id);

    let article = await articleStore.load(id);
    expect(article?.status).toBe("Failed");
    expect(article?.research).not.toBeNull();
    expect(researchRunMock).toHaveBeenCalledTimes(1);
    expect(planningRunMock).toHaveBeenCalledTimes(3);

    // Now let planning succeed and retry the job.
    planningRunMock.mockReset();
    planningRunMock.mockResolvedValue(OUTLINE);

    await runArticleJob(id);

    article = await articleStore.load(id);
    expect(article?.status).toBe("AwaitingDraftReview");
    await articleStore.decideDraft(id, "approve", null);
    await runArticleJob(id);

    article = await articleStore.load(id);
    expect(article?.status).toBe("Published");
    // Research should not have been re-run since it was already persisted.
    expect(researchRunMock).toHaveBeenCalledTimes(1);
    expect(planningRunMock).toHaveBeenCalledTimes(1);
  }, 15000);

  it("iterates a Draft from editor feedback without re-running earlier artifacts", async () => {
    const SECOND_DRAFT = { ...DRAFT, body: "A stronger second Draft." };
    researchRunMock.mockResolvedValue(RESEARCH);
    planningRunMock.mockResolvedValue(OUTLINE);
    writingRunMock.mockResolvedValueOnce(DRAFT).mockResolvedValueOnce(SECOND_DRAFT);

    const { articleStore } = await import("../../src/storage/ArticleStore.js");
    const { runArticleJob } = await import("../../src/orchestrator/runArticleJob.js");

    const id = "article-iteration";
    await articleStore.create(id, { topic: "t", audience: "a", contentType: "pattern", depth: "overview" });
    await runArticleJob(id);
    await articleStore.decideDraft(id, "iterate", "Open with the production failure and tighten the middle.");
    await runArticleJob(id);

    const article = await articleStore.load(id);
    expect(article?.status).toBe("AwaitingDraftReview");
    expect(article?.draft).toEqual(SECOND_DRAFT);
    expect(article?.draftReview?.iteration).toBe(1);
    expect(article?.draftReview?.history).toHaveLength(1);
    expect(researchRunMock).toHaveBeenCalledTimes(1);
    expect(planningRunMock).toHaveBeenCalledTimes(1);
    expect(writingRunMock).toHaveBeenLastCalledWith(
      {
        brief: PATTERN_BRIEF,
        outline: OUTLINE,
        research: RESEARCH,
        previousDraft: DRAFT,
        feedback: "Open with the production failure and tighten the middle.",
      },
      expect.anything()
    );
    expect(await articleStore.listDraftVersions(id)).toEqual([
      { iteration: 0, draft: DRAFT },
      { iteration: 1, draft: SECOND_DRAFT },
    ]);
  });

  it("attributes model usage to the pipeline run and stage attempt", async () => {
    researchRunMock.mockImplementation(async (_input, ctx) => {
      await ctx.emit({
        type: "ModelUsage",
        stage: "research",
        model: "gpt-5.6-terra",
        inputTokens: 100,
        outputTokens: 20,
        reasoningTokens: 5,
        cacheReadTokens: 10,
        cacheWriteTokens: 0,
        webSearchCalls: 1,
        estimatedCostUsd: 0.011,
      });
      return RESEARCH;
    });
    planningRunMock.mockResolvedValue(OUTLINE);
    writingRunMock.mockResolvedValue(DRAFT);

    const { articleStore } = await import("../../src/storage/ArticleStore.js");
    const { runArticleJob } = await import("../../src/orchestrator/runArticleJob.js");
    const { eventLogger } = await import("../../src/events/EventLogger.js");

    const id = "article-attribution";
    await articleStore.create(id, {
      topic: "t",
      audience: "a",
      contentType: "pattern",
      depth: "overview",
    });
    await runArticleJob(id);

    const usage = (await eventLogger.readAll(id)).find((event) => event.type === "ModelUsage");
    expect(usage).toMatchObject({
      type: "ModelUsage",
      runKind: "initial",
      attempt: 1,
      stage: "research",
    });
    if (usage?.type !== "ModelUsage") throw new Error("Expected ModelUsage event");
    expect(usage.runId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
