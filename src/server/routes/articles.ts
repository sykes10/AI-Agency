import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { articleStore } from "../../storage/ArticleStore.js";
import { runArticleJob } from "../../orchestrator/runArticleJob.js";
import { CreateArticleRequestSchema } from "../../schemas/article.js";

export const articlesRouter = Router();

const ArtifactStageSchema = z.enum([
  "research",
  "outline",
  "draft",
  "technical",
  "editorial",
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
  if (article.status !== "Failed") {
    res.status(409).json({ error: `Article is not in a Failed state (current: ${article.status})` });
    return;
  }

  runArticleJob(article.id).catch((err) => {
    console.error(`Article job ${article.id} crashed on retry:`, err);
  });

  res.status(202).json({ id: article.id, status: article.status });
});
