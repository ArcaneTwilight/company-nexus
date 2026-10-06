import { createHash } from "crypto";
import type { AgentChatTurn, AgentMode, AgentSuccessResponse, ResolvedKnowledgeMode } from "../types";
import { agentConfig } from "./config";

interface CacheEntry {
  expiresAt: number;
  value: AgentSuccessResponse;
}

const store = new Map<string, CacheEntry>();

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildAnswerCacheKey(options: {
  message: string;
  history?: AgentChatTurn[];
  mode: AgentMode;
  knowledgeMode: ResolvedKnowledgeMode;
}): string {
  const hist = (options.history ?? [])
    .slice(-4)
    .map((t) => `${t.role}:${normalizeMessage(t.content).slice(0, 200)}`)
    .join("|");
  const raw = [
    options.mode,
    options.knowledgeMode,
    normalizeMessage(options.message),
    hist,
  ].join("::");
  return createHash("sha256").update(raw).digest("hex");
}

function pruneExpired(now: number) {
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

function enforceMaxSize(max: number) {
  if (store.size <= max) return;
  const overflow = store.size - max;
  const keys = store.keys();
  for (let i = 0; i < overflow; i++) {
    const next = keys.next();
    if (next.done) break;
    store.delete(next.value);
  }
}

export function getCachedAnswer(key: string): AgentSuccessResponse | null {
  const { cacheTtlMs } = agentConfig();
  if (cacheTtlMs <= 0) return null;
  const now = Date.now();
  pruneExpired(now);
  const hit = store.get(key);
  if (!hit || hit.expiresAt <= now) {
    if (hit) store.delete(key);
    return null;
  }
  return {
    ...hit.value,
    cached: true,
    toolsUsed: hit.value.toolsUsed?.length
      ? [...hit.value.toolsUsed, "answer_cache"]
      : ["answer_cache"],
  };
}

/** Skip caching write turns and any turn that created proposals. */
export function setCachedAnswer(
  key: string,
  value: AgentSuccessResponse,
  mode: AgentMode
): void {
  const { cacheTtlMs, cacheMaxEntries } = agentConfig();
  if (cacheTtlMs <= 0) return;
  if (mode === "write") return;
  if (value.proposals?.length) return;

  const now = Date.now();
  pruneExpired(now);
  store.set(key, {
    expiresAt: now + cacheTtlMs,
    value: {
      success: true,
      reply: value.reply,
      proposals: [],
      toolsUsed: value.toolsUsed ?? [],
    },
  });
  enforceMaxSize(cacheMaxEntries);
}
