import fs from "node:fs/promises";
import {
  ArticleSchema,
  type Article,
  type ArticleStatus,
  type CreateArticleRequest,
} from "../schemas/article.js";
import { DraftReviewSchema, type DraftReview, type DraftReviewAction } from "../schemas/draftReview.js";
import { ResearchReportSchema, type ResearchReport } from "../schemas/research.js";
import { OutlineSchema, type Outline } from "../schemas/outline.js";
import { DraftSchema, type Draft } from "../schemas/draft.js";
import {
  TechnicalReviewSchema,
  EditorialReviewSchema,
  type TechnicalReview,
  type EditorialReview,
} from "../schemas/reviews.js";
import { SeoReportSchema, type SeoReport } from "../schemas/seo.js";
import { PublishedMetadataSchema, type PublishedMetadata } from "../schemas/metadata.js";
import { RevisedDraftSchema, type RevisedDraft } from "../schemas/revision.js";
import {
  articleDir,
  articleRecordPath,
  articlesRoot,
  finalMarkdownPath,
  draftVersionPath,
  stagePath,
} from "./paths.js";

interface ArticleRecord {
  id: string;
  title: string | null;
  status: ArticleStatus;
  topic: string;
  audience: string;
  contentType: Article["contentType"];
  depth: Article["depth"];
  createdAt: string;
  updatedAt: string;
  error: string | null;
  draftReview: DraftReview | null;
}

async function readJson(filePath: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
}

export class ArticleStore {
  async create(id: string, req: CreateArticleRequest): Promise<Article> {
    await fs.mkdir(articleDir(id), { recursive: true });
    const now = new Date().toISOString();
    const record: ArticleRecord = {
      id,
      title: null,
      status: "Queued",
      topic: req.topic,
      audience: req.audience,
      contentType: req.contentType,
      depth: req.depth ?? "deep-dive",
      createdAt: now,
      updatedAt: now,
      error: null,
      draftReview: null,
    };
    await writeJson(articleRecordPath(id), record);
    return this.load(id) as Promise<Article>;
  }

  async exists(id: string): Promise<boolean> {
    return (await readJson(articleRecordPath(id))) !== null;
  }

  async load(id: string): Promise<Article | null> {
    const record = (await readJson(articleRecordPath(id))) as ArticleRecord | null;
    if (!record) return null;

    const [research, outline, draft, technical, editorial, revisedDraft, seo, metadata] =
      await Promise.all([
        readJson(stagePath(id, "research")),
        readJson(stagePath(id, "outline")),
        readJson(stagePath(id, "draft")),
        readJson(stagePath(id, "reviews_technical")),
        readJson(stagePath(id, "reviews_editorial")),
        readJson(stagePath(id, "revised_draft")),
        readJson(stagePath(id, "seo")),
        readJson(stagePath(id, "metadata")),
      ]);

    const article: Article = ArticleSchema.parse({
      ...record,
      contentType: record.contentType ?? "blueprint",
      research: research ? ResearchReportSchema.parse(research) : null,
      outline: outline ? OutlineSchema.parse(outline) : null,
      draft: draft ? DraftSchema.parse(draft) : null,
      reviews: {
        technical: technical ? TechnicalReviewSchema.parse(technical) : null,
        editorial: editorial ? EditorialReviewSchema.parse(editorial) : null,
      },
      revisedDraft: revisedDraft ? RevisedDraftSchema.parse(revisedDraft) : null,
      seo: seo ? SeoReportSchema.parse(seo) : null,
      metadata: metadata ? PublishedMetadataSchema.parse(metadata) : null,
    });
    return article;
  }

