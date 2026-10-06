/**
 * Firestore access for the agent tool layer.
 * Uses Firestore REST with the caller's ID token when available,
 * otherwise falls back to bundled seed data (local/dev).
 */

import {
  INITIAL_FAQS,
  INITIAL_KB_ARTICLES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_TEAM_DIRECTORY,
  INITIAL_CONTACT_TEAMS,
} from "../../src/data";
import { COMPANY_MASTER_APPS } from "../../src/data/companyMasterApps";
import { enrichMarkdownDocument, isMarkdownKnowledgeCollection } from "../knowledge/enrichDocument";
import type { AgentProposal, KnowledgeChunk, ProposalCollection, ToolContext } from "../types";

const COLLECTION_PATHS: Record<string, string> = {
  faqs: "faqs",
  kbArticles: "kbArticles",
  companyApps: "companyApps",
  calendarEvents: "calendarEvents",
  teamMembers: "teamMembers",
  contactTeams: "contactTeams",
  knowledgeDocs: "knowledgeDocs",
  knowledgeChunks: "knowledgeChunks",
  agentProposals: "agentProposals",
  agentAudits: "agentAudits",
};

type DocMap = Record<string, unknown> & { id: string };

const seedCache: Record<string, DocMap[]> = {
  faqs: INITIAL_FAQS.map((d) => ({ ...d })),
  kbArticles: INITIAL_KB_ARTICLES.map((d) => ({ ...d })),
  companyApps: COMPANY_MASTER_APPS.map((d) => ({ ...d })),
  calendarEvents: INITIAL_CALENDAR_EVENTS.map((d) => ({ ...d })),
  teamMembers: INITIAL_TEAM_DIRECTORY.map((d) => ({ ...d })),
  contactTeams: INITIAL_CONTACT_TEAMS.map((d) => ({ ...d })),
  knowledgeDocs: [],
};

/** In-memory proposals when Firestore is unavailable. */
const memoryProposals = new Map<string, AgentProposal>();

function firestoreBase(projectId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function fromFirestoreValue(value: Record<string, unknown>): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: Record<string, unknown>[] })?.values ?? [];
    return values.map((v) => fromFirestoreValue(v));
  }
  if ("mapValue" in value) {
    const fields = (value.mapValue as { fields?: Record<string, Record<string, unknown>> })?.fields ?? {};
    return fromFirestoreFields(fields);
  }
  return null;
}

