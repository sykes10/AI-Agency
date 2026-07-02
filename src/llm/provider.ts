import "dotenv/config";
import { anthropic as anthropicProvider } from "@ai-sdk/anthropic";
import { openai as openaiProvider } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type ProviderName = "anthropic" | "openai";

const RAW_PROVIDER = process.env.AI_PROVIDER;
if (RAW_PROVIDER && RAW_PROVIDER !== "anthropic" && RAW_PROVIDER !== "openai") {
  throw new Error(`Invalid AI_PROVIDER "${RAW_PROVIDER}" — must be "anthropic" or "openai"`);
}

export const PROVIDER_NAME: ProviderName = (RAW_PROVIDER as ProviderName) || "anthropic";

const DEFAULT_MODEL_ID: Record<ProviderName, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-5",
};

export const MODEL_ID =
  process.env.AI_MODEL ??
  (PROVIDER_NAME === "openai" ? process.env.OPENAI_MODEL : process.env.ANTHROPIC_MODEL) ??
  DEFAULT_MODEL_ID[PROVIDER_NAME];

export const DEFAULT_MAX_TOKENS = 8192;

function selectModel(): LanguageModel {
  switch (PROVIDER_NAME) {
    case "anthropic":
      return anthropicProvider(MODEL_ID);
    case "openai":
      return openaiProvider(MODEL_ID);
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${PROVIDER_NAME}`);
  }
}

export const model: LanguageModel = selectModel();
