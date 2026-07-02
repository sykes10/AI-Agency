import fs from "node:fs/promises";
import {
  ArticleSchema,
  type Article,
  type ArticleStatus,
  type CreateArticleRequest,
} from "../schemas/article.js";
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
import {
  articleDir,
  articleRecordPath,
  articlesRoot,
  finalMarkdownPath,
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

    const [research, outline, draft, technical, editorial, seo, metadata] = await Promise.all([
      readJson(stagePath(id, "research")),
      readJson(stagePath(id, "outline")),
      readJson(stagePath(id, "draft")),
      readJson(stagePath(id, "reviews_technical")),
      readJson(stagePath(id, "reviews_editorial")),
      readJson(stagePath(id, "seo")),
      readJson(stagePath(id, "metadata")),
    ]);

    const article: Article = ArticleSchema.parse({
      ...record,
      research: research ? ResearchReportSchema.parse(research) : null,
      outline: outline ? OutlineSchema.parse(outline) : null,
      draft: draft ? DraftSchema.parse(draft) : null,
      reviews: {
        technical: technical ? TechnicalReviewSchema.parse(technical) : null,
        editorial: editorial ? EditorialReviewSchema.parse(editorial) : null,
      },
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
        contentType: r.contentType,
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
    await writeJson(stagePath(id, "draft"), value);
  }

  async saveTechnicalReview(id: string, value: TechnicalReview): Promise<void> {
    await writeJson(stagePath(id, "reviews_technical"), value);
  }

  async saveEditorialReview(id: string, value: EditorialReview): Promise<void> {
    await writeJson(stagePath(id, "reviews_editorial"), value);
  }

  async saveSeo(id: string, value: SeoReport): Promise<void> {
    await writeJson(stagePath(id, "seo"), value);
  }

  async saveMetadata(id: string, value: PublishedMetadata): Promise<void> {
    await writeJson(stagePath(id, "metadata"), value);
    await fs.writeFile(finalMarkdownPath(id), value.markdown, "utf-8");
  }

  async readArtifact(id: string, stage: string): Promise<unknown | null> {
    const fileStage = stage === "technical" ? "reviews_technical" : stage === "editorial" ? "reviews_editorial" : stage;
    return readJson(stagePath(id, fileStage));
  }
}

export const articleStore = new ArticleStore();
