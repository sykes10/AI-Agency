import type { ArticleStatus } from "../schemas/article.js";

const ORDER: ArticleStatus[] = [
  "Queued",
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
];

export function canTransition(from: ArticleStatus, to: ArticleStatus): boolean {
  if (to === "Failed") return true;
  if (from === "AwaitingDraftReview") {
    return to === "Writing" || to === "TechnicalReview" || to === "Rejected";
  }
  if (from === "Rejected") return to === "Writing";
  const fromIndex = ORDER.indexOf(from);
  const toIndex = ORDER.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return false;
  // Allow re-entering the same stage (retry after Failed) or moving forward one step.
  return toIndex === fromIndex || toIndex === fromIndex + 1;
}

export function assertTransition(from: ArticleStatus, to: ArticleStatus): void {
  if (from === "Failed") return; // resuming from Failed is always allowed
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
}
