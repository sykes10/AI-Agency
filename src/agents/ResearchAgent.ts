import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { Agent, type AgentContext } from "./Agent.js";
import { ResearchReportSchema, type ResearchReport } from "../schemas/research.js";
import { anthropic, MODEL, DEFAULT_MAX_TOKENS } from "../llm/anthropicClient.js";
import { structuredCall } from "../llm/structuredCall.js";
import { webSearchTool } from "../llm/webSearchTool.js";

const ResearchInputSchema = z.object({
  topic: z.string(),
  audience: z.string(),
  depth: z.enum(["overview", "deep-dive"]),
});

type ResearchInput = z.infer<typeof ResearchInputSchema>;

const SYSTEM_PROMPT = `You are the Research Agent in a technical content pipeline.
Your only job is to become an expert on the requested topic before anyone writes
a single sentence of the article. Research concepts, terminology, official
documentation, recent changes, community opinions, common mistakes, and edge
cases using the web_search tool. Never write paragraphs intended for publication
-- you only gather and organize raw research material.`;

const MAX_SEARCH_TURNS = 6;

export class ResearchAgent extends Agent<ResearchInput, ResearchReport> {
  readonly name = "research";
  readonly inputSchema = ResearchInputSchema;
  readonly outputSchema = ResearchReportSchema;

  protected async produceOutput(input: ResearchInput, ctx: AgentContext): Promise<unknown> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `Research the topic "${input.topic}" for an audience of "${input.audience}" at a "${input.depth}" depth. Use web search to find definitions, official documentation, recent changes, community opinions, common mistakes, and edge cases. When you have gathered enough material, summarize what you found in plain text (no need for a specific format yet).`,
      },
    ];

    for (let turn = 0; turn < MAX_SEARCH_TURNS; turn++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: DEFAULT_MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: [webSearchTool],
        tool_choice: { type: "auto" },
        messages,
      });

      await this.emitToolEvents(response.content, ctx);
      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "pause_turn") {
        continue;
      }
      break;
    }

    return structuredCall({
      system: `${SYSTEM_PROMPT}\n\nYou have already completed your web research (see the conversation history below). Now synthesize everything you found into the final Research Report. Do not perform any more searches.`,
      userPrompt: `Conversation so far:\n\n${JSON.stringify(messages, null, 2)}\n\nProduce the final Research Report for topic "${input.topic}".`,
      schema: this.outputSchema,
    });
  }

  private async emitToolEvents(content: Anthropic.ContentBlock[], ctx: AgentContext): Promise<void> {
    for (const block of content) {
      if (block.type === "server_tool_use" && block.name === "web_search") {
        await ctx.emit({
          type: "ToolRequested",
          agent: this.name,
          tool: "web_search",
          input: block.input,
        });
      } else if (block.type === "web_search_tool_result") {
        const isError = !Array.isArray(block.content);
        await ctx.emit({
          type: "ToolCompleted",
          agent: this.name,
          tool: "web_search",
          error: isError,
          summary: isError
            ? `web_search failed: ${(block.content as { error_code: string }).error_code}`
            : `web_search returned ${(block.content as unknown[]).length} result(s)`,
        });
      }
    }
  }
}

export const researchAgent = new ResearchAgent();
