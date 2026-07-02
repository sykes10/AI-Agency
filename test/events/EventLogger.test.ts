import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let tmpDir: string;
let originalCwd: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "press-agency-eventlog-test-"));
  await fs.mkdir(path.join(tmpDir, "articles", "a1"), { recursive: true });
  process.chdir(tmpDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("EventLogger", () => {
  it("appends validated events to a per-article JSONL file and reads them back in order", async () => {
    const { EventLogger } = await import("../../src/events/EventLogger.js");
    const logger = new EventLogger();

    await logger.append("a1", { type: "AgentStarted", agent: "research" });
    await logger.append("a1", { type: "AgentCompleted", agent: "research" });
    await logger.append("a1", { type: "Completed" });

    const events = await logger.readAll("a1");
    expect(events.map((e) => e.type)).toEqual(["AgentStarted", "AgentCompleted", "Completed"]);
    expect(events.every((e) => typeof e.ts === "string")).toBe(true);
  });

  it("returns an empty array for an article with no event log yet", async () => {
    const { EventLogger } = await import("../../src/events/EventLogger.js");
    const logger = new EventLogger();
    expect(await logger.readAll("does-not-exist")).toEqual([]);
  });

  it("rejects an event that does not match the event schema", async () => {
    const { EventLogger } = await import("../../src/events/EventLogger.js");
    const logger = new EventLogger();
    await expect(
      // @ts-expect-error intentionally invalid event type for the test
      logger.append("a1", { type: "NotARealEvent" })
    ).rejects.toThrow();
  });
});
