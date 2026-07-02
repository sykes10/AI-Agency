import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { DraftSchema } from "../schemas/draft.js";
import { EditorialReviewSchema, type EditorialReview } from "../schemas/reviews.js";
import { structuredCall } from "../llm/structuredCall.js";

const EditorialReviewInputSchema = z.object({
  draft: DraftSchema,
});

type EditorialReviewInput = z.infer<typeof EditorialReviewInputSchema>;

const SYSTEM_PROMPT = `You are the Editorial Reviewer in a technical content pipeline.
Improve readability only. Check paragraph length, transitions, duplicated
information, pacing, clarity, consistency, and grammar. Do not rewrite the
article -- produce annotated suggestions tied to specific locations in the text.`;

export class EditorialReviewerAgent extends Agent<EditorialReviewInput, EditorialReview> {
  readonly name = "editorial-review";
  readonly inputSchema = EditorialReviewInputSchema;
  readonly outputSchema = EditorialReviewSchema;

  protected async produceOutput(input: EditorialReviewInput, _ctx: AgentContext): Promise<unknown> {
    return structuredCall({
      system: SYSTEM_PROMPT,
      userPrompt: `Draft:\n\n${JSON.stringify(input.draft, null, 2)}\n\nReview the draft for readability.`,
      schema: this.outputSchema,
    });
  }
}

export const editorialReviewerAgent = new EditorialReviewerAgent();
