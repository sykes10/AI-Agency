import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { ResearchReportSchema } from "../schemas/research.js";
import { OutlineSchema } from "../schemas/outline.js";
import { DraftSchema, type Draft } from "../schemas/draft.js";
import { structuredCall } from "../llm/structuredCall.js";

const WritingInputSchema = z.object({
  outline: OutlineSchema,
  research: ResearchReportSchema,
});

type WritingInput = z.infer<typeof WritingInputSchema>;

const SYSTEM_PROMPT = `You are the Writing Agent in a technical content pipeline.
Write like a senior engineer teaching another engineer. Follow the given outline
section by section, explain concepts clearly, use technical language correctly,
provide concrete examples, and avoid repetition. Never write marketing copy,
exaggerated claims, or clickbait. Prefer examples, trade-offs, and practical
advice. Output the full article body as Markdown.`;

export class WritingAgent extends Agent<WritingInput, Draft> {
  readonly name = "writing";
  readonly inputSchema = WritingInputSchema;
  readonly outputSchema = DraftSchema;

  protected async produceOutput(input: WritingInput, _ctx: AgentContext): Promise<unknown> {
    return structuredCall({
      system: SYSTEM_PROMPT,
      userPrompt: `Outline:\n\n${JSON.stringify(input.outline, null, 2)}\n\nResearch report (for grounding facts, definitions, and examples):\n\n${JSON.stringify(input.research, null, 2)}\n\nWrite the complete first draft.`,
      schema: this.outputSchema,
      maxTokens: 16384,
    });
  }
}

export const writingAgent = new WritingAgent();
