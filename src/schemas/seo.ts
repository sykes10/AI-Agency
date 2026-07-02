import { z } from "zod";

export const SeoReportSchema = z.object({
  slug: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  keywords: z.array(z.string()),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  schemaSuggestions: z.array(z.string()),
  internalLinkingSuggestions: z.array(z.string()),
  externalLinkingSuggestions: z.array(z.string()),
});

export type SeoReport = z.infer<typeof SeoReportSchema>;
