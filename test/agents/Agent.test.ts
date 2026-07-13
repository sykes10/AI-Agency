import { describe, expect, it, vi } from "vitest";
import { withModelUsageAttribution, type AgentContext } from "../../src/agents/Agent.js";
import type { AgentEventInput } from "../../src/schemas/events.js";

describe("withModelUsageAttribution", () => {
  it("enriches Model Usage without changing other events", async () => {
    const events: AgentEventInput[] = [];
    const base: AgentContext = {
      articleId: "article-1",
      emit: vi.fn(async (event) => {
        events.push(event);
      }),
    };
    const ctx = withModelUsageAttribution(base, {
      runId: "8bbd7b60-3183-4a66-9a99-59fe6287c02d",
      runKind: "retry",
      attempt: 2,
    });

    await ctx.emit({ type: "AgentStarted", agent: "Writer" });
    await ctx.emit({
      type: "ModelUsage",
      stage: "writing",
      model: "gpt-5.6-sol",
      inputTokens: 10,
      outputTokens: 20,
      reasoningTokens: 5,
      cacheReadTokens: 2,
      cacheWriteTokens: 0,
      webSearchCalls: 0,
      estimatedCostUsd: 0.001,
    });

    expect(events[0]).toEqual({ type: "AgentStarted", agent: "Writer" });
    expect(events[1]).toMatchObject({
      type: "ModelUsage",
      runId: "8bbd7b60-3183-4a66-9a99-59fe6287c02d",
      runKind: "retry",
      attempt: 2,
    });
  });
});
