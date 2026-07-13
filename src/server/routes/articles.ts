import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { articleStore } from "../../storage/ArticleStore.js";
import { runArticleJob, isJobActive } from "../../orchestrator/runArticleJob.js";
import { CreateArticleRequestSchema } from "../../schemas/article.js";
import { DraftReviewRequestSchema } from "../../schemas/draftReview.js";
import { eventLogger } from "../../events/EventLogger.js";

export const articlesRouter = Router();

const ArtifactStageSchema = z.enum([
  "research",
  "outline",
  "draft",
  "technical",
  "editorial",
  "revised-draft",
  "seo",
  "metadata",
]);

articlesRouter.post("/articles", async (req, res) => {
  const parsed = CreateArticleRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const id = randomUUID();
  await articleStore.create(id, parsed.data);

  runArticleJob(id).catch((err) => {
    console.error(`Article job ${id} crashed:`, err);
  });

  res.status(201).json({ id, status: "Queued" });
});

articlesRouter.get("/articles", async (_req, res) => {
  const articles = await articleStore.list();
  res.json(articles);
});

articlesRouter.get("/articles/:id", async (req, res) => {
  const article = await articleStore.load(req.params.id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(article);
});

articlesRouter.get("/articles/:id/usage", async (req, res) => {
  const article = await articleStore.load(req.params.id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const events = await eventLogger.readAll(article.id);
  const usageEvents = events.filter((event) => event.type === "ModelUsage");
  const estimatedCosts = usageEvents
    .map((event) => event.estimatedCostUsd)
    .filter((cost): cost is number => cost !== null);

  res.json({
    calls: usageEvents.length,
    inputTokens: usageEvents.reduce((total, event) => total + event.inputTokens, 0),
    outputTokens: usageEvents.reduce((total, event) => total + event.outputTokens, 0),
    reasoningTokens: usageEvents.reduce((total, event) => total + event.reasoningTokens, 0),
    cacheReadTokens: usageEvents.reduce((total, event) => total + event.cacheReadTokens, 0),
    webSearchCalls: usageEvents.reduce((total, event) => total + event.webSearchCalls, 0),
    estimatedCostUsd: estimatedCosts.reduce((total, cost) => total + cost, 0),
    fullyPriced: estimatedCosts.length === usageEvents.length,
  });
});

articlesRouter.get("/articles/:id/drafts", async (req, res) => {
  const article = await articleStore.load(req.params.id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json({ drafts: await articleStore.listDraftVersions(article.id) });
});

articlesRouter.post("/articles/:id/draft-review", async (req, res) => {
  const parsed = DraftReviewRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const article = await articleStore.load(req.params.id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  if (!article.draft || !article.draftReview) {
    res.status(409).json({ error: "This Article does not have a Draft to review" });
    return;
  }
  if (!['AwaitingDraftReview', 'Rejected'].includes(article.status)) {
    res.status(409).json({ error: `The Draft cannot be reviewed while the Article is ${article.status}` });
    return;
  }
  if (article.status === "Rejected" && parsed.data.action !== "iterate") {
    res.status(409).json({ error: "A rejected Draft can only be iterated" });
    return;
  }
  if (isJobActive(article.id)) {
    res.status(409).json({ error: "Article is currently being processed" });
    return;
  }

  const feedback = parsed.data.feedback ?? null;
  const review = await articleStore.decideDraft(article.id, parsed.data.action, feedback);
  await eventLogger.append(article.id, {
    type: "DraftReviewDecided",
    action: parsed.data.action,
    iteration: parsed.data.action === "iterate" ? review.iteration - 1 : review.iteration,
    feedback,
  });

  if (parsed.data.action === "reject") {
    await articleStore.setStatus(article.id, "Rejected");
    await eventLogger.append(article.id, {
      type: "StatusChanged",
      from: article.status,
      to: "Rejected",
    });
    res.json({ id: article.id, status: "Rejected", draftReview: review });
    return;
  }

  runArticleJob(article.id).catch((err) => {
    console.error(`Article job ${article.id} crashed after Draft review:`, err);
  });
  res.status(202).json({ id: article.id, status: article.status, draftReview: review });
});

articlesRouter.get("/articles/:id/artifact/:stage", async (req, res) => {
  const stageParse = ArtifactStageSchema.safeParse(req.params.stage);
  if (!stageParse.success) {
    res.status(400).json({ error: "Unknown stage" });
    return;
  }
  const exists = await articleStore.exists(req.params.id);
  if (!exists) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  const artifact = await articleStore.readArtifact(req.params.id, stageParse.data);
  res.json({ stage: stageParse.data, artifact });
});

articlesRouter.post("/articles/:id/retry", async (req, res) => {
  const article = await articleStore.load(req.params.id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  if (article.status === "Published") {
    res.status(409).json({ error: "Article is already Published" });
    return;
  }
  if (isJobActive(article.id)) {
    res.status(409).json({ error: "Article is currently being processed" });
    return;
  }

  runArticleJob(article.id).catch((err) => {
    console.error(`Article job ${article.id} crashed on retry:`, err);
  });

  res.status(202).json({ id: article.id, status: article.status });
});
