import { z } from "zod";

export const ResearchReportSchema = z.object({
  topic: z.string(),
  definitions: z.array(
    z.object({ term: z.string(), definition: z.string() })
  ),
  references: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      note: z.string().optional(),
    })
  ),
  usefulLinks: z.array(z.string()),
  examples: z.array(z.string()),
  misunderstoodConcepts: z.array(
    z.object({ concept: z.string(), clarification: z.string() })
  ),
  openQuestions: z.array(z.string()),
  recentChanges: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
});

export type ResearchReport = z.infer<typeof ResearchReportSchema>;
