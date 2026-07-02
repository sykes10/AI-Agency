import "dotenv/config";
import { anthropic as anthropicProvider } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

export type ProviderName = "anthropic";

export const PROVIDER_NAME: ProviderName = (process.env.AI_PROVIDER as ProviderName) || "anthropic";

export const MODEL_ID = process.env.AI_MODEL ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export const DEFAULT_MAX_TOKENS = 8192;

function selectModel(): LanguageModel {
  switch (PROVIDER_NAME) {
    case "anthropic":
      return anthropicProvider(MODEL_ID);
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${PROVIDER_NAME}`);
  }
}

export const model: LanguageModel = selectModel();
