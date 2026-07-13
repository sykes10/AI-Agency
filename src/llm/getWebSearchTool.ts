import { openai } from "@ai-sdk/openai";

export function getWebSearchTool() {
  return openai.tools.webSearch({ searchContextSize: "high" });
}
