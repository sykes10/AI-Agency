import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { DraftSchema } from "../schemas/draft.js";
import { OutlineSchema } from "../schemas/outline.js";
import { SeoReportSchema, type SeoReport } from "../schemas/seo.js";
import { structuredCall } from "../llm/structuredCall.js";

const SeoInputSchema = z.object({
  draft: DraftSchema,
  outline: OutlineSchema,
});

type SeoInput = z.infer<typeof SeoInputSchema>;

const SYSTEM_PROMPT = `You are the SEO Agent in a technical content pipeline for Frontend
Blueprints. Optimize discoverability without harming technical quality.
Generate a slug, meta title, meta description, keywords, FAQ, schema
suggestions, internal linking suggestions, and external linking suggestions.
You are never allowed to change or contradict the article's technical content.

The meta description and FAQ answers are reader-facing prose, so they follow
the site's writing style: no em dash, no double-hyphen standing in for one, no
semicolon, no clickbait, no formulaic transitions or hedging. Write them the
way the article itself is written, direct and opinionated, not like ad copy.`;

export class SeoAgent extends Agent<SeoInput, SeoReport> {
  readonly name = "seo";
  readonly inputSchema = SeoInputSchema;
  readonly outputSchema = SeoReportSchema;

  protected async produceOutput(input: SeoInput, _ctx: AgentContext): Promise<unknown> {
    return structuredCall({
      system: SYSTEM_PROMPT,
      userPrompt: `Draft:\n\n${JSON.stringify(input.draft, null, 2)}\n\nOutline:\n\n${JSON.stringify(input.outline, null, 2)}\n\nProduce the SEO report.`,
      schema: this.outputSchema,
    });
  }
}

export const seoAgent = new SeoAgent();
