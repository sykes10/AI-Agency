import type { Article, ArticleStatus } from "../schemas/article.js";
import type { AgentContext } from "../agents/Agent.js";
import type { ArticleStore } from "../storage/ArticleStore.js";
import { researchAgent } from "../agents/ResearchAgent.js";
import { planningAgent } from "../agents/PlanningAgent.js";
import { writingAgent } from "../agents/WritingAgent.js";
import { technicalReviewerAgent } from "../agents/TechnicalReviewerAgent.js";
import { editorialReviewerAgent } from "../agents/EditorialReviewerAgent.js";
import { seoAgent } from "../agents/SeoAgent.js";
import { publisher } from "../agents/Publisher.js";
import { revisionAgent } from "../agents/RevisionAgent.js";

export interface StageDef {
  status: ArticleStatus;
  agentName: string;
  isDone: (article: Article) => boolean;
  run: (article: Article, ctx: AgentContext) => Promise<void>;
}

export function buildPipeline(store: ArticleStore): StageDef[] {
  return [
    {
      status: "Researching",
      agentName: researchAgent.name,
      isDone: (a) => a.research !== null,
      run: async (a, ctx) => {
        const research = await researchAgent.run(
          { topic: a.topic, audience: a.audience, depth: a.depth },
          ctx
        );
        await store.saveResearch(a.id, research);
        a.research = research;
        await ctx.emit({ type: "ArtifactCreated", agent: researchAgent.name, artifact: "research" });
      },
    },
    {
      status: "Planning",
      agentName: planningAgent.name,
      isDone: (a) => a.outline !== null,
      run: async (a, ctx) => {
        const outline = await planningAgent.run({ research: a.research! }, ctx);
        await store.saveOutline(a.id, outline);
        await store.setTitle(a.id, outline.title);
        a.outline = outline;
        a.title = outline.title;
        await ctx.emit({ type: "ArtifactCreated", agent: planningAgent.name, artifact: "outline" });
      },
    },
    {
      status: "Writing",
      agentName: writingAgent.name,
      isDone: (a) => a.draft !== null,
      run: async (a, ctx) => {
        const draft = await writingAgent.run({ outline: a.outline!, research: a.research! }, ctx);
        await store.saveDraft(a.id, draft);
        a.draft = draft;
        await ctx.emit({ type: "ArtifactCreated", agent: writingAgent.name, artifact: "draft" });
      },
    },
    {
      status: "TechnicalReview",
      agentName: technicalReviewerAgent.name,
      isDone: (a) => a.reviews.technical !== null,
      run: async (a, ctx) => {
        const review = await technicalReviewerAgent.run(
          { draft: a.draft!, research: a.research! },
          ctx
        );
        await store.saveTechnicalReview(a.id, review);
        a.reviews.technical = review;
        await ctx.emit({ type: "ReviewGenerated", agent: technicalReviewerAgent.name });
        await ctx.emit({
          type: "ArtifactCreated",
          agent: technicalReviewerAgent.name,
          artifact: "reviews_technical",
        });
      },
    },
    {
      status: "EditorialReview",
      agentName: editorialReviewerAgent.name,
      isDone: (a) => a.reviews.editorial !== null,
      run: async (a, ctx) => {
        const review = await editorialReviewerAgent.run({ draft: a.draft! }, ctx);
        await store.saveEditorialReview(a.id, review);
        a.reviews.editorial = review;
        await ctx.emit({ type: "ReviewGenerated", agent: editorialReviewerAgent.name });
        await ctx.emit({
          type: "ArtifactCreated",
          agent: editorialReviewerAgent.name,
          artifact: "reviews_editorial",
        });
      },
    },
    {
      status: "Revising",
      agentName: revisionAgent.name,
      isDone: (a) => a.revisedDraft !== null,
      run: async (a, ctx) => {
        const revisedDraft = await revisionAgent.run(
          {
            draft: a.draft!,
            outline: a.outline!,
            research: a.research!,
            technicalReview: a.reviews.technical!,
            editorialReview: a.reviews.editorial!,
          },
          ctx
        );
        await store.saveRevisedDraft(a.id, revisedDraft);
        a.revisedDraft = revisedDraft;
        await ctx.emit({
          type: "ArtifactCreated",
          agent: revisionAgent.name,
          artifact: "revised_draft",
        });
      },
    },
    {
      status: "SEOReview",
      agentName: seoAgent.name,
      isDone: (a) => a.seo !== null,
      run: async (a, ctx) => {
        const seo = await seoAgent.run({ draft: a.revisedDraft!, outline: a.outline! }, ctx);
        await store.saveSeo(a.id, seo);
        a.seo = seo;
        await ctx.emit({ type: "ArtifactCreated", agent: seoAgent.name, artifact: "seo" });
      },
    },
    {
      status: "Ready",
      agentName: publisher.name,
      isDone: (a) => a.metadata !== null,
      run: async (a, ctx) => {
        const metadata = await publisher.run(
          { draft: a.revisedDraft!, seo: a.seo!, outline: a.outline! },
          ctx
        );
        await store.saveMetadata(a.id, metadata);
        a.metadata = metadata;
        await ctx.emit({ type: "ArtifactCreated", agent: publisher.name, artifact: "metadata" });
      },
    },
  ];
}
