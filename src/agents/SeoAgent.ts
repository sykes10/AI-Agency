import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { DraftSchema } from "../schemas/draft.js";
import { OutlineSchema } from "../schemas/outline.js";
import { SeoReportSchema, type SeoReport } from "../schemas/seo.js";
import { structuredCall } from "../llm/structuredCall.js";
import { ArticleBriefSchema, formatArticleBrief } from "../schemas/articleBrief.js";

const SeoInputSchema = z.object({
  brief: ArticleBriefSchema,
  draft: DraftSchema,
  outline: OutlineSchema,
});

type SeoInput = z.infer<typeof SeoInputSchema>;

const SYSTEM_PROMPT = `You are the SEO Agent in a technical content pipeline for the
publication defined in the Article brief. Optimize discoverability without harming technical quality.
Generate a slug, meta title, meta description, keywords, FAQ, schema
suggestions, internal linking suggestions, and external linking suggestions.
You are never allowed to change or contradict the article's technical content.
Use the requested audience, content type, depth, and publication identity when
choosing search language and reader-facing metadata.

The meta description and FAQ answers are reader-facing prose, so they follow
the site's writing style: no em dash, no double-hyphen standing in for one, no
semicolon, no clickbait, no formulaic transitions or hedging. Write them the
way the article itself is written, direct and opinionated, not like ad copy.`;

export class SeoAgent extends Agent<SeoInput, SeoReport> {
  readonly name = "seo";
  readonly inputSchema = SeoInputSchema;
  readonly outputSchema = SeoReportSchema;

  protected async produceOutput(input: SeoInput, ctx: AgentContext): Promise<unknown> {
    return structuredCall({
      system: SYSTEM_PROMPT,
      userPrompt: `${formatArticleBrief(input.brief)}\n\nDraft:\n\n${JSON.stringify(input.draft, null, 2)}\n\nOutline:\n\n${JSON.stringify(input.outline, null, 2)}\n\nProduce the SEO report without drifting from the Article brief.`,
      schema: this.outputSchema,
      stage: "seo",
      emit: ctx.emit,
    });
  }
}

export const seoAgent = new SeoAgent();
