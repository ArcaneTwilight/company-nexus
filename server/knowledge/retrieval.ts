import { embedTexts } from "../agent/embeddings";
import { listKnowledgeChunks } from "../data/store";
import type { KnowledgeChunk, KnowledgeCitation, ToolContext } from "../types";

export const DEFAULT_KNOWLEDGE_RETRIEVAL_K = 5;
const CHUNK_CACHE_TTL_MS = 5 * 60 * 1000;

export interface RetrievedKnowledgeChunk extends KnowledgeCitation {
  chunkText: string;
}

interface ChunkCacheEntry {
  expiresAt: number;
  chunks: KnowledgeChunk[];
}

const chunkCache = new Map<string, ChunkCacheEntry>();

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) return -1;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return -1;
  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}

async function loadChunks(ctx: ToolContext): Promise<KnowledgeChunk[]> {
  const key = `${ctx.projectId ?? "local"}:${ctx.uid}`;
  const cached = chunkCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.chunks;

  const chunks = await listKnowledgeChunks(ctx);
  chunkCache.set(key, { chunks, expiresAt: Date.now() + CHUNK_CACHE_TTL_MS });
  console.log(`[knowledge] loaded ${chunks.length} embedded chunks for ${key}`);
  return chunks;
}

export async function retrieveKnowledgeChunks(
  ctx: ToolContext,
  query: string,
  options?: { k?: number }
): Promise<RetrievedKnowledgeChunk[]> {
  const chunks = await loadChunks(ctx);
  if (chunks.length === 0 || !query.trim()) return [];

  const { embeddings } = await embedTexts([query.trim()]);
  const queryEmbedding = embeddings[0] ?? [];
  const k = Math.max(1, options?.k ?? DEFAULT_KNOWLEDGE_RETRIEVAL_K);

  return chunks
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .filter((chunk) => chunk.score >= 0)
    .sort((left, right) => right.score - left.score || left.chunkIndex - right.chunkIndex)
    .slice(0, k)
    .map(({ id, sourceCollection, sourceDocId, chunkIndex, title, sectionHeading, score, chunkText }) => ({
      id,
      sourceCollection,
      sourceDocId,
      chunkIndex,
      title,
      sectionHeading,
      score: Math.round(score * 10000) / 10000,
      chunkText,
    }));
}