/**
 * Denormalize summary / outline / tokenEstimate onto Markdown-backed docs
 * so the live registry can prefer stored metadata instead of re-parsing bodies.
 */

import {
  contentHash,
  estimateTokens,
  extractOutline,
  extractSummary,
} from "./markdown";

const MARKDOWN_COLLECTIONS = new Set([
  "faqs",
  "kbArticles",
  "knowledgeDocs",
]);

export function isMarkdownKnowledgeCollection(collection: string): boolean {
  return MARKDOWN_COLLECTIONS.has(collection);
}

/**
 * Attach derived AI-retrieval fields. Safe to call on every write.
 * Does not overwrite a non-empty explicit `summary` on the document.
 */
export function enrichMarkdownDocument(
  doc: Record<string, unknown>
): Record<string, unknown> {
  const body = String(doc.body ?? "");
  const existingSummary =
    typeof doc.summary === "string" && doc.summary.trim()
      ? String(doc.summary).trim()
      : "";
  const title = String(doc.title ?? doc.id ?? "Untitled");
  const outline = extractOutline(body);
  const summary = existingSummary || extractSummary(body, 200) || title;
  const version =
    typeof doc.contentVersion === "number" && doc.contentVersion > 0
      ? doc.contentVersion
      : 1;

  return {
    ...doc,
    summary: summary.slice(0, 240),
    outline,
    tokenEstimate: estimateTokens(body),
    contentHash: contentHash(body),
    contentVersion: version,
  };
}
