/** Client-side Markdown helpers for knowledge docs (mirrors server/knowledge/markdown). */

import type { KnowledgeOutlineHeading } from "../types";

/** Soft warning threshold (~500 tokens). Advisory only — never blocks saves. */
export const SECTION_SOFT_CAP_CHARS = 2000;

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function contentHash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function extractOutline(markdown: string): KnowledgeOutlineHeading[] {
  const outline: KnowledgeOutlineHeading[] = [];
  const re = /^(#{1,6})\s+(.+?)\s*$/gm;
  const matches = [...markdown.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const heading = (m[2] ?? "").trim();
    if (!heading) continue;
    const charStart = m.index ?? 0;
    const next = matches[i + 1];
    const charEnd = next?.index ?? markdown.length;
    outline.push({
      heading,
      anchor: slugifyHeading(heading),
      charStart,
      charEnd,
    });
  }
  return outline;
}

export function extractSummary(markdown: string, maxChars = 200): string {
  const cleaned = markdown
    .replace(/^#{1,6}\s+.+$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars - 1).trimEnd()}…`;
}

/** Sections larger than the soft cap — used for advisory UI warnings. */
export function findOversizedSections(
  body: string,
  cap = SECTION_SOFT_CAP_CHARS
): Array<{ heading: string; chars: number }> {
  const outline = extractOutline(body);
  if (outline.length === 0) {
    if (body.length > cap) {
      return [{ heading: "(entire document)", chars: body.length }];
    }
    return [];
  }
  return outline
    .map((o) => {
      const start = o.charStart ?? 0;
      const end = o.charEnd ?? body.length;
      return { heading: o.heading, chars: Math.max(0, end - start) };
    })
    .filter((s) => s.chars > cap);
}

/**
 * Denormalize summary/outline/tokenEstimate for AI registry retrieval.
 * Call on every FAQ / KB / knowledgeDoc save (UI or confirmed proposal).
 */
export function normalizeMarkdownKnowledgeFields(
  body: string,
  existingSummary?: string,
  titleFallback = "Untitled"
) {
  const outline = extractOutline(body);
  const summary =
    existingSummary?.trim() ||
    extractSummary(body, 200) ||
    titleFallback;
  return {
    outline,
    summary: summary.slice(0, 240),
    contentHash: contentHash(body),
    tokenEstimate: estimateTokens(body),
  };
}

/** @deprecated Prefer normalizeMarkdownKnowledgeFields */
export function normalizeKnowledgeDocFields(body: string, existingSummary?: string) {
  const { outline, summary, contentHash: hash } = normalizeMarkdownKnowledgeFields(
    body,
    existingSummary
  );
  return { outline, summary, contentHash: hash };
}
