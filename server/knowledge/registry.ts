/**
 * Live knowledge registry + layered retrieval tools.
 * Prefers denormalized summary/outline on source docs; loads full bodies only for section/doc.
 */

import { listCollection, getDocById } from "../data/store";
import type {
  KnowledgeDomain,
  KnowledgeRegistryEntry,
  ResolvedKnowledgeMode,
  ToolContext,
} from "../types";
import { extendedSummary, extractSection, truncateMarkdown } from "./markdown";
import {
  entryFromMarkdownDoc,
  entryFromReportEvent,
  inferKbDomain,
  parseKnowledgeDomain,
  virtualEntries,
} from "./registryBuilder";
import type { KnowledgeDocPayload, KnowledgeSectionSlice } from "./types";

const REGISTRY_CACHE = new WeakMap<ToolContext, KnowledgeRegistryEntry[]>();

/** Per-mode caps keep AIRA tool payloads small when a domain is selected. */
const MODE_RESULT_CAPS: Record<ResolvedKnowledgeMode, number> = {
  support: 8,
  developer: 8,
  clients: 6,
  team: 6,
  reports: 8,
  general: 12,
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

/** Lightweight BM25-ish score over title/summary/tags/outline. */
export function scoreRegistryEntry(entry: KnowledgeRegistryEntry, query: string): number {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return 0.01;

  const titleTokens = tokenize(entry.title);
  const summaryTokens = tokenize(entry.summary);
  const tagTokens = entry.tags.flatMap((t) => tokenize(t));
  const outlineTokens = entry.outline.flatMap((o) => tokenize(o.heading));

  const avgDl = 40;
  const k1 = 1.2;
  const b = 0.75;
  const dl =
    titleTokens.length + summaryTokens.length + tagTokens.length + outlineTokens.length || 1;

  let score = 0;
  for (const qt of qTokens) {
    const tf =
      3 * titleTokens.filter((t) => t === qt || t.includes(qt)).length +
      2 * tagTokens.filter((t) => t === qt || t.includes(qt)).length +
      1.5 * outlineTokens.filter((t) => t === qt || t.includes(qt)).length +
      summaryTokens.filter((t) => t === qt || t.includes(qt)).length;

    if (tf <= 0) continue;
    const idf = 1.5;
    score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * dl) / avgDl)));
  }

  const hay = `${entry.title} ${entry.summary} ${entry.tags.join(" ")}`.toLowerCase();
  const q = query.trim().toLowerCase();
  if (q && hay.includes(q)) score += 2;

  return score;
}

export async function buildLiveRegistry(ctx: ToolContext): Promise<KnowledgeRegistryEntry[]> {
  const cached = REGISTRY_CACHE.get(ctx);
  if (cached) return cached;

  const [faqs, kbArticles, knowledgeDocs, calendarEvents] = await Promise.all([
    listCollection(ctx, "faqs"),
    listCollection(ctx, "kbArticles"),
    listCollection(ctx, "knowledgeDocs"),
    listCollection(ctx, "calendarEvents"),
  ]);

  const entries: KnowledgeRegistryEntry[] = [
    ...faqs
      .filter((d) => !d.isArchived)
      .map((doc) =>
        entryFromMarkdownDoc({ collection: "faqs", doc, domain: "support" })
      ),
    ...kbArticles
      .filter((d) => !d.isArchived)
      .map((doc) =>
        entryFromMarkdownDoc({
          collection: "kbArticles",
          doc,
          domain: inferKbDomain(doc),
        })
      ),
    ...knowledgeDocs
      .filter((d) => !d.isArchived)
      .map((doc) =>
        entryFromMarkdownDoc({
          collection: "knowledgeDocs",
          doc,
          domain: parseKnowledgeDomain(doc.domain, "reports"),
        })
      ),
    ...calendarEvents
      .filter((d) => String(d.type) === "Report")
      .map((doc) => entryFromReportEvent(doc)),
    ...virtualEntries(),
  ];

  REGISTRY_CACHE.set(ctx, entries);
  return entries;
}

