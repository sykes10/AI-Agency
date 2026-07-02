import "dotenv/config";
import { randomUUID } from "node:crypto";
import { articleStore } from "../storage/ArticleStore.js";
import { runArticleJob } from "../orchestrator/runArticleJob.js";
import { CreateArticleRequestSchema } from "../schemas/article.js";

async function main(): Promise<void> {
  const [topic, audience = "Software Engineers", depth = "deep-dive"] = process.argv.slice(2);
  if (!topic) {
    console.error('Usage: tsx src/cli/run-cli.ts "<topic>" ["<audience>"] ["overview"|"deep-dive"]');
    process.exit(1);
  }

  const request = CreateArticleRequestSchema.parse({ topic, audience, depth });
  const id = randomUUID();
  await articleStore.create(id, request);
  console.log(`Created article ${id}`);

  await runArticleJob(id);

  const article = await articleStore.load(id);
  console.log(`Final status: ${article?.status}`);
  if (article?.status === "Failed") {
    console.error(`Error: ${article.error}`);
    process.exit(1);
  }
  console.log(`Article written to articles/${id}/final.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