  async list(): Promise<
    Array<Pick<Article, "id" | "title" | "status" | "topic" | "contentType" | "createdAt" | "updatedAt">>
  > {
    let entries: Array<import("node:fs").Dirent>;
    try {
      entries = await fs.readdir(articlesRoot(), { withFileTypes: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
    const ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    const records = await Promise.all(
      ids.map((id) => readJson(articleRecordPath(id)) as Promise<ArticleRecord | null>)
    );
    return records
      .filter((r): r is ArticleRecord => r !== null)
      .map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        topic: r.topic,
        contentType: r.contentType ?? "blueprint",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
  }

  async setStatus(id: string, status: ArticleStatus, error: string | null = null): Promise<void> {
    const record = (await readJson(articleRecordPath(id))) as ArticleRecord | null;
    if (!record) throw new Error(`Article not found: ${id}`);
    record.status = status;
    record.error = error;
    record.updatedAt = new Date().toISOString();
    await writeJson(articleRecordPath(id), record);
  }

  async setTitle(id: string, title: string): Promise<void> {
    const record = (await readJson(articleRecordPath(id))) as ArticleRecord | null;
    if (!record) throw new Error(`Article not found: ${id}`);
    record.title = title;
    record.updatedAt = new Date().toISOString();
    await writeJson(articleRecordPath(id), record);
  }

  async saveResearch(id: string, value: ResearchReport): Promise<void> {
    await writeJson(stagePath(id, "research"), value);
  }

  async saveOutline(id: string, value: Outline): Promise<void> {
    await writeJson(stagePath(id, "outline"), value);
  }

  async saveDraft(id: string, value: Draft): Promise<void> {
    const record = (await readJson(articleRecordPath(id))) as ArticleRecord | null;
    if (!record) throw new Error(`Article not found: ${id}`);
    const iteration = record.draftReview?.iteration ?? 0;
    await writeJson(draftVersionPath(id, iteration), value);
    await writeJson(stagePath(id, "draft"), value);
  }

  async requestDraftReview(id: string): Promise<DraftReview> {
    const record = (await readJson(articleRecordPath(id))) as ArticleRecord | null;
    if (!record) throw new Error(`Article not found: ${id}`);
    const now = new Date().toISOString();
    record.draftReview = {
      state: "pending",
      iteration: record.draftReview?.iteration ?? 0,
      feedback: null,
      history: record.draftReview?.history ?? [],
      updatedAt: now,
    };
    record.updatedAt = now;
    await writeJson(articleRecordPath(id), record);
    return DraftReviewSchema.parse(record.draftReview);
  }

  async decideDraft(
    id: string,
    action: DraftReviewAction,
    feedback: string | null
  ): Promise<DraftReview> {
    const record = (await readJson(articleRecordPath(id))) as ArticleRecord | null;
    if (!record) throw new Error(`Article not found: ${id}`);
    if (!record.draftReview) throw new Error("Draft is not awaiting review");

    const now = new Date().toISOString();
    const currentIteration = record.draftReview.iteration;
    record.draftReview.history.push({
      action,
      iteration: currentIteration,
      feedback,
      createdAt: now,
    });
    record.draftReview.state =
      action === "approve" ? "approved" : action === "reject" ? "rejected" : "iteration_requested";
    record.draftReview.feedback = feedback;
    if (action === "iterate") record.draftReview.iteration += 1;
    record.draftReview.updatedAt = now;
    record.updatedAt = now;
    await writeJson(articleRecordPath(id), record);
    return DraftReviewSchema.parse(record.draftReview);
  }

  async listDraftVersions(id: string): Promise<Array<{ iteration: number; draft: Draft }>> {
    const article = await this.load(id);
    if (!article) throw new Error(`Article not found: ${id}`);
    const maxIteration = article.draftReview?.iteration ?? 0;
    const versions = await Promise.all(
      Array.from({ length: maxIteration + 1 }, async (_, iteration) => {
        const draft = await readJson(draftVersionPath(id, iteration));
        return draft ? { iteration, draft: DraftSchema.parse(draft) } : null;
      })
    );
    return versions.filter((value): value is { iteration: number; draft: Draft } => value !== null);
  }

  async saveTechnicalReview(id: string, value: TechnicalReview): Promise<void> {
    await writeJson(stagePath(id, "reviews_technical"), value);
  }

  async saveEditorialReview(id: string, value: EditorialReview): Promise<void> {
    await writeJson(stagePath(id, "reviews_editorial"), value);
  }

  async saveRevisedDraft(id: string, value: RevisedDraft): Promise<void> {
    await writeJson(stagePath(id, "revised_draft"), value);
  }

  async saveSeo(id: string, value: SeoReport): Promise<void> {
    await writeJson(stagePath(id, "seo"), value);
  }

  async saveMetadata(id: string, value: PublishedMetadata): Promise<void> {
    await writeJson(stagePath(id, "metadata"), value);
    await fs.writeFile(finalMarkdownPath(id), value.markdown, "utf-8");
  }

  async readArtifact(id: string, stage: string): Promise<unknown | null> {
    const fileStage =
      stage === "technical"
        ? "reviews_technical"
        : stage === "editorial"
          ? "reviews_editorial"
          : stage === "revised-draft"
            ? "revised_draft"
            : stage;
    return readJson(stagePath(id, fileStage));
  }
}

export const articleStore = new ArticleStore();
