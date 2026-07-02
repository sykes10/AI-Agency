import { z } from "zod";

export const OutlineSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  targetAudience: z.string(),
  estimatedReadingTimeMinutes: z.number().int().positive(),
  introduction: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      summary: z.string(),
      codeExamples: z.array(z.string()),
      illustrationIdeas: z.array(z.string()),
    })
  ),
  takeaways: z.array(z.string()),
  conclusion: z.string(),
});

export type Outline = z.infer<typeof OutlineSchema>;
