import fs from "node:fs/promises";
import { EventSchema, type AgentEvent, type AgentEventInput } from "../schemas/events.js";
import { eventsLogPath } from "../storage/paths.js";
import { eventBus } from "./EventBus.js";

export class EventLogger {
  async append(articleId: string, input: AgentEventInput): Promise<AgentEvent> {
    const event = EventSchema.parse({ ...input, ts: new Date().toISOString() });
    await fs.appendFile(eventsLogPath(articleId), `${JSON.stringify(event)}\n`, "utf-8");
    eventBus.publish(articleId, event);
    return event;
  }

  async readAll(articleId: string): Promise<AgentEvent[]> {
    try {
      const raw = await fs.readFile(eventsLogPath(articleId), "utf-8");
      return raw
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => EventSchema.parse(JSON.parse(line)));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }
}

export const eventLogger = new EventLogger();
