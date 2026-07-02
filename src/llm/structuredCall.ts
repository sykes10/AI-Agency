import { z } from "zod";
import { generateText, Output } from "ai";
import { model, DEFAULT_MAX_TOKENS } from "./provider.js";

export interface StructuredCallParams<T> {
  system: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}

export async function structuredCall<T>(params: StructuredCallParams<T>): Promise<T> {
  const { output } = await generateText({
    model,
    system: params.system,
    prompt: params.userPrompt,
    maxOutputTokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
    output: Output.object({ schema: params.schema }),
  });

  return output;
}
