import { z } from "zod";
import { DraftSchema } from "./draft.js";

export const ReviewFindingSourceSchema = z.enum(["technical", "editorial"]);
export const ReviewFindingDecisionSchema = z.enum(["applied", "rejected"]);

export const ReviewFindingResolutionSchema = z.object({
  source: ReviewFindingSourceSchema,
  findingIndex: z.number().int().nonnegative(),
  decision: ReviewFindingDecisionSchema,
  reason: z.string().min(1),
});

export const RevisedDraftSchema = DraftSchema.extend({
  resolutions: z.array(ReviewFindingResolutionSchema),
});

export type RevisedDraft = z.infer<typeof RevisedDraftSchema>;
