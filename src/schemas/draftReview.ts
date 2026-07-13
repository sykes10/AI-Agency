import { z } from "zod";

export const DraftReviewActionSchema = z.enum(["approve", "reject", "iterate"]);

export const DraftReviewEntrySchema = z.object({
  action: DraftReviewActionSchema,
  iteration: z.number().int().nonnegative(),
  feedback: z.string().nullable(),
  createdAt: z.string(),
});

export const DraftReviewSchema = z.object({
  state: z.enum(["pending", "approved", "rejected", "iteration_requested"]),
  iteration: z.number().int().nonnegative(),
  feedback: z.string().nullable(),
  history: z.array(DraftReviewEntrySchema),
  updatedAt: z.string(),
});

export const DraftReviewRequestSchema = z
  .object({
    action: DraftReviewActionSchema,
    feedback: z.string().trim().max(5000).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.action === "reject" || value.action === "iterate") && !value.feedback) {
      ctx.addIssue({
        code: "custom",
        path: ["feedback"],
        message: `Feedback is required when you ${value.action} a Draft`,
      });
    }
  });

export type DraftReview = z.infer<typeof DraftReviewSchema>;
export type DraftReviewAction = z.infer<typeof DraftReviewActionSchema>;
