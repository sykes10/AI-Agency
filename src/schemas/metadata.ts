import { z } from "zod";

export const PublishedMetadataSchema = z.object({
  markdown: z.string(),
  html: z.string(),
  mdx: z.string(),
  tableOfContents: z.array(z.object({ heading: z.string(), anchor: z.string() })),
  readingTimeMinutes: z.number().int().positive(),
  images: z.array(z.string()).default([]),
});

export type PublishedMetadata = z.infer<typeof PublishedMetadataSchema>;
