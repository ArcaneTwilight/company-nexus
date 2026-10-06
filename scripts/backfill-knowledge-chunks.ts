import "dotenv/config";
import { embedTexts } from "../server/agent/embeddings";
import {
  listSourceDocuments,
  replaceKnowledgeChunks,
  SOURCE_COLLECTIONS,
  knowledgeChunkId,
  type SourceDocument,
} from "../server/data/knowledgeChunkRepository";
import { chunkDocument, type ChunkDraft } from "../server/knowledge/chunker";
import type { KnowledgeChunk } from "../server/types";

const dryRun = process.argv.includes("--dry-run");

interface BackfillStats {
  documentsDiscovered: number;
  documentsProcessed: number;
  chunksCreated: number;
  skippedEmpty: number;
  embeddingFailures: number;
  retries: number;
}

const stats: BackfillStats = {
  documentsDiscovered: 0,
  documentsProcessed: 0,
  chunksCreated: 0,
  skippedEmpty: 0,
  embeddingFailures: 0,
  retries: 0,
};

function withIndexes(
  drafts: ChunkDraft[],
  embeddings: number[][],
  model: string,
  dimensions: number
): KnowledgeChunk[] {
  return drafts.map((draft, chunkIndex) => ({
    ...draft,
    id: knowledgeChunkId(draft.sourceCollection, draft.sourceDocId, chunkIndex),
    chunkIndex,
    embedding: embeddings[chunkIndex] ?? [],
    embeddingModel: model,
    embeddingDimensions: dimensions,
  }));
}

async function main(): Promise<void> {
  console.log(`[backfill] starting${dryRun ? " dry-run" : ""}`);
  for (const sourceCollection of SOURCE_COLLECTIONS) {
    let documents: SourceDocument[];
    try {
      documents = await listSourceDocuments(sourceCollection);
    } catch (error) {
      stats.embeddingFailures += 1;
      console.error(
        `[backfill] failed to read ${sourceCollection}:`,
        error instanceof Error ? error.message : error
      );
      continue;
    }

    stats.documentsDiscovered += documents.length;
    console.log(`[backfill] ${sourceCollection} documents=${documents.length}`);
    const entries = documents
      .map((document) => ({ document, drafts: chunkDocument(sourceCollection, document) }))
      .filter(({ document, drafts }) => {
        if (drafts.length > 0) return true;
        stats.skippedEmpty += 1;
        console.warn(`[backfill] skipped empty ${sourceCollection}/${document.id}`);
        return false;
      });

    if (dryRun) {
      for (const { document, drafts } of entries) {
        stats.documentsProcessed += 1;
        stats.chunksCreated += drafts.length;
        console.log(`[backfill] dry-run ${sourceCollection}/${document.id} chunks=${drafts.length}`);
      }
      continue;
    }

    try {
      const allDrafts = entries.flatMap(({ drafts }) => drafts);
      const result = await embedTexts(allDrafts.map((draft) => draft.chunkText));
      stats.retries += result.retries;
      let offset = 0;

      for (const { document, drafts } of entries) {
        const documentEmbeddings = result.embeddings.slice(offset, offset + drafts.length);
        offset += drafts.length;
        try {
          const chunks = withIndexes(
            drafts,
            documentEmbeddings,
            result.model,
            result.dimensions
          );
          await replaceKnowledgeChunks(sourceCollection, document.id, chunks);
          stats.documentsProcessed += 1;
          stats.chunksCreated += chunks.length;
          console.log(`[backfill] processed ${sourceCollection}/${document.id} chunks=${chunks.length}`);
        } catch (error) {
          stats.embeddingFailures += 1;
          console.error(
            `[backfill] failed to write ${sourceCollection}/${document.id}:`,
            error instanceof Error ? error.message : error
          );
        }
      }
      console.log(`[backfill] embedded ${sourceCollection} chunks=${allDrafts.length} batches=${result.batches}`);
    } catch (error) {
      stats.embeddingFailures += 1;
      console.error(
        `[backfill] failed to embed ${sourceCollection}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(
    `[backfill] complete docs=${stats.documentsProcessed}/${stats.documentsDiscovered} ` +
      `chunks=${stats.chunksCreated} skipped=${stats.skippedEmpty} ` +
      `failures=${stats.embeddingFailures} retries=${stats.retries}`
  );

  if (stats.embeddingFailures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[backfill] fatal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
