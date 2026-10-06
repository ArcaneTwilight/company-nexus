import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import type { KnowledgeChunk, KnowledgeChunkSourceCollection } from "../types";

export const KNOWLEDGE_CHUNKS_COLLECTION = "knowledgeChunks";
export const SOURCE_COLLECTIONS: KnowledgeChunkSourceCollection[] = [
  "faqs",
  "kbArticles",
  "companyApps",
  "knowledgeDocs",
];

export type SourceDocument = Record<string, unknown> & { id: string };

function firestore(): Firestore {
  const app = getApps()[0] ?? initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  });
  return getFirestore(app);
}

export function knowledgeChunkId(
  sourceCollection: KnowledgeChunkSourceCollection,
  sourceDocId: string,
  chunkIndex: number
): string {
  const key = `${sourceCollection}:${sourceDocId}:${chunkIndex}`;
  return `chunk-${createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
}

export async function listSourceDocuments(
  sourceCollection: KnowledgeChunkSourceCollection
): Promise<SourceDocument[]> {
  const snapshot = await firestore().collection(sourceCollection).get();
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
}

async function commitOperations(
  operations: Array<(batch: FirebaseFirestore.WriteBatch) => void>
): Promise<void> {
  const db = firestore();
  for (let start = 0; start < operations.length; start += 450) {
    const batch = db.batch();
    for (const operation of operations.slice(start, start + 450)) operation(batch);
    await batch.commit();
  }
}

export async function replaceKnowledgeChunks(
  sourceCollection: KnowledgeChunkSourceCollection,
  sourceDocId: string,
  chunks: KnowledgeChunk[]
): Promise<void> {
  const db = firestore();
  const existing = await db
    .collection(KNOWLEDGE_CHUNKS_COLLECTION)
    .where("sourceCollection", "==", sourceCollection)
    .where("sourceDocId", "==", sourceDocId)
    .get();

  const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
  for (const document of existing.docs) {
    operations.push((batch) => batch.delete(document.ref));
  }
  for (const chunk of chunks) {
    const id = knowledgeChunkId(sourceCollection, sourceDocId, chunk.chunkIndex);
    operations.push((batch) => batch.set(db.collection(KNOWLEDGE_CHUNKS_COLLECTION).doc(id), {
      ...chunk,
      id,
    }));
  }
  await commitOperations(operations);
}