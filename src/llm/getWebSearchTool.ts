import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { PROVIDER_NAME } from "./provider.js";

/**
 * Web search is a provider-specific server tool. Returns `undefined` for
 * providers without an equivalent -- callers must fall back to researching
 * from the model's own knowledge rather than crash.
 */
export function getWebSearchTool() {
  switch (PROVIDER_NAME) {
    case "anthropic":
      return anthropic.tools.webSearch_20260209({ maxUses: 8 });
    case "openai":
      return openai.tools.webSearchPreview({ searchContextSize: "high" });
    default:
      return undefined;
  }
}
