import { z } from "zod";
import { ArticleStatusSchema } from "./article.js";

export const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("AgentStarted"), agent: z.string(), ts: z.string() }),
  z.object({ type: z.literal("ThinkingStarted"), agent: z.string(), ts: z.string() }),
  z.object({ type: z.literal("ThinkingCompleted"), agent: z.string(), ts: z.string() }),
  z.object({
    type: z.literal("ToolRequested"),
    agent: z.string(),
    tool: z.string(),
    input: z.unknown(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("ToolCompleted"),
    agent: z.string(),
    tool: z.string(),
    summary: z.string(),
    error: z.boolean().default(false),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("ArtifactCreated"),
    agent: z.string(),
    artifact: z.string(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("OutputProduced"),
    agent: z.string(),
    output: z.unknown(),
    ts: z.string(),
  }),
  z.object({ type: z.literal("AgentCompleted"), agent: z.string(), ts: z.string() }),
  z.object({ type: z.literal("ReviewGenerated"), agent: z.string(), ts: z.string() }),
  z.object({
    type: z.literal("Retry"),
    agent: z.string(),
    attempt: z.number().int(),
    reason: z.string(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("StatusChanged"),
    from: ArticleStatusSchema,
    to: ArticleStatusSchema,
    ts: z.string(),
  }),
  z.object({ type: z.literal("Completed"), ts: z.string() }),
  z.object({
    type: z.literal("Failed"),
    agent: z.string().optional(),
    error: z.string(),
    ts: z.string(),
  }),
]);

export type AgentEvent = z.infer<typeof EventSchema>;

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

export type AgentEventInput = DistributiveOmit<AgentEvent, "ts">;
