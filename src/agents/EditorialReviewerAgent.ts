import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { DraftSchema } from "../schemas/draft.js";
import { EditorialReviewSchema, type EditorialReview } from "../schemas/reviews.js";
import { structuredCall } from "../llm/structuredCall.js";

const EditorialReviewInputSchema = z.object({
  draft: DraftSchema,
});

type EditorialReviewInput = z.infer<typeof EditorialReviewInputSchema>;

const SYSTEM_PROMPT = `You are the Editorial Reviewer in a technical content pipeline for
Frontend Blueprints. Improve readability and enforce the site's writing style.
Do not rewrite the article: produce annotated suggestions tied to specific
locations in the text.

Check paragraph length, transitions, duplicated information, pacing, clarity,
consistency, and grammar. Also flag any of these style violations:
- An em dash, a double-hyphen "--" standing in for one, or a semicolon
  anywhere in the prose. These are banned outright.
- A colon used to glue two independent clauses together instead of
  introducing a genuine list or elaboration.
- Formulaic transitions ("Moreover," "Furthermore," "In conclusion," "It's
  worth noting that").
- Excessive hedging ("arguably," "it could be said," stacked qualifiers) on a
  claim the draft otherwise commits to.
- Rule-of-three padding: exactly three parallel examples reached for rhythm
  rather than because three is the real count.
- A bulleted list used in place of connected, reasoned prose where the items
  aren't genuinely parallel or scannable.
- A generic intro that restates the title, or a generic outro that just
  summarizes what was already said.
- Uniform, repetitive sentence rhythm: a run of sentences all the same length
  and subject-verb-object shape.
- Over-signposting ("In this section, we will discuss...") that just restates
  the heading.
- Restating what a code sample already shows, or defining a term a mid-level
  frontend engineer already knows.`;

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
