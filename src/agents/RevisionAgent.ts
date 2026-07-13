import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { DraftSchema } from "../schemas/draft.js";
import { OutlineSchema } from "../schemas/outline.js";
import { ResearchReportSchema } from "../schemas/research.js";
import { TechnicalReviewSchema, EditorialReviewSchema } from "../schemas/reviews.js";
import { RevisedDraftSchema, type RevisedDraft } from "../schemas/revision.js";
import { structuredCall } from "../llm/structuredCall.js";

const RevisionInputSchema = z.object({
  draft: DraftSchema,
  outline: OutlineSchema,
  research: ResearchReportSchema,
  technicalReview: TechnicalReviewSchema,
  editorialReview: EditorialReviewSchema,
});

type RevisionInput = z.infer<typeof RevisionInputSchema>;

const SYSTEM_PROMPT = `You are the Revision Agent in a technical content pipeline for
Frontend Blueprints. Apply the Technical Review and Editorial Review to the
Draft in one revision pass. Preserve the article's argument, structure, voice,
and technically correct content.

Exercise judgment. Apply a finding when it improves correctness or readability.
Reject a finding when it is incorrect, conflicts with stronger evidence, or
would make the article worse. Record exactly one resolution for every finding,
using its zero-based index within the corresponding review. Every resolution
must explain what changed or why the finding was rejected.

The revised prose must follow the site's writing rules: no em dash, no
double-hyphen standing in for one, no semicolon, no clickbait, no formulaic
transitions, no unnecessary hedging, and no generic introduction or conclusion.`;

function assertResolutionCoverage(result: RevisedDraft, input: RevisionInput): void {
  const expected = {
    technical: input.technicalReview.issues.length,
    editorial: input.editorialReview.suggestions.length,
  } as const;

  for (const source of ["technical", "editorial"] as const) {
    const indexes = result.resolutions
      .filter((resolution) => resolution.source === source)
      .map((resolution) => resolution.findingIndex)
      .sort((a, b) => a - b);
    const expectedIndexes = Array.from({ length: expected[source] }, (_, index) => index);

    if (
      indexes.length !== expectedIndexes.length ||
      indexes.some((index, position) => index !== expectedIndexes[position])
    ) {
      throw new Error(
        `Revision must resolve every ${source} finding exactly once; expected indexes ` +
          `[${expectedIndexes.join(", ")}], received [${indexes.join(", ")}]`
      );
    }
  }
}

export class RevisionAgent extends Agent<RevisionInput, RevisedDraft> {
  readonly name = "revision";
  readonly inputSchema = RevisionInputSchema;
  readonly outputSchema = RevisedDraftSchema;

  protected async produceOutput(input: RevisionInput, _ctx: AgentContext): Promise<unknown> {
    const result = await structuredCall({
      system: SYSTEM_PROMPT,
      userPrompt: `Original Draft:\n\n${JSON.stringify(input.draft, null, 2)}\n\nArticle Outline:\n\n${JSON.stringify(input.outline, null, 2)}\n\nResearch Report:\n\n${JSON.stringify(input.research, null, 2)}\n\nTechnical Review (issues are indexed in array order):\n\n${JSON.stringify(input.technicalReview, null, 2)}\n\nEditorial Review (suggestions are indexed in array order):\n\n${JSON.stringify(input.editorialReview, null, 2)}\n\nProduce the Revised Draft and one resolution per review finding.`,
      schema: this.outputSchema,
      stage: "revision",
      maxTokens: 16384,
    });

    assertResolutionCoverage(result, input);
    return result;
  }
}

export const revisionAgent = new RevisionAgent();
