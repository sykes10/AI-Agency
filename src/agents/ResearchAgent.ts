import { z } from "zod";
import { generateText, stepCountIs } from "ai";
import { Agent, type AgentContext } from "./Agent.js";
import { ResearchReportSchema, type ResearchReport } from "../schemas/research.js";
import { model, DEFAULT_MAX_TOKENS } from "../llm/provider.js";
import { structuredCall } from "../llm/structuredCall.js";
import { getWebSearchTool } from "../llm/getWebSearchTool.js";

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
cases using the web_search tool when it is available. Never write paragraphs
intended for publication. You only gather and organize raw research material.`;

const MAX_SEARCH_TURNS = 6;

export class ResearchAgent extends Agent<ResearchInput, ResearchReport> {
  readonly name = "research";
  readonly inputSchema = ResearchInputSchema;
  readonly outputSchema = ResearchReportSchema;

  protected async produceOutput(input: ResearchInput, ctx: AgentContext): Promise<unknown> {
    const webSearchTool = getWebSearchTool();

    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: `Research the topic "${input.topic}" for an audience of "${input.audience}" at a "${input.depth}" depth. ${
        webSearchTool
          ? "Use web search to find"
          : "Draw on your own knowledge to cover"
      } definitions, official documentation, recent changes, community opinions, common mistakes, and edge cases. When you have gathered enough material, summarize what you found in plain text.`,
      tools: webSearchTool ? { web_search: webSearchTool } : undefined,
      stopWhen: stepCountIs(MAX_SEARCH_TURNS),
      maxOutputTokens: DEFAULT_MAX_TOKENS,
    });

    await this.emitToolEvents(result.content, ctx);

    return structuredCall({
      system: `${SYSTEM_PROMPT}\n\nYou have already completed your research (see below). Now synthesize everything you found into the final Research Report. Do not perform any more searches.`,
      userPrompt: `Research notes so far:\n\n${result.text}\n\nProduce the final Research Report for topic "${input.topic}".`,
      schema: this.outputSchema,
    });
  }

  private async emitToolEvents(
    content: Awaited<ReturnType<typeof generateText>>["content"],
    ctx: AgentContext
  ): Promise<void> {
    for (const part of content) {
      if (part.type === "tool-call" && part.toolName === "web_search") {
        await ctx.emit({
          type: "ToolRequested",
          agent: this.name,
          tool: "web_search",
          input: part.input,
        });
      } else if (part.type === "tool-result" && part.toolName === "web_search") {
        const results = part.output as Array<{ url: string }>;
        await ctx.emit({
          type: "ToolCompleted",
          agent: this.name,
          tool: "web_search",
          error: false,
          summary: `web_search returned ${results.length} result(s)`,
        });
      } else if (part.type === "tool-error" && part.toolName === "web_search") {
        await ctx.emit({
          type: "ToolCompleted",
          agent: this.name,
          tool: "web_search",
          error: true,
          summary: `web_search failed: ${String(part.error)}`,
        });
      }
    }
  }
}

export const researchAgent = new ResearchAgent();
