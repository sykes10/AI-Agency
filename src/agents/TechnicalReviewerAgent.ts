import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { ResearchReportSchema } from "../schemas/research.js";
import { DraftSchema } from "../schemas/draft.js";
import { TechnicalReviewSchema, type TechnicalReview } from "../schemas/reviews.js";
import { structuredCall } from "../llm/structuredCall.js";

const TechnicalReviewInputSchema = z.object({
  draft: DraftSchema,
  research: ResearchReportSchema,
});

type TechnicalReviewInput = z.infer<typeof TechnicalReviewInputSchema>;

const SYSTEM_PROMPT = `You are the Technical Reviewer in a technical content pipeline.
Challenge every technical statement in the draft. Verify correctness, terminology,
API usage, architectural claims, edge cases, security concerns, and performance
considerations against the research report. Do not rewrite the article. Only
review it and list issues with severity, a suggested fix, and your reasoning.`;

export class TechnicalReviewerAgent extends Agent<TechnicalReviewInput, TechnicalReview> {
  readonly name = "technical-review";
  readonly inputSchema = TechnicalReviewInputSchema;
  readonly outputSchema = TechnicalReviewSchema;

  protected async produceOutput(input: TechnicalReviewInput, _ctx: AgentContext): Promise<unknown> {
    return structuredCall({
      system: SYSTEM_PROMPT,
      userPrompt: `Draft:\n\n${JSON.stringify(input.draft, null, 2)}\n\nResearch report:\n\n${JSON.stringify(input.research, null, 2)}\n\nReview the draft for technical correctness.`,
      schema: this.outputSchema,
    });
  }
}

export const technicalReviewerAgent = new TechnicalReviewerAgent();