function fromFirestoreFields(fields: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => toFirestoreValue(v)) } };
  }
  if (typeof value === "object") {
    return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(obj: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const fields: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "id") continue;
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function parseDocument(name: string, fields?: Record<string, Record<string, unknown>>): DocMap {
  const id = name.split("/").pop() || name;
  return { id, ...(fields ? fromFirestoreFields(fields) : {}) };
}

export async function listCollection(ctx: ToolContext, collection: string): Promise<DocMap[]> {
  if (!ctx.useFirestore || !ctx.projectId || !ctx.idToken) {
    return (seedCache[collection] ?? []).map((d) => ({ ...d }));
  }

  const path = COLLECTION_PATHS[collection];
  if (!path) return [];

  const docs: DocMap[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${firestoreBase(ctx.projectId)}/${path}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${ctx.idToken}` },
    });

    if (!res.ok) {
      console.warn(`[firestore] list ${collection} failed:`, await res.text());
      return (seedCache[collection] ?? []).map((d) => ({ ...d }));
    }

    const data = (await res.json()) as {
      documents?: Array<{ name: string; fields?: Record<string, Record<string, unknown>> }>;
      nextPageToken?: string;
    };

    for (const doc of data.documents ?? []) {
      docs.push(parseDocument(doc.name, doc.fields));
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return docs;
}

export async function listKnowledgeChunks(ctx: ToolContext): Promise<KnowledgeChunk[]> {
  const documents = await listCollection(ctx, "knowledgeChunks");
  return documents.filter((document) => {
    return (
      typeof document.sourceCollection === "string" &&
      typeof document.sourceDocId === "string" &&
      typeof document.chunkIndex === "number" &&
      typeof document.chunkText === "string" &&
      typeof document.title === "string" &&
      Array.isArray(document.embedding) &&
      document.embedding.every((value) => typeof value === "number")
    );
  }) as unknown as KnowledgeChunk[];
}

async function getDocument(
  ctx: ToolContext,
  collection: string,
  id: string
): Promise<DocMap | null> {
  if (!ctx.useFirestore || !ctx.projectId || !ctx.idToken) {
    return (seedCache[collection] ?? []).find((d) => d.id === id) ?? null;
  }

  const path = COLLECTION_PATHS[collection];
  const res = await fetch(`${firestoreBase(ctx.projectId)}/${path}/${id}`, {
    headers: { Authorization: `Bearer ${ctx.idToken}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    console.warn(`[firestore] get ${collection}/${id} failed:`, await res.text());
    return (seedCache[collection] ?? []).find((d) => d.id === id) ?? null;
  }

  const data = (await res.json()) as {
    name: string;
    fields?: Record<string, Record<string, unknown>>;
  };
  return parseDocument(data.name, data.fields);
}

async function setDocument(
  ctx: ToolContext,
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<boolean> {
  if (!ctx.useFirestore || !ctx.projectId || !ctx.idToken) {
    const list = seedCache[collection] ?? (seedCache[collection] = []);
    const idx = list.findIndex((d) => d.id === id);
    const next = { ...data, id } as DocMap;
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    if (collection === "agentProposals") {
      memoryProposals.set(id, next as unknown as AgentProposal);
    }
    return true;
  }

  const path = COLLECTION_PATHS[collection];
  const res = await fetch(`${firestoreBase(ctx.projectId)}/${path}/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${ctx.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields({ ...data, id }) }),
  });

  if (!res.ok) {
    console.warn(`[firestore] set ${collection}/${id} failed:`, await res.text());
    return false;
  }
  return true;
}

async function deleteDocument(
  ctx: ToolContext,
  collection: string,
  id: string
): Promise<boolean> {
  if (!ctx.useFirestore || !ctx.projectId || !ctx.idToken) {
    const list = seedCache[collection];
    if (list) {
      seedCache[collection] = list.filter((d) => d.id !== id);
    }
    memoryProposals.delete(id);
    return true;
  }

  const path = COLLECTION_PATHS[collection];
  const res = await fetch(`${firestoreBase(ctx.projectId)}/${path}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${ctx.idToken}` },
  });

  return res.ok || res.status === 404;
}

export function matchesQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const h = haystack.toLowerCase();
  return tokens.every((t) => h.includes(t));
}

/** Simple token overlap score for ranking search hits. */
function scoreDocText(text: string, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0.01;
  const tokens = q.split(/\s+/).filter(Boolean);
  const h = text.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (!h.includes(t)) return 0;
    const titleBoost = h.indexOf(t) < 120 ? 1.5 : 1;
    score += titleBoost;
  }
  if (h.includes(q)) score += 2;
  return score;
}

export async function searchDocs(
  ctx: ToolContext,
  collection: "faqs" | "kbArticles",
  query: string,
  limit = 8
): Promise<DocMap[]> {
  const docs = await listCollection(ctx, collection);
  const scored = docs
    .filter((d) => !d.isArchived)
    .map((d) => {
      const text = [d.title, d.category, d.body, ...(Array.isArray(d.tags) ? d.tags : [])]
        .filter(Boolean)
        .join(" ");
      const score = scoreDocText(text, query);
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => ({
      id: x.d.id,
      title: x.d.title,
      category: x.d.category,
      tags: x.d.tags,
      body: String(x.d.body ?? "").slice(0, 1200),
      lastUpdated: x.d.lastUpdated,
      score: Math.round(x.score * 100) / 100,
    }));

  return scored as DocMap[];
}

export async function getDocById(
  ctx: ToolContext,
  collection:
    | "faqs"
    | "kbArticles"
    | "companyApps"
    | "calendarEvents"
    | "teamMembers"
    | "contactTeams"
    | "knowledgeDocs",
  id: string
): Promise<DocMap | null> {
  return getDocument(ctx, collection, id);
}

export async function searchcompanyApps(
  ctx: ToolContext,
  query: string,
  limit = 10
): Promise<DocMap[]> {
  const docs = await listCollection(ctx, "companyApps");
  return docs
    .filter((d) => {
      const text = [
        d.companyName,
        d.statusLabel,
        d.country,
        d.market,
        d.comments,
        d.liveVersion,
        ...(Array.isArray(d.pssPoc) ? d.pssPoc : []),
        ...(Array.isArray(d.devPoc) ? d.devPoc : []),
      ]
        .filter(Boolean)
        .join(" ");
      return matchesQuery(text, query);
    })
    .slice(0, limit)
    .map((d) => ({
      id: d.id,
      companyName: d.companyName,
      statusKey: d.statusKey,
      statusLabel: d.statusLabel,
      liveVersion: d.liveVersion,
      country: d.country,
      market: d.market,
      comments: d.comments,
      hasChanges: d.hasChanges,
      pssPoc: d.pssPoc,
      devPoc: d.devPoc,
      lastUpdated: d.lastUpdated,
    })) as DocMap[];
}

export async function listCalendarEvents(
  ctx: ToolContext,
  opts: { from?: string; to?: string; owner?: string; limit?: number } = {}
): Promise<DocMap[]> {
  const docs = await listCollection(ctx, "calendarEvents");
  let filtered = docs;
  if (opts.from) filtered = filtered.filter((d) => String(d.date) >= opts.from!);
  if (opts.to) filtered = filtered.filter((d) => String(d.date) <= opts.to!);
  if (opts.owner) {
    const o = opts.owner.toLowerCase();
    filtered = filtered.filter((d) => String(d.owner ?? "").toLowerCase().includes(o));
  }
  filtered = [...filtered].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return filtered.slice(0, opts.limit ?? 20);
}

export async function findTeamMembers(
  ctx: ToolContext,
  query: string,
  limit = 10
): Promise<DocMap[]> {
  const docs = await listCollection(ctx, "teamMembers");
  return docs
    .filter((d) => {
      const text = [d.name, d.role, d.timezone, d.timezoneId, d.email, d.contactNotes]
        .filter(Boolean)
        .join(" ");
      return matchesQuery(text, query);
    })
    .slice(0, limit);
}

export async function findContactTeams(
  ctx: ToolContext,
  query: string,
  limit = 10
): Promise<DocMap[]> {
  const docs = await listCollection(ctx, "contactTeams");
  return docs
    .filter((d) => {
      const text = [d.name, d.category, d.email, d.groupChat, d.notes]
        .filter(Boolean)
        .join(" ");
      return matchesQuery(text, query);
    })
    .slice(0, limit);
}

export async function saveProposal(
  ctx: ToolContext,
  proposal: AgentProposal
): Promise<AgentProposal> {
  memoryProposals.set(proposal.id, proposal);
  await setDocument(ctx, "agentProposals", proposal.id, proposal as unknown as Record<string, unknown>);
  ctx.proposals.push(proposal);
  return proposal;
}

export async function loadProposal(
  ctx: ToolContext,
  proposalId: string
): Promise<AgentProposal | null> {
  const mem = memoryProposals.get(proposalId);
  if (mem) return mem;
  const doc = await getDocument(ctx, "agentProposals", proposalId);
  return doc as unknown as AgentProposal | null;
}

export async function updateProposal(
  ctx: ToolContext,
  proposal: AgentProposal
): Promise<void> {
  memoryProposals.set(proposal.id, proposal);
  await setDocument(ctx, "agentProposals", proposal.id, proposal as unknown as Record<string, unknown>);
}

export async function writeAudit(
  ctx: ToolContext,
  audit: Record<string, unknown>
): Promise<void> {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await setDocument(ctx, "agentAudits", id, { ...audit, id });
}

export async function applyProposalWrite(
  ctx: ToolContext,
  proposal: AgentProposal
): Promise<{ appliedServerSide: boolean }> {
  const collection = proposal.collection as ProposalCollection;

  if (proposal.action === "delete") {
    const ok = await deleteDocument(ctx, collection, proposal.documentId);
    return { appliedServerSide: ok };
  }

  if (!proposal.after) {
    return { appliedServerSide: false };
  }

  const document = isMarkdownKnowledgeCollection(collection)
    ? enrichMarkdownDocument({ ...proposal.after, id: proposal.documentId })
    : { ...proposal.after, id: proposal.documentId };

  const ok = await setDocument(ctx, collection, proposal.documentId, document);
  return { appliedServerSide: ok };
}

