/**
 * Pure builders for knowledge registry entries.
 * Source of truth remains faqs / kbArticles / knowledgeDocs / calendar — entries are derived.
 */

import type {
  KnowledgeDomain,
  KnowledgeOutlineHeading,
  KnowledgeRegistryEntry,
  KnowledgeSourceCollection,
} from "../types";
import {
  contentHash,
  estimateTokens,
  extractOutline,
  extractSummary,
} from "./markdown";

type DocMap = Record<string, unknown> & { id: string };

export function registryId(collection: KnowledgeSourceCollection, sourceId: string): string {
  return `${collection}:${sourceId}`;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

function asOutline(v: unknown): KnowledgeOutlineHeading[] | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  const out: KnowledgeOutlineHeading[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const heading = String(row.heading ?? "").trim();
    if (!heading) continue;
    out.push({
      heading,
      anchor: String(row.anchor ?? "").trim() || heading.toLowerCase().replace(/\s+/g, "-"),
      charStart: typeof row.charStart === "number" ? row.charStart : undefined,
      charEnd: typeof row.charEnd === "number" ? row.charEnd : undefined,
    });
  }
  return out.length > 0 ? out : null;
}

/** Infer KB domain from category/tags when the doc has no explicit domain. */
export function inferKbDomain(doc: DocMap): KnowledgeDomain {
  const blob = [doc.category, ...asStringArray(doc.tags)].join(" ").toLowerCase();
  if (/\b(support|faq|ops|operations|customer)\b/.test(blob)) return "support";
  if (/\b(team|directory|onboarding|hr)\b/.test(blob)) return "team";
  if (/\b(report|reports|deadline)\b/.test(blob)) return "reports";
  return "developer";
}

export function parseKnowledgeDomain(raw: unknown, fallback: KnowledgeDomain): KnowledgeDomain {
  const v = String(raw ?? "").trim().toLowerCase();
  const allowed: KnowledgeDomain[] = [
    "support",
    "developer",
    "clients",
    "team",
    "reports",
    "general",
  ];
  return (allowed.includes(v as KnowledgeDomain) ? v : fallback) as KnowledgeDomain;
}

/**
 * Build a registry entry from a Markdown-backed document.
 * Prefers denormalized summary/outline on the doc to avoid re-parsing bodies.
 */
export function entryFromMarkdownDoc(opts: {
  collection: KnowledgeSourceCollection;
  doc: DocMap;
  domain: KnowledgeDomain;
  titleField?: string;
}): KnowledgeRegistryEntry {
  const { collection, doc, domain } = opts;
  const title = String(doc[opts.titleField ?? "title"] ?? doc.id);
  const body = String(doc.body ?? "");
  const tags = asStringArray(doc.tags);

  const storedOutline = asOutline(doc.outline);
  const outline = storedOutline ?? extractOutline(body);

  const storedSummary =
    typeof doc.summary === "string" && doc.summary.trim() ? String(doc.summary).trim() : "";
  const summary = (storedSummary || extractSummary(body, 200) || title).slice(0, 200);

  const hash =
    typeof doc.contentHash === "string" && doc.contentHash
      ? String(doc.contentHash)
      : contentHash(body);
  const version = typeof doc.contentVersion === "number" ? doc.contentVersion : 1;

  return {
    id: registryId(collection, doc.id),
    sourceCollection: collection,
    sourceId: doc.id,
    title,
    domain,
    tags,
    summary,
    outline: outline.map((o) => ({
      heading: o.heading,
      anchor: o.anchor,
      charStart: o.charStart,
      charEnd: o.charEnd,
    })),
    tokenEstimate:
      typeof doc.tokenEstimate === "number" ? doc.tokenEstimate : estimateTokens(body),
    contentHash: hash,
    contentVersion: version,
    updatedAt: String(doc.lastUpdated ?? new Date().toISOString()),
    isArchived: Boolean(doc.isArchived),
  };
}

export function entryFromReportEvent(doc: DocMap): KnowledgeRegistryEntry {
  const title = String(doc.title ?? doc.id);
  const body = [
    `Type: ${doc.type}`,
    `Date: ${doc.date}`,
    `Owner: ${doc.owner}`,
    String(doc.description ?? ""),
  ].join("\n");

  return {
    id: registryId("calendarEvents", doc.id),
    sourceCollection: "calendarEvents",
    sourceId: doc.id,
    title,
    domain: "reports",
    tags: ["report", "calendar", String(doc.owner ?? "")].filter(Boolean),
    summary: extractSummary(body, 200) || title,
    outline: extractOutline(body),
    tokenEstimate: estimateTokens(body),
    contentHash: contentHash(body),
    contentVersion: 1,
    updatedAt: String(doc.date ?? ""),
    isArchived: false,
  };
}

/** Pointer cards for structured sources — never load full lists into the model. */
export function virtualEntries(): KnowledgeRegistryEntry[] {
  const now = new Date().toISOString();
  return [
    {
      id: registryId("virtual", "company-master-list"),
      sourceCollection: "virtual",
      sourceId: "company-master-list",
      title: "Company Master List",
      domain: "clients",
      tags: ["clients", "company", "apps", "companies"],
      summary:
        "Structured company registry. Use search_company_apps / get_company_app — do not load full list.",
      outline: [
        { heading: "Search by company", anchor: "search-by-company" },
        { heading: "Status and POC fields", anchor: "status-and-poc" },
      ],
      tokenEstimate: 50,
      contentHash: "virtual-company",
      contentVersion: 1,
      updatedAt: now,
      isArchived: false,
    },
    {
      id: registryId("virtual", "team-directory"),
      sourceCollection: "virtual",
      sourceId: "team-directory",
      title: "Team Directory",
      domain: "team",
      tags: ["team", "directory", "contacts", "timezone", "partner-teams"],
      summary:
        "Member contacts/timezones (find_team_member) and partner teams with ownership notes (find_contact_team).",
      outline: [
        { heading: "Find member", anchor: "find-member" },
        { heading: "Find partner team by ownership", anchor: "find-contact-team" },
      ],
      tokenEstimate: 50,
      contentHash: "virtual-team",
      contentVersion: 2,
      updatedAt: now,
      isArchived: false,
    },
    {
      id: registryId("virtual", "calendar-reports"),
      sourceCollection: "virtual",
      sourceId: "calendar-reports",
      title: "Team Calendar & Report Deadlines",
      domain: "reports",
      tags: ["calendar", "reports", "deadlines", "uploads"],
      summary:
        "Calendar events including Report/Upload types. Use list_calendar_events / get_upcoming_deadlines.",
      outline: [
        { heading: "Upcoming deadlines", anchor: "upcoming" },
        { heading: "Filter by owner", anchor: "by-owner" },
      ],
      tokenEstimate: 40,
      contentHash: "virtual-calendar",
      contentVersion: 1,
      updatedAt: now,
      isArchived: false,
    },
  ];
}
