import { z } from "zod";
import { Agent, type AgentContext } from "./Agent.js";
import { DraftSchema } from "../schemas/draft.js";
import { SeoReportSchema } from "../schemas/seo.js";
import { OutlineSchema } from "../schemas/outline.js";
import { PublishedMetadataSchema, type PublishedMetadata } from "../schemas/metadata.js";

const PublisherInputSchema = z.object({
  draft: DraftSchema,
  seo: SeoReportSchema,
  outline: OutlineSchema,
});

type PublisherInput = z.infer<typeof PublisherInputSchema>;

const WORDS_PER_MINUTE = 200;

function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function markdownToHtml(markdown: string): string {
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((block) => {
      const headingMatch = block.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1]!.length;
        return `<h${level}>${headingMatch[2]}</h${level}>`;
      }
      return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
    });
  return paragraphs.join("\n");
}

/**
 * Publisher is intentionally deterministic (no LLM call): it only assembles
 * artifacts already produced by upstream agents, per the "deterministic
 * where possible" non-functional requirement.
 */
export class Publisher extends Agent<PublisherInput, PublishedMetadata> {
  readonly name = "publisher";
  readonly inputSchema = PublisherInputSchema;
  readonly outputSchema = PublishedMetadataSchema;

  protected async produceOutput(input: PublisherInput, _ctx: AgentContext): Promise<unknown> {
    const { draft, seo, outline } = input;

    const frontmatter = [
      "---",
      `title: ${JSON.stringify(draft.title)}`,
      `subtitle: ${JSON.stringify(draft.subtitle)}`,
      `slug: ${JSON.stringify(seo.slug)}`,
      `metaTitle: ${JSON.stringify(seo.metaTitle)}`,
      `metaDescription: ${JSON.stringify(seo.metaDescription)}`,
      `keywords: ${JSON.stringify(seo.keywords)}`,
      "---",
      "",
    ].join("\n");

    const markdown = `${frontmatter}\n# ${draft.title}\n\n${draft.body}`;
    const html = markdownToHtml(markdown);
    const mdx = markdown;

    const tableOfContents = outline.sections.map((section) => ({
      heading: section.heading,
      anchor: slugifyHeading(section.heading),
    }));

    const wordCount = draft.body.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

    return {
      markdown,
      html,
      mdx,
      tableOfContents,
      readingTimeMinutes,
      images: [],
    };
  }
}

export const publisher = new Publisher();
