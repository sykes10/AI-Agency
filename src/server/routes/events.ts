import { Router } from "express";
import { articleStore } from "../../storage/ArticleStore.js";
import { streamArticleEvents } from "../sse.js";

export const eventsRouter = Router();

eventsRouter.get("/articles/:id/events", async (req, res) => {
  const exists = await articleStore.exists(req.params.id);
  if (!exists) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  await streamArticleEvents(req, res, req.params.id);
});
