import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { listKnowledgeChunks } from "../server/data/store";
import { runAgent } from "../server/agent/runAgent";
import type { AgentMode, KnowledgeChunk, ToolContext } from "../server/types";

interface EvalCase {
  question: string;
  expected: string[];
}

const EVAL_CASES: EvalCase[] = [
  { question: "How do I request a demo sandbox for a prospective client?", expected: ["faqs/faq-1"] },
  { question: "What template and client information are required for a demo sandbox?", expected: ["faqs/faq-1"] },
  { question: "How long does a demo sandbox take to spin up?", expected: ["faqs/faq-1"] },
  { question: "What are the responder and hotfix targets for a Critical P0 incident?", expected: ["faqs/faq-2"] },
  { question: "What are the assignment and patch targets for a High P1 incident?", expected: ["faqs/faq-2"] },
  { question: "How are legal terms and privacy guidelines updated inside the app?", expected: ["faqs/faq-3"] },
  { question: "Can support staff directly reset a client password?", expected: ["faqs/faq-4"] },
  { question: "What must be checked before submitting a mobile build?", expected: ["kbArticles/kb-1"] },
  { question: "Which Crashlytics artifacts are required for Android and iOS?", expected: ["kbArticles/kb-1"] },
  { question: "What Android staged rollout percentages and monitoring period are specified?", expected: ["kbArticles/kb-1"] },
  { question: "How long is the iOS phased rollout schedule?", expected: ["kbArticles/kb-1"] },
  { question: "What causes local database synchronization faults?", expected: ["kbArticles/kb-2"] },
  { question: "What does Force Database Rebuild do?", expected: ["kbArticles/kb-2"] },
  { question: "What should an administrator do when sync headers lag the database?", expected: ["kbArticles/kb-2"] },
  { question: "Where should the client diagnostic package be uploaded?", expected: ["kbArticles/kb-2"] },
  { question: "How long is the access token valid and how must it be sent?", expected: ["kbArticles/kb-3"] },
  { question: "How long is the refresh token valid and where is it stored?", expected: ["kbArticles/kb-3"] },
  { question: "What happens after a client API receives a 401 Unauthorized?", expected: ["kbArticles/kb-3"] },
  { question: "What happens when the refresh token expires?", expected: ["kbArticles/kb-3"] },
];

const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";

function contextFor(chunks: KnowledgeChunk[]): string {
  return chunks.map((chunk, index) => [
    `[${index + 1}] Source: ${chunk.title} [${chunk.sourceCollection}/${chunk.sourceDocId}, chunk ${chunk.chunkIndex}]`,
    chunk.chunkText,
  ].join("\n")).join("\n\n");
}

async function legacyContextAnswer(ai: GoogleGenAI, question: string, chunks: KnowledgeChunk[]): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: question }] }],
    config: {
      systemInstruction: `Answer only from the full knowledge corpus below. Do not guess. Cite the exact source title(s) used in a Sources section.\n\nFull knowledge corpus:\n${contextFor(chunks)}`,
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });
  return response.text?.trim() || "";
}

function sourceKey(collection: string, id: string): string {
  return `${collection}/${id}`;
}

function citedByText(answer: string, chunks: KnowledgeChunk[]): string[] {
  return Array.from(new Set(
    chunks
      .filter((chunk) => answer.toLowerCase().includes(chunk.title.toLowerCase()))
      .map((chunk) => sourceKey(chunk.sourceCollection, chunk.sourceDocId))
  ));
}

function matchesExpected(actual: string[], expected: string[]): boolean {
  return expected.every((source) => actual.includes(source));
}

function createEvalContext(): ToolContext {
  return {
    uid: "eval",
    idToken: process.env.NEXUS_ID_TOKEN || null,
    useFirestore: Boolean(process.env.NEXUS_ID_TOKEN && (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID)),
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || null,
    proposals: [],
    knowledgeMode: "general",
    allowedDomains: ["support", "developer", "clients", "team", "reports", "general"],
    retrievalBudget: { registrySearches: 0, summaries: 0, sections: 0, fullDocs: 0, legacyBodySearches: 0 },
  };
}

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required.");
  const ctx = createEvalContext();
  const allChunks = await listKnowledgeChunks(ctx);
  if (allChunks.length === 0) throw new Error("No knowledgeChunks were loaded; run the Phase 1 backfill or configure NEXUS_ID_TOKEN.");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log(`Loaded ${allChunks.length} chunks; model=${model}`);
  console.log("question\tlegacy\tretrieval\texpected\tlegacyAnswer\tretrievalAnswer");

  for (const test of EVAL_CASES) {
    const legacyAnswer = await legacyContextAnswer(ai, test.question, allChunks);
    const result = await runAgent({ message: test.question, mode: "kb" as AgentMode, ctx });
    const legacySources = citedByText(legacyAnswer, allChunks);
    const retrievalSources = citedByText(result.reply, allChunks);
    const structuredSources = result.citations?.map((citation) => sourceKey(citation.sourceCollection, citation.sourceDocId)) ?? [];
    const retrievalUsed = Array.from(new Set([...retrievalSources, ...structuredSources]));
    console.log([
      test.question,
      matchesExpected(legacySources, test.expected) ? "PASS" : "FAIL",
      matchesExpected(retrievalUsed, test.expected) ? "PASS" : "FAIL",
      test.expected.join(","),
      JSON.stringify(legacyAnswer),
      JSON.stringify(result.reply),
    ].join("\t"));
  }
}

main().catch((error) => {
  console.error("[eval] fatal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});