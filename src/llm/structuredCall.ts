import { z } from "zod";
import { generateText, Output } from "ai";
import { modelFor, MAX_OUTPUT_TOKENS, type ModelStage } from "./provider.js";
import { emitModelUsage } from "./usage.js";
import type { AgentEventInput } from "../schemas/events.js";

export interface StructuredCallParams<T> {
  system: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  stage: ModelStage;
  emit?: (event: AgentEventInput) => Promise<void>;
  maxTokens?: number;
}

export async function structuredCall<T>(params: StructuredCallParams<T>): Promise<T> {
  const result = await generateText({
    model: modelFor(params.stage),
    system: params.system,
    prompt: params.userPrompt,
    maxOutputTokens: params.maxTokens ?? MAX_OUTPUT_TOKENS[params.stage],
    output: Output.object({ schema: params.schema }),
  });

  await emitModelUsage({ stage: params.stage, usage: result.usage }, params.emit);

  if (result.finishReason !== "stop") {
    throw new Error(
      `LLM call ended with finishReason "${result.finishReason}" instead of "stop" ` +
        `(usage: ${JSON.stringify(result.usage)}). No structured output was parsed. ` +
        `This usually means maxOutputTokens was too low for the response.`
    );
  }

  return result.output;
}
