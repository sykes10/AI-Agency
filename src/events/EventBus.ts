import { EventEmitter } from "node:events";
import type { AgentEvent } from "../schemas/events.js";

class EventBus {
  private emitters = new Map<string, EventEmitter>();

  private emitterFor(articleId: string): EventEmitter {
    let emitter = this.emitters.get(articleId);
    if (!emitter) {
      emitter = new EventEmitter();
      emitter.setMaxListeners(50);
      this.emitters.set(articleId, emitter);
    }
    return emitter;
  }

  publish(articleId: string, event: AgentEvent): void {
    this.emitterFor(articleId).emit("event", event);
  }

  subscribe(articleId: string, listener: (event: AgentEvent) => void): () => void {
    const emitter = this.emitterFor(articleId);
    emitter.on("event", listener);
    return () => emitter.off("event", listener);
  }
}

export const eventBus = new EventBus();
