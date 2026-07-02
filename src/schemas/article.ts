import { z } from "zod";
import { ResearchReportSchema } from "./research.js";
import { OutlineSchema } from "./outline.js";
import { DraftSchema } from "./draft.js";
import { TechnicalReviewSchema, EditorialReviewSchema } from "./reviews.js";
import { SeoReportSchema } from "./seo.js";
import { PublishedMetadataSchema } from "./metadata.js";

export const ArticleStatusSchema = z.enum([
  "Queued",
  "Researching",
  "Planning",
  "Writing",
  "TechnicalReview",
  "EditorialReview",
  "SEOReview",
  "Ready",
  "Published",
  "Failed",
]);

export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;

export const DepthSchema = z.enum(["overview", "deep-dive"]);

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  status: ArticleStatusSchema,
  topic: z.string(),
  audience: z.string(),
  depth: DepthSchema.default("deep-dive"),
  createdAt: z.string(),
  updatedAt: z.string(),
  research: ResearchReportSchema.nullable().default(null),
  outline: OutlineSchema.nullable().default(null),
  draft: DraftSchema.nullable().default(null),
  reviews: z
    .object({
      technical: TechnicalReviewSchema.nullable().default(null),
      editorial: EditorialReviewSchema.nullable().default(null),
    })
    .default({ technical: null, editorial: null }),
  seo: SeoReportSchema.nullable().default(null),
  metadata: PublishedMetadataSchema.nullable().default(null),
  error: z.string().nullable().default(null),
});

export type Article = z.infer<typeof ArticleSchema>;

export const CreateArticleRequestSchema = z.object({
  topic: z.string().min(1),
  audience: z.string().min(1),
  depth: DepthSchema.optional(),
});

export type CreateArticleRequest = z.infer<typeof CreateArticleRequestSchema>;
