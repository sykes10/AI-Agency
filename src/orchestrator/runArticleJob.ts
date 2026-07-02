import { articleStore, type ArticleStore } from "../storage/ArticleStore.js";
import { eventLogger, type EventLogger } from "../events/EventLogger.js";
import { makeAgentContext } from "../agents/Agent.js";
import { buildPipeline } from "./Orchestrator.js";
import { assertTransition } from "./stateMachine.js";
import type { ArticleStatus } from "../schemas/article.js";

const MAX_RETRIES = 2;
const RETRY_BACKOFF_MS = [1000, 4000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runArticleJob(
  articleId: string,
  store: ArticleStore = articleStore,
  logger: EventLogger = eventLogger
): Promise<void> {
  const article = await store.load(articleId);
  if (!article) throw new Error(`Article not found: ${articleId}`);

  const ctx = makeAgentContext(articleId, logger);
  const pipeline = buildPipeline(store);

  for (const stage of pipeline) {
    if (stage.isDone(article)) continue;

    const fromStatus: ArticleStatus = article.status;
    assertTransition(fromStatus, stage.status);
    article.status = stage.status;
    await store.setStatus(articleId, stage.status);
    await ctx.emit({ type: "StatusChanged", from: fromStatus, to: stage.status });

    let lastError: unknown;
    let succeeded = false;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await stage.run(article, ctx);
        succeeded = true;
        break;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          const reason = err instanceof Error ? err.message : String(err);
          await ctx.emit({
            type: "Retry",
            agent: stage.agentName,
            attempt: attempt + 1,
            reason,
          });
          await sleep(RETRY_BACKOFF_MS[attempt] ?? 4000);
        }
      }
    }

    if (!succeeded) {
      const message = lastError instanceof Error ? lastError.message : String(lastError);
      await store.setStatus(articleId, "Failed", message);
      await ctx.emit({ type: "Failed", agent: stage.agentName, error: message });
      return;
    }
  }

  await store.setStatus(articleId, "Published");
  await ctx.emit({ type: "StatusChanged", from: "Ready", to: "Published" });
  await ctx.emit({ type: "Completed" });
}
