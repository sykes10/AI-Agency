import { z } from "zod";

export const SeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const TechnicalReviewSchema = z.object({
  issues: z.array(
    z.object({
      issue: z.string(),
      severity: SeveritySchema,
      suggestedFix: z.string(),
      reason: z.string(),
    })
  ),
});

export const EditorialReviewSchema = z.object({
  suggestions: z.array(
    z.object({
      location: z.string(),
      issue: z.string(),
      suggestion: z.string(),
    })
  ),
});

export type TechnicalReview = z.infer<typeof TechnicalReviewSchema>;
export type EditorialReview = z.infer<typeof EditorialReviewSchema>;
