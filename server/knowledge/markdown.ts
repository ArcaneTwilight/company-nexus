import type { KnowledgeOutlineHeading } from "../types";

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/gm;
const FULL_DOC_CAP = 6000;
const SUMMARY_CAP = 400;
const SECTION_CAP = 3500;

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Simple stable hash for content versioning (not cryptographic). */
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
  const matches = [...markdown.matchAll(HEADING_RE)];
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

/** First meaningful paragraph or truncated body for registry summary. */
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

export function extractSection(
  markdown: string,
  headingOrAnchor: string
): { heading: string; body: string; truncated: boolean } | null {
  const outline = extractOutline(markdown);
  if (outline.length === 0) return null;

  const needle = headingOrAnchor.trim().toLowerCase();
  const hit =
    outline.find(
      (o) =>
        o.heading.toLowerCase() === needle ||
        o.anchor === needle ||
        o.heading.toLowerCase().includes(needle) ||
        o.anchor.includes(slugifyHeading(needle))
    ) ?? null;

  if (!hit || hit.charStart === undefined || hit.charEnd === undefined) return null;

  let body = markdown.slice(hit.charStart, hit.charEnd).trim();
  let truncated = false;
  if (body.length > SECTION_CAP) {
    body = body.slice(0, SECTION_CAP) + "\n\n…[section truncated]";
    truncated = true;
  }
  return { heading: hit.heading, body, truncated };
}

export function truncateMarkdown(markdown: string, cap = FULL_DOC_CAP): {
  body: string;
  truncated: boolean;
} {
  if (markdown.length <= cap) return { body: markdown, truncated: false };
  return {
    body: markdown.slice(0, cap) + "\n\n…[document truncated — use get_knowledge_section for a specific heading]",
    truncated: true,
  };
}

export function extendedSummary(
  markdown: string,
  outline: KnowledgeOutlineHeading[],
  maxChars = SUMMARY_CAP
): string {
  const base = extractSummary(markdown, Math.min(240, maxChars));
  const headings = outline
    .slice(0, 8)
    .map((o) => o.heading)
    .join("; ");
  const parts = [base];
  if (headings) parts.push(`Outline: ${headings}`);
  const joined = parts.filter(Boolean).join("\n");
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, maxChars - 1).trimEnd()}…`;
}

export { FULL_DOC_CAP, SUMMARY_CAP, SECTION_CAP };
