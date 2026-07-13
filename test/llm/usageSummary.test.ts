import { describe, expect, it } from "vitest";
import { EventSchema, type AgentEvent } from "../../src/schemas/events.js";
import { summarizeModelUsage } from "../../src/llm/usageSummary.js";

function usage(overrides: Record<string, unknown> = {}): AgentEvent {
  return EventSchema.parse({
    type: "ModelUsage",
    runId: "8bbd7b60-3183-4a66-9a99-59fe6287c02d",
    runKind: "initial",
    attempt: 1,
    stage: "writing",
    model: "gpt-5.6-sol",
    inputTokens: 100,
    outputTokens: 50,
    reasoningTokens: 10,
    cacheReadTokens: 20,
    cacheWriteTokens: 5,
    webSearchCalls: 0,
    estimatedCostUsd: 0.01,
    ts: "2026-07-13T12:00:00.000Z",
    ...overrides,
  });
}

describe("summarizeModelUsage", () => {
  it("preserves Article totals and groups matching calls", () => {
    const summary = summarizeModelUsage([
      usage(),
      usage({
        inputTokens: 200,
        outputTokens: 75,
        reasoningTokens: 15,
        cacheReadTokens: 30,
        cacheWriteTokens: 10,
        webSearchCalls: 1,
        estimatedCostUsd: 0.02,
      }),
    ]);

    expect(summary).toMatchObject({
      calls: 2,
      inputTokens: 300,
      outputTokens: 125,
      reasoningTokens: 25,
      cacheReadTokens: 50,
      cacheWriteTokens: 15,
      webSearchCalls: 1,
      estimatedCostUsd: 0.03,
      fullyPriced: true,
    });
    expect(summary.breakdown).toHaveLength(1);
    expect(summary.breakdown[0]).toMatchObject({
      runKind: "initial",
      stage: "writing",
      model: "gpt-5.6-sol",
      attempt: 1,
      calls: 2,
      estimatedCostUsd: 0.03,
      fullyPriced: true,
    });
  });

  it("separates runs, stages, models, and attempts in first-seen order", () => {
    const summary = summarizeModelUsage([
      usage(),
      usage({ stage: "revision" }),
      usage({ attempt: 2 }),
      usage({ model: "custom-model" }),
      usage({
        runId: "4d94331a-1f3f-4c72-ac65-055e253b3207",
        runKind: "retry",
      }),
    ]);

    expect(summary.breakdown.map(({ runKind, stage, model, attempt }) => ({
      runKind,
      stage,
      model,
      attempt,
    }))).toEqual([
      { runKind: "initial", stage: "writing", model: "gpt-5.6-sol", attempt: 1 },
      { runKind: "initial", stage: "revision", model: "gpt-5.6-sol", attempt: 1 },
      { runKind: "initial", stage: "writing", model: "gpt-5.6-sol", attempt: 2 },
      { runKind: "initial", stage: "writing", model: "custom-model", attempt: 1 },
      { runKind: "retry", stage: "writing", model: "gpt-5.6-sol", attempt: 1 },
    ]);
  });

  it("includes partially priced and legacy usage", () => {
    const legacy = usage({
      runId: undefined,
      runKind: undefined,
      attempt: undefined,
      stage: "research",
      estimatedCostUsd: null,
    });
    const summary = summarizeModelUsage([legacy, usage()]);

    expect(summary).toMatchObject({ calls: 2, estimatedCostUsd: 0.01, fullyPriced: false });
    expect(summary.breakdown[0]).toMatchObject({
      runId: null,
      runKind: "legacy",
      attempt: 1,
      stage: "research",
      fullyPriced: false,
    });
    expect(summary.breakdown[1]).toMatchObject({ runKind: "initial", fullyPriced: true });
  });

  it("returns a fully priced empty summary", () => {
    expect(summarizeModelUsage([])).toEqual({
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      webSearchCalls: 0,
      estimatedCostUsd: 0,
      fullyPriced: true,
      breakdown: [],
    });
  });
});
