import { z } from "zod";

export const DraftSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  body: z.string(),
});

export type Draft = z.infer<typeof DraftSchema>;
