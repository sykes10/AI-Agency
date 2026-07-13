import { describe, expect, it } from "vitest";
import { buildModelUsageEvent } from "../../src/llm/usage.js";
import { EventSchema } from "../../src/schemas/events.js";

describe("buildModelUsageEvent", () => {
  it("prices uncached, cached, reasoning, and web-search usage", () => {
    const event = buildModelUsageEvent({
      stage: "writing",
      webSearchCalls: 2,
      usage: {
        inputTokens: 1000,
        inputTokenDetails: {
          noCacheTokens: 800,
          cacheReadTokens: 100,
          cacheWriteTokens: 100,
        },
        outputTokens: 200,
        outputTokenDetails: { textTokens: 150, reasoningTokens: 50 },
        totalTokens: 1200,
      },
    });

    expect(event).toMatchObject({
      type: "ModelUsage",
      stage: "writing",
      model: "gpt-5.6-sol",
      inputTokens: 1000,
      outputTokens: 200,
      reasoningTokens: 50,
      cacheReadTokens: 100,
      cacheWriteTokens: 100,
      webSearchCalls: 2,
    });
    if (event.type !== "ModelUsage") throw new Error("Expected ModelUsage event");
    expect(event.estimatedCostUsd).toBeCloseTo(0.030675);
  });

  it("keeps legacy Model Usage events valid without run attribution", () => {
    const event = EventSchema.parse({
      type: "ModelUsage",
      stage: "writing",
      model: "gpt-5.6-sol",
      inputTokens: 100,
      outputTokens: 50,
      reasoningTokens: 10,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      webSearchCalls: 0,
      estimatedCostUsd: 0.01,
      ts: "2026-07-13T12:00:00.000Z",
    });

    expect(event).not.toHaveProperty("runId");
    expect(event).not.toHaveProperty("runKind");
    expect(event).not.toHaveProperty("attempt");
  });
});