function filterByDomains(
  entries: KnowledgeRegistryEntry[],
  allowed: KnowledgeDomain[]
): KnowledgeRegistryEntry[] {
  if (allowed.includes("general") || allowed.length >= 5) return entries;
  const set = new Set(allowed);
  set.add("general");
  return entries.filter((e) => set.has(e.domain));
}

function resultCapForContext(ctx: ToolContext, requested?: number): number {
  const modeCap = MODE_RESULT_CAPS[ctx.knowledgeMode] ?? 12;
  if (typeof requested === "number" && requested > 0) {
    return Math.min(requested, modeCap);
  }
  return modeCap;
}

export async function searchKnowledgeRegistry(
  ctx: ToolContext,
  query: string,
  limit?: number,
  options?: { widenOnMiss?: boolean }
): Promise<{
  count: number;
  knowledgeMode: string;
  domains: KnowledgeDomain[];
  widened: boolean;
  results: Array<
    Pick<
      KnowledgeRegistryEntry,
      | "id"
      | "title"
      | "domain"
      | "tags"
      | "summary"
      | "sourceCollection"
      | "sourceId"
      | "tokenEstimate"
      | "updatedAt"
    > & { score: number; outlineHeadings: string[] }
  >;
}> {
  const cap = resultCapForContext(ctx, limit);
  const all = await buildLiveRegistry(ctx);
  let domainFiltered = filterByDomains(all, ctx.allowedDomains);
  let widened = false;

  const rank = (list: KnowledgeRegistryEntry[]) =>
    list
      .map((e) => ({ e, score: scoreRegistryEntry(e, query) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

  let ranked = rank(domainFiltered);

  if (ranked.length === 0 && options?.widenOnMiss !== false) {
    domainFiltered = all;
    ranked = rank(domainFiltered);
    widened = true;
  }

  if (ranked.length === 0) {
    ranked = domainFiltered.slice(0, cap).map((e) => ({ e, score: 0.01 }));
  }

  const results = ranked.slice(0, cap).map(({ e, score }) => ({
    id: e.id,
    title: e.title,
    domain: e.domain,
    tags: e.tags,
    summary: e.summary,
    sourceCollection: e.sourceCollection,
    sourceId: e.sourceId,
    tokenEstimate: e.tokenEstimate,
    updatedAt: e.updatedAt,
    score: Math.round(score * 100) / 100,
    outlineHeadings: e.outline.slice(0, 8).map((o) => o.heading),
  }));

  return {
    count: results.length,
    knowledgeMode: ctx.knowledgeMode,
    domains: ctx.allowedDomains,
    widened,
    results,
  };
}

async function loadSourceBody(
  ctx: ToolContext,
  entry: KnowledgeRegistryEntry
): Promise<{ body: string; hint?: string } | null> {
  if (entry.sourceCollection === "virtual") {
    return {
      body: entry.summary,
      hint:
        entry.sourceId === "company-master-list"
          ? "Use search_company_apps or get_company_app for structured company data."
          : entry.sourceId === "team-directory"
            ? "Use find_team_member for people, or find_contact_team for partner teams and ownership notes."
            : "Use list_calendar_events or get_upcoming_deadlines for calendar/report deadlines.",
    };
  }

  if (
    entry.sourceCollection === "faqs" ||
    entry.sourceCollection === "kbArticles" ||
    entry.sourceCollection === "knowledgeDocs" ||
    entry.sourceCollection === "calendarEvents"
  ) {
    const doc = await getDocById(ctx, entry.sourceCollection, entry.sourceId);
    if (!doc) return null;

    if (entry.sourceCollection === "calendarEvents") {
      return {
        body: [
          `# ${doc.title}`,
          `Date: ${doc.date}`,
          `Type: ${doc.type}`,
          `Owner: ${doc.owner}`,
          "",
          String(doc.description ?? ""),
        ].join("\n"),
      };
    }

    return { body: String(doc.body ?? "") };
  }

  return null;
}

/**
 * Cheap summary path: use registry card metadata when possible — do not load full bodies.
 */
export async function getKnowledgeSummary(
  ctx: ToolContext,
  registryIdStr: string
): Promise<Record<string, unknown>> {
  const all = await buildLiveRegistry(ctx);
  const entry = all.find((e) => e.id === registryIdStr);
  if (!entry) return { error: "Registry entry not found", id: registryIdStr };

  if (entry.sourceCollection === "virtual") {
    return {
      id: entry.id,
      title: entry.title,
      domain: entry.domain,
      sourceCollection: entry.sourceCollection,
      sourceId: entry.sourceId,
      summary: entry.summary,
      outline: entry.outline.map((o) => ({ heading: o.heading, anchor: o.anchor })),
      tags: entry.tags,
      tokenEstimate: entry.tokenEstimate,
      hint:
        entry.sourceId === "company-master-list"
          ? "Use search_company_apps or get_company_app for structured company data."
          : entry.sourceId === "team-directory"
            ? "Use find_team_member for people, or find_contact_team for partner teams and ownership notes."
            : "Use list_calendar_events or get_upcoming_deadlines for calendar/report deadlines.",
      nextStep: "Use the specialized structured tool named in the hint — do not load a full document.",
    };
  }

  const summary = extendedSummary(entry.summary, entry.outline);

  return {
    id: entry.id,
    title: entry.title,
    domain: entry.domain,
    sourceCollection: entry.sourceCollection,
    sourceId: entry.sourceId,
    summary,
    outline: entry.outline.map((o) => ({ heading: o.heading, anchor: o.anchor })),
    tags: entry.tags,
    tokenEstimate: entry.tokenEstimate,
    nextStep: entry.outline.length
      ? "If you need detail, call get_knowledge_section with a heading/anchor."
      : "If you need detail, call get_knowledge_doc (prefer section when possible).",
  };
}

export async function getKnowledgeSection(
  ctx: ToolContext,
  registryIdStr: string,
  heading: string
): Promise<KnowledgeSectionSlice | { error: string }> {
  const all = await buildLiveRegistry(ctx);
  const entry = all.find((e) => e.id === registryIdStr);
  if (!entry) return { error: "Registry entry not found" };

  const loaded = await loadSourceBody(ctx, entry);
  if (!loaded) return { error: "Source document not found" };
  if (loaded.hint && entry.sourceCollection === "virtual") {
    return {
      registryId: entry.id,
      title: entry.title,
      heading: "Structured source",
      body: `${loaded.body}\n\n${loaded.hint}`,
      truncated: false,
    };
  }

  const section = extractSection(loaded.body, heading);
  if (!section) {
    return {
      error: `Heading not found. Available: ${
        entry.outline.map((o) => o.heading).join(" | ") ||
        "(no headings — use get_knowledge_doc)"
      }`,
    };
  }

  return {
    registryId: entry.id,
    title: entry.title,
    heading: section.heading,
    body: section.body,
    truncated: section.truncated,
  };
}

export async function getKnowledgeDoc(
  ctx: ToolContext,
  registryIdStr: string
): Promise<KnowledgeDocPayload | { error: string }> {
  const all = await buildLiveRegistry(ctx);
  const entry = all.find((e) => e.id === registryIdStr);
  if (!entry) return { error: "Registry entry not found" };

  const loaded = await loadSourceBody(ctx, entry);
  if (!loaded) return { error: "Source document not found" };

  const { body, truncated } = truncateMarkdown(loaded.body);

  return {
    registryId: entry.id,
    title: entry.title,
    domain: entry.domain,
    sourceCollection: entry.sourceCollection,
    sourceId: entry.sourceId,
    body,
    truncated,
    outline: entry.outline.map((o) => ({ heading: o.heading, anchor: o.anchor })),
    hint: loaded.hint,
  };
}

export { MODE_RESULT_CAPS };
