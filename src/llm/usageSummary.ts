import type { AgentEvent, PipelineRunKind } from "../schemas/events.js";

type ModelUsageEvent = Extract<AgentEvent, { type: "ModelUsage" }>;

export interface UsageTotals {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearchCalls: number;
  estimatedCostUsd: number;
  fullyPriced: boolean;
}

export interface UsageBreakdownRow extends UsageTotals {
  runId: string | null;
  runKind: PipelineRunKind | "legacy";
  attempt: number;
  stage: ModelUsageEvent["stage"];
  model: string;
  firstSeenAt: string;
}

export interface ArticleUsageSummary extends UsageTotals {
  breakdown: UsageBreakdownRow[];
}

interface MutableUsageTotals extends Omit<UsageTotals, "fullyPriced"> {
  pricedCalls: number;
}

function emptyTotals(): MutableUsageTotals {
  return {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    webSearchCalls: 0,
    estimatedCostUsd: 0,
    pricedCalls: 0,
  };
}

function addUsage(totals: MutableUsageTotals, event: ModelUsageEvent): void {
  totals.calls += 1;
  totals.inputTokens += event.inputTokens;
  totals.outputTokens += event.outputTokens;
  totals.reasoningTokens += event.reasoningTokens;
  totals.cacheReadTokens += event.cacheReadTokens;
  totals.cacheWriteTokens += event.cacheWriteTokens;
  totals.webSearchCalls += event.webSearchCalls;
  if (event.estimatedCostUsd !== null) {
    totals.estimatedCostUsd += event.estimatedCostUsd;
    totals.pricedCalls += 1;
  }
}

function finishTotals(totals: MutableUsageTotals): UsageTotals {
  const { pricedCalls, ...values } = totals;
  return { ...values, fullyPriced: pricedCalls === totals.calls };
}

export function summarizeModelUsage(events: readonly AgentEvent[]): ArticleUsageSummary {
  const totals = emptyTotals();
  const groups = new Map<
    string,
    {
      dimensions: Pick<
        UsageBreakdownRow,
        "runId" | "runKind" | "attempt" | "stage" | "model" | "firstSeenAt"
      >;
      totals: MutableUsageTotals;
    }
  >();

  for (const event of events) {
    if (event.type !== "ModelUsage") continue;
    addUsage(totals, event);

    const runId = event.runId ?? null;
    const runKind = event.runKind ?? "legacy";
    const attempt = event.attempt ?? 1;
    const key = JSON.stringify([runId, runKind, event.stage, event.model, attempt]);
    let group = groups.get(key);
    if (!group) {
      group = {
        dimensions: {
          runId,
          runKind,
          attempt,
          stage: event.stage,
          model: event.model,
          firstSeenAt: event.ts,
        },
        totals: emptyTotals(),
      };
      groups.set(key, group);
    }
    addUsage(group.totals, event);
  }

  return {
    ...finishTotals(totals),
    breakdown: Array.from(groups.values(), ({ dimensions, totals: groupTotals }) => ({
      ...dimensions,
      ...finishTotals(groupTotals),
    })),
  };
}

