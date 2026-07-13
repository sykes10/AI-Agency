import { z } from "zod";
import {
  ContentTypeSchema,
  DepthSchema,
  type Article,
} from "./article.js";

export const PublicationProfileSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1),
  defaultAudience: z.string().min(1),
  voice: z.string().min(1),
});

export const TargetWordRangeSchema = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })
  .refine((range) => range.max >= range.min, {
    message: "Target word range maximum must be at least its minimum",
  });

export const ArticleBriefSchema = z.object({
  topic: z.string().min(1),
  audience: z.string().min(1),
  contentType: ContentTypeSchema,
  depth: DepthSchema,
  targetWordRange: TargetWordRangeSchema,
  publicationProfile: PublicationProfileSchema,
});

export type ArticleBrief = z.infer<typeof ArticleBriefSchema>;
export type PublicationProfile = z.infer<typeof PublicationProfileSchema>;

export const FRONTEND_BLUEPRINTS_PROFILE: PublicationProfile =
  PublicationProfileSchema.parse({
    name: "Frontend Blueprints",
    purpose:
      "Give working engineers production-grade mental models and clear technical judgment, not tutorials or marketing copy.",
    defaultAudience: "Competent frontend engineers",
    voice: "Direct, opinionated, evidence-led, and written peer to peer.",
  });

const TARGET_WORD_RANGES: Record<Article["depth"], ArticleBrief["targetWordRange"]> = {
  overview: { min: 1_200, max: 1_800 },
  "deep-dive": { min: 2_500, max: 4_000 },
};

const CONTENT_TYPE_GUIDANCE: Record<Article["contentType"], string> = {
  pattern:
    "Organize the article around a recurring problem, its context and forces, the recommended decision, trade-offs, and when not to use it.",
  blueprint:
    "Organize the article around system boundaries, components, data flow, failure modes, implementation, and operational concerns.",
};

export function buildArticleBrief(
  article: Pick<Article, "topic" | "audience" | "contentType" | "depth">
): ArticleBrief {
  return ArticleBriefSchema.parse({
    topic: article.topic,
    audience: article.audience,
    contentType: article.contentType,
    depth: article.depth,
    targetWordRange: TARGET_WORD_RANGES[article.depth],
    publicationProfile: FRONTEND_BLUEPRINTS_PROFILE,
  });
}

export function contentTypeGuidance(contentType: Article["contentType"]): string {
  return CONTENT_TYPE_GUIDANCE[contentType];
}

export function formatArticleBrief(brief: ArticleBrief): string {
  const validBrief = ArticleBriefSchema.parse(brief);
  const { publicationProfile, targetWordRange } = validBrief;
  return `<article_brief>
Topic: ${validBrief.topic}
Requested audience: ${validBrief.audience}
Content type: ${validBrief.contentType}
Depth: ${validBrief.depth}
Target length: ${targetWordRange.min.toLocaleString("en-US")}–${targetWordRange.max.toLocaleString("en-US")} words
Publication: ${publicationProfile.name}
Publication purpose: ${publicationProfile.purpose}
Publication voice: ${publicationProfile.voice}
Audience rule: Assume the knowledge of the requested audience. It overrides the publication's default audience of ${publicationProfile.defaultAudience}.
Structural guidance: ${contentTypeGuidance(validBrief.contentType)}
</article_brief>`;
}

