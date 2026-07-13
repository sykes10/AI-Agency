import { z } from "zod";
import { generateText, Output } from "ai";
import { modelFor, DEFAULT_MAX_TOKENS, type ModelStage } from "./provider.js";

export interface StructuredCallParams<T> {
  system: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  stage: ModelStage;
  maxTokens?: number;
}

export async function structuredCall<T>(params: StructuredCallParams<T>): Promise<T> {
  const result = await generateText({
    model: modelFor(params.stage),
    system: params.system,
    prompt: params.userPrompt,
    maxOutputTokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
    output: Output.object({ schema: params.schema }),
  });

  if (result.finishReason !== "stop") {
    throw new Error(
      `LLM call ended with finishReason "${result.finishReason}" instead of "stop" ` +
        `(usage: ${JSON.stringify(result.usage)}). No structured output was parsed. ` +
        `This usually means maxOutputTokens was too low for the response.`
    );
  }

  return result.output;
}
