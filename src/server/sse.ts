import type { Request, Response } from "express";
import { eventLogger } from "../events/EventLogger.js";
import { eventBus } from "../events/EventBus.js";

const KEEP_ALIVE_MS = 15000;

export async function streamArticleEvents(req: Request, res: Response, articleId: string): Promise<void> {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const history = await eventLogger.readAll(articleId);
  for (const event of history) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  const unsubscribe = eventBus.subscribe(articleId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, KEEP_ALIVE_MS);

  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
}
