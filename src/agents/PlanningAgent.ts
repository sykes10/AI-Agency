import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { ResearchReportSchema } from "../schemas/research.js";
import { OutlineSchema, type Outline } from "../schemas/outline.js";
import { structuredCall } from "../llm/structuredCall.js";

const PlanningInputSchema = z.object({
  research: ResearchReportSchema,
});

type PlanningInput = z.infer<typeof PlanningInputSchema>;

const SYSTEM_PROMPT = `You are the Planning Agent in a technical content pipeline.
Your only job is to transform a research report into a logical article outline.
You never write publication-ready prose. You produce structure: title, subtitle,
target audience, estimated reading time, section hierarchy, code examples,
illustration ideas, and a conclusion. Keep sections tightly scoped and ordered
so a Writing Agent can follow them without re-deriving structure.`;

export class PlanningAgent extends Agent<PlanningInput, Outline> {
  readonly name = "planning";
  readonly inputSchema = PlanningInputSchema;
  readonly outputSchema = OutlineSchema;

  protected async produceOutput(input: PlanningInput, ctx: AgentContext): Promise<unknown> {
    return structuredCall({
      system: SYSTEM_PROMPT,
      userPrompt: `Research report:\n\n${JSON.stringify(input.research, null, 2)}\n\nProduce the article outline.`,
      schema: this.outputSchema,
      stage: "planning",
      emit: ctx.emit,
    });
  }
}

export const planningAgent = new PlanningAgent();
