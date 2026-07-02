import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export const DEFAULT_MAX_TOKENS = 8192;
