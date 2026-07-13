import type { LanguageModelUsage } from "ai";
import type { AgentEventInput } from "../schemas/events.js";
import { MODEL_IDS, type ModelStage } from "./provider.js";

interface ModelPrice {
  input: number;
  cachedInput: number;
  output: number;
}

// Standard API rates as of 2026-07-13. Keep in sync with
// https://openai.com/api/pricing/ when changing model defaults.
const PRICE_PER_MILLION_TOKENS: Record<string, ModelPrice> = {
  "gpt-5.6": { input: 5, cachedInput: 0.5, output: 30 },
  "gpt-5.6-sol": { input: 5, cachedInput: 0.5, output: 30 },
  "gpt-5.6-terra": { input: 2.5, cachedInput: 0.25, output: 15 },
  "gpt-5.6-luna": { input: 1, cachedInput: 0.1, output: 6 },
};

const CACHE_WRITE_MULTIPLIER = 1.25;
const WEB_SEARCH_COST_USD = 0.01;

export interface ModelUsageEventOptions {
  stage: ModelStage;
  usage: LanguageModelUsage;
  webSearchCalls?: number;
}

export function buildModelUsageEvent({
  stage,
  usage,
  webSearchCalls = 0,
}: ModelUsageEventOptions): AgentEventInput {
  const model = MODEL_IDS[stage];
  const inputTokens = usage.inputTokens ?? 0;
  const cacheReadTokens = usage.inputTokenDetails.cacheReadTokens ?? 0;
  const cacheWriteTokens = usage.inputTokenDetails.cacheWriteTokens ?? 0;
  const uncachedInputTokens =
    usage.inputTokenDetails.noCacheTokens ??
    Math.max(0, inputTokens - cacheReadTokens - cacheWriteTokens);
  const outputTokens = usage.outputTokens ?? 0;
  const reasoningTokens = usage.outputTokenDetails.reasoningTokens ?? 0;
  const price = PRICE_PER_MILLION_TOKENS[model];

  const estimatedCostUsd = price
    ? (uncachedInputTokens * price.input +
        cacheReadTokens * price.cachedInput +
        cacheWriteTokens * price.input * CACHE_WRITE_MULTIPLIER +
        outputTokens * price.output) /
        1_000_000 +
      webSearchCalls * WEB_SEARCH_COST_USD
    : null;

  return {
    type: "ModelUsage",
    stage,
    model,
    inputTokens,
    outputTokens,
    reasoningTokens,
    cacheReadTokens,
    cacheWriteTokens,
    webSearchCalls,
    estimatedCostUsd,
  };
}

export async function emitModelUsage(
  options: ModelUsageEventOptions,
  emit?: (event: AgentEventInput) => Promise<void>
): Promise<void> {
  if (emit) await emit(buildModelUsageEvent(options));
}
