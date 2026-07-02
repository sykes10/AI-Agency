import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODEL, DEFAULT_MAX_TOKENS } from "./anthropicClient.js";

export interface StructuredCallParams<T> {
  system: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}

export async function structuredCall<T>(params: StructuredCallParams<T>): Promise<T> {
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: params.system,
    messages: [{ role: "user", content: params.userPrompt }],
    output_config: { format: zodOutputFormat(params.schema) },
  });

  if (response.parsed_output === null) {
    throw new Error("Model response did not match the expected schema");
  }
  return response.parsed_output;
}
