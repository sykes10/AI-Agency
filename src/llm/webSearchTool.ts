import type Anthropic from "@anthropic-ai/sdk";

export const webSearchTool: Anthropic.WebSearchTool20260209 = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 8,
};
