import "dotenv/config";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type ModelStage =
  | "research"
  | "planning"
  | "writing"
  | "technicalReview"
  | "editorialReview"
  | "revision"
  | "seo";

const DEFAULT_MODEL_IDS: Record<ModelStage, string> = {
  research: "gpt-5.6-terra",
  planning: "gpt-5.6-luna",
  writing: "gpt-5.6-sol",
  technicalReview: "gpt-5.6-sol",
  editorialReview: "gpt-5.6-terra",
  revision: "gpt-5.6-sol",
  seo: "gpt-5.6-luna",
};

export const MAX_OUTPUT_TOKENS: Record<ModelStage, number> = {
  research: 16_384,
  planning: 8_192,
  writing: 32_768,
  technicalReview: 16_384,
  editorialReview: 16_384,
  revision: 32_768,
  seo: 8_192,
};

const STAGE_ENV_KEYS: Record<ModelStage, string> = {
  research: "OPENAI_MODEL_RESEARCH",
  planning: "OPENAI_MODEL_PLANNING",
  writing: "OPENAI_MODEL_WRITING",
  technicalReview: "OPENAI_MODEL_TECHNICAL_REVIEW",
  editorialReview: "OPENAI_MODEL_EDITORIAL_REVIEW",
  revision: "OPENAI_MODEL_REVISION",
  seo: "OPENAI_MODEL_SEO",
};

const globalOverride = process.env.OPENAI_MODEL;

export const MODEL_IDS: Record<ModelStage, string> = Object.fromEntries(
  (Object.keys(DEFAULT_MODEL_IDS) as ModelStage[]).map((stage) => [
    stage,
    process.env[STAGE_ENV_KEYS[stage]] ?? globalOverride ?? DEFAULT_MODEL_IDS[stage],
  ])
) as Record<ModelStage, string>;

const models = new Map<ModelStage, LanguageModel>();

export function modelFor(stage: ModelStage): LanguageModel {
  const existing = models.get(stage);
  if (existing) return existing;

  const model = openai(MODEL_IDS[stage]);
  models.set(stage, model);
  return model;
}
