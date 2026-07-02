import type { z } from "zod";
import type { AgentEventInput } from "../schemas/events.js";
import type { EventLogger } from "../events/EventLogger.js";

export interface AgentContext {
  articleId: string;
  emit: (event: AgentEventInput) => Promise<void>;
}

export function makeAgentContext(articleId: string, eventLogger: EventLogger): AgentContext {
  return {
    articleId,
    emit: async (event) => {
      await eventLogger.append(articleId, event);
    },
  };
}

export abstract class Agent<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly inputSchema: z.ZodType<TInput>;
  abstract readonly outputSchema: z.ZodType<TOutput>;

  async run(input: TInput, ctx: AgentContext): Promise<TOutput> {
    const validInput = this.inputSchema.parse(input);
    await ctx.emit({ type: "AgentStarted", agent: this.name });
    const raw = await this.produceOutput(validInput, ctx);
    const result = this.outputSchema.parse(raw);
    await ctx.emit({ type: "OutputProduced", agent: this.name, output: result });
    await ctx.emit({ type: "AgentCompleted", agent: this.name });
    return result;
  }

  protected abstract produceOutput(input: TInput, ctx: AgentContext): Promise<unknown>;
}
