import path from "node:path";

export function articlesRoot(): string {
  return path.resolve(process.cwd(), "articles");
}

export function articleDir(articleId: string): string {
  return path.join(articlesRoot(), articleId);
}

export function stagePath(articleId: string, stage: string): string {
  return path.join(articleDir(articleId), `${stage}.json`);
}

export function draftVersionPath(articleId: string, iteration: number): string {
  return path.join(articleDir(articleId), `draft.${iteration}.json`);
}

export function articleRecordPath(articleId: string): string {
  return path.join(articleDir(articleId), "article.json");
}

export function eventsLogPath(articleId: string): string {
  return path.join(articleDir(articleId), "events.jsonl");
}

export function finalMarkdownPath(articleId: string): string {
  return path.join(articleDir(articleId), "final.md");
}
