import type { AgentMode, NexusToolDefinition } from "../types";
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import {
  findContactTeams,
  findTeamMembers,
  getDocById,
  listCalendarEvents,
  saveProposal,
  searchDocs,
  searchcompanyApps,
} from "../data/store";
import {
  getKnowledgeDoc,
  getKnowledgeSection,
  getKnowledgeSummary,
  searchKnowledgeRegistry,
} from "../knowledge/registry";
import { enrichMarkdownDocument } from "../knowledge/enrichDocument";
import type { AgentProposal, ProposalCollection } from "../types";
import { consumeRetrievalBudget } from "../agent/retrievalBudget";
import { RETRIEVAL_BUDGET_LIMITS } from "../agent/config";

export const WRITABLE_COLLECTIONS: ProposalCollection[] = [
  "faqs",
  "kbArticles",
  "companyApps",
  "calendarEvents",
  "teamMembers",
  "contactTeams",
  "knowledgeDocs",
];

function str(args: Record<string, unknown>, key: string, fallback = ""): string {
  const v = args[key];
  return typeof v === "string" ? v : fallback;
}

function num(args: Record<string, unknown>, key: string, fallback: number): number {
  const v = args[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Layered retrieval — prefer these over dumping full FAQ/KB bodies. */
const knowledgeLayerTools: NexusToolDefinition[] = [
  {
    name: "search_knowledge_registry",
    description:
      "PRIMARY search. Returns ranked registry cards (id, title, domain, short summary, outline headings) — not full documents. Call this first. Result count is capped by knowledge mode. Budget: limited registry searches per turn.",
    modes: ["kb", "hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: {
          type: "number",
          description: "Max results (further capped by knowledge mode, e.g. 6–12)",
        },
      },
      required: ["query"],
    },
    handler: async (args, ctx) => {
      const limit = args.limit === undefined ? undefined : num(args, "limit", 12);
      return searchKnowledgeRegistry(ctx, str(args, "query"), limit);
    },
  },
  {
    name: "get_knowledge_summary",
    description:
      "Load an extended summary + outline for one registry entry from registry cards only (no full body). Prefer before get_knowledge_section / get_knowledge_doc.",
    modes: ["kb", "hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: 'Registry id from search results (e.g. "faqs:abc" or "kbArticles:xyz")',
        },
      },
      required: ["id"],
    },
    handler: async (args, ctx) => getKnowledgeSummary(ctx, str(args, "id")),
  },
  {
    name: "get_knowledge_section",
    description:
      "Load one Markdown section by heading/anchor from a registry entry. Prefer over get_knowledge_doc.",
    modes: ["kb", "hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Registry id" },
        heading: {
          type: "string",
          description: "Heading text or anchor from the outline",
        },
      },
      required: ["id", "heading"],
    },
    handler: async (args, ctx) =>
      getKnowledgeSection(ctx, str(args, "id"), str(args, "heading")),
  },
  {
    name: "get_knowledge_doc",
    description:
      `Load a full Markdown document (capped). Use sparingly — prefer summary/section first. Budget: max ${RETRIEVAL_BUDGET_LIMITS.fullDocs} full doc load(s) per turn. For virtual/structured sources, returns a hint to use specialized tools.`,
    modes: ["kb", "hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Registry id" },
      },
      required: ["id"],
    },
    handler: async (args, ctx) => getKnowledgeDoc(ctx, str(args, "id")),
  },
];

const readKbTools: NexusToolDefinition[] = [
  {
    name: "search_kb",
    description:
      "Legacy KB keyword search with truncated bodies. Prefer search_knowledge_registry for token efficiency.",
    modes: ["kb", "hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: { type: "number", description: "Max results (default 8)" },
      },
      required: ["query"],
    },
    handler: async (args, ctx) => {
      const results = await searchDocs(ctx, "kbArticles", str(args, "query"), num(args, "limit", 8));
      return { count: results.length, results };
    },
  },
  {
    name: "search_faqs",
    description:
      "Legacy FAQ keyword search with truncated bodies. Prefer search_knowledge_registry for token efficiency.",
    modes: ["kb", "hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: { type: "number", description: "Max results (default 8)" },
      },
      required: ["query"],
    },
    handler: async (args, ctx) => {
      const results = await searchDocs(ctx, "faqs", str(args, "query"), num(args, "limit", 8));
      return { count: results.length, results };
    },
  },
  {
    name: "get_doc_by_id",
    description: "Fetch a full FAQ, KB, or knowledge doc by collection + id.",
    modes: ["kb", "hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: 'One of "faqs", "kbArticles", or "knowledgeDocs"',
          enum: ["faqs", "kbArticles", "knowledgeDocs"],
        },
        id: { type: "string", description: "Document id" },
      },
      required: ["collection", "id"],
    },
    handler: async (args, ctx) => {
      const collection = str(args, "collection") as "faqs" | "kbArticles" | "knowledgeDocs";
      if (
        collection !== "faqs" &&
        collection !== "kbArticles" &&
        collection !== "knowledgeDocs"
      ) {
        return { error: 'collection must be "faqs", "kbArticles", or "knowledgeDocs"' };
      }
      const doc = await getDocById(ctx, collection, str(args, "id"));
      if (!doc) return { error: "Document not found" };
      const body = String(doc.body ?? "");
      return {
        ...doc,
        body: body.length > 6000 ? body.slice(0, 6000) + "\n\n…[truncated]" : body,
      };
    },
  },
];

const readHubTools: NexusToolDefinition[] = [
  {
    name: "search_company_apps",
    description:
      "Search the Company master list by company name, status, country, market, POC, or comments.",
    modes: ["hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
    handler: async (args, ctx) => {
      const results = await searchcompanyApps(ctx, str(args, "query"), num(args, "limit", 10));
      return { count: results.length, results };
    },
  },
  {
    name: "get_company_app",
    description: "Get a full Company master-list row by document id.",
    modes: ["hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Company document id" },
      },
      required: ["id"],
    },
    handler: async (args, ctx) => {
      const doc = await getDocById(ctx, "companyApps", str(args, "id"));
      return doc ?? { error: "Company not found" };
    },
  },
  {
    name: "list_calendar_events",
    description: "List team calendar events, optionally filtered by date range or owner.",
    modes: ["hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Start date YYYY-MM-DD inclusive" },
        to: { type: "string", description: "End date YYYY-MM-DD inclusive" },
        owner: { type: "string", description: "Filter by owner name substring" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
    },
    handler: async (args, ctx) => {
      const results = await listCalendarEvents(ctx, {
        from: str(args, "from") || undefined,
        to: str(args, "to") || undefined,
        owner: str(args, "owner") || undefined,
        limit: num(args, "limit", 20),
      });
      return { count: results.length, results };
    },
  },
  {
    name: "get_upcoming_deadlines",
    description: "List upcoming calendar events from today forward.",
    modes: ["hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (default 10)" },
      },
    },
    handler: async (args, ctx) => {
      const today = new Date().toISOString().slice(0, 10);
      const results = await listCalendarEvents(ctx, {
        from: today,
        limit: num(args, "limit", 10),
      });
      return { count: results.length, from: today, results };
    },
  },
  {
    name: "find_team_member",
    description: "Find Company team directory members by name, role, timezone, or email.",
    modes: ["hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
    handler: async (args, ctx) => {
      const results = await findTeamMembers(ctx, str(args, "query"), num(args, "limit", 10));
      return { count: results.length, results };
    },
  },
  {
    name: "find_contact_team",
    description:
      "Find partner / external teams by name, category, email, group chat, or ownership notes (e.g. who handles Company Announcements).",
    modes: ["hub", "write"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
    handler: async (args, ctx) => {
      const results = await findContactTeams(ctx, str(args, "query"), num(args, "limit", 10));
      return { count: results.length, results };
    },
  },
];

async function proposeChange(
  tool: string,
  collection: ProposalCollection,
  action: AgentProposal["action"],
  documentId: string,
  after: Record<string, unknown> | null,
  summary: string,
  ctx: Parameters<NexusToolDefinition["handler"]>[1]
): Promise<unknown> {
  let before: Record<string, unknown> | null = null;
  if (action !== "create") {
    const existing = await getDocById(ctx, collection, documentId);
    before = existing ? { ...existing } : null;
    if (action === "update" && !existing) {
      return { error: `Cannot update: ${collection}/${documentId} not found` };
    }
    if (action === "delete" && !existing) {
      return { error: `Cannot delete: ${collection}/${documentId} not found` };
    }
  }

  const proposal: AgentProposal = {
    id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tool,
    collection,
    action,
    documentId,
    before,
    after: action === "delete" ? null : after,
    summary,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: ctx.uid,
  };

  await saveProposal(ctx, proposal);

  return {
    status: "pending_confirmation",
    message:
      "A write proposal was created. The user must confirm in the UI before anything is saved. Do not claim the change was saved.",
    proposal: {
      id: proposal.id,
      collection: proposal.collection,
      action: proposal.action,
      documentId: proposal.documentId,
      summary: proposal.summary,
    },
  };
}

export async function proposeHubUpdate(
  collection: ProposalCollection,
  documentId: string | null,
  changes: Record<string, unknown>,
  ctx: Parameters<NexusToolDefinition["handler"]>[1]
): Promise<unknown> {
  const action = documentId ? "update" : "create";
  const id = documentId || `mcp-${collection}-${Date.now()}`;
  const summary = `Proposed ${action} to ${collection}/${id} from MCP`;
  return proposeChange("propose_hub_update", collection, action, id, changes, summary, ctx);
}

const writeTools: NexusToolDefinition[] = [
  {
    name: "propose_upsert_faq",
    description:
      "Propose creating or updating an FAQ. Does NOT save until the user confirms in the UI.",
    modes: ["write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Existing id to update, or omit to create" },
        title: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        body: { type: "string" },
        isArchived: { type: "boolean" },
        summary: { type: "string", description: "Short human-readable summary of the change" },
      },
      required: ["title", "category", "body", "summary"],
    },
    handler: async (args, ctx) => {
      const id = str(args, "id") || `faq-${Date.now()}`;
      const action = str(args, "id") ? "update" : "create";
      const after = enrichMarkdownDocument({
        id,
        title: str(args, "title"),
        category: str(args, "category"),
        tags: Array.isArray(args.tags) ? args.tags : [],
        body: str(args, "body"),
        isArchived: Boolean(args.isArchived),
        lastUpdated: new Date().toISOString().slice(0, 10),
        contentVersion: 1,
      });
      return proposeChange("propose_upsert_faq", "faqs", action, id, after, str(args, "summary"), ctx);
    },
  },
  {
    name: "propose_upsert_kb",
    description:
      "Propose creating or updating a KB article. Does NOT save until the user confirms in the UI.",
    modes: ["write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Existing id to update, or omit to create" },
        title: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        body: { type: "string" },
        isArchived: { type: "boolean" },
        summary: { type: "string", description: "Short human-readable summary of the change" },
      },
      required: ["title", "category", "body", "summary"],
    },
    handler: async (args, ctx) => {
      const id = str(args, "id") || `kb-${Date.now()}`;
      const action = str(args, "id") ? "update" : "create";
      const after = enrichMarkdownDocument({
        id,
        title: str(args, "title"),
        category: str(args, "category"),
        tags: Array.isArray(args.tags) ? args.tags : [],
        body: str(args, "body"),
        isArchived: Boolean(args.isArchived),
        lastUpdated: new Date().toISOString().slice(0, 10),
        contentVersion: 1,
      });
      return proposeChange("propose_upsert_kb", "kbArticles", action, id, after, str(args, "summary"), ctx);
    },
  },
  {
    name: "propose_upsert_calendar_event",
    description:
      "Propose creating or updating a calendar event. Does NOT save until the user confirms.",
    modes: ["write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
        type: { type: "string", enum: ["Report", "Event", "Upload", "Release"] },
        description: { type: "string" },
        owner: { type: "string" },
        summary: { type: "string" },
      },
      required: ["title", "date", "type", "owner", "summary"],
    },
    handler: async (args, ctx) => {
      const id = str(args, "id") || `cal-${Date.now()}`;
      const action = str(args, "id") ? "update" : "create";
      const after = {
        id,
        title: str(args, "title"),
        date: str(args, "date"),
        type: str(args, "type"),
        description: str(args, "description"),
        owner: str(args, "owner"),
      };
      return proposeChange(
        "propose_upsert_calendar_event",
        "calendarEvents",
        action,
        id,
        after,
        str(args, "summary"),
        ctx
      );
    },
  },
  {
    name: "propose_upsert_contact_team",
    description:
      "Propose creating or updating a partner/contact team (email, group chat, ownership notes). Does NOT save until confirmed.",
    modes: ["write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Existing id to update, or omit to create" },
        name: { type: "string" },
        category: { type: "string" },
        email: { type: "string", description: "Shared team mailbox" },
        groupChat: { type: "string", description: "Slack/Teams URL or channel name" },
        notes: {
          type: "string",
          description: "What this team owns / when to contact them",
        },
        summary: { type: "string" },
      },
      required: ["name", "category", "summary"],
    },
    handler: async (args, ctx) => {
      const id = str(args, "id") || `cteam-${Date.now()}`;
      const action = str(args, "id") ? "update" : "create";
      const after = {
        id,
        name: str(args, "name"),
        category: str(args, "category"),
        email: str(args, "email"),
        groupChat: str(args, "groupChat"),
        notes: str(args, "notes"),
      };
      return proposeChange(
        "propose_upsert_contact_team",
        "contactTeams",
        action,
        id,
        after,
        str(args, "summary"),
        ctx
      );
    },
  },
  {
    name: "propose_upsert_knowledge_doc",
    description:
      "Propose creating or updating a Markdown knowledge/report document. Does NOT save until confirmed.",
    modes: ["write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        domain: {
          type: "string",
          enum: ["support", "developer", "clients", "team", "reports", "general"],
        },
        tags: { type: "array", items: { type: "string" } },
        body: { type: "string", description: "Markdown body" },
        summary: { type: "string" },
      },
      required: ["title", "body", "summary"],
    },
    handler: async (args, ctx) => {
      const id = str(args, "id") || `kdoc-${Date.now()}`;
      const action = str(args, "id") ? "update" : "create";
      const tags = Array.isArray(args.tags)
        ? args.tags.map((t) => String(t))
        : [];
      const domain = str(args, "domain", "reports");
      // Proposal `summary` arg is the change rationale — doc summary is derived from body.
      const after = enrichMarkdownDocument({
        id,
        title: str(args, "title"),
        domain,
        tags,
        body: str(args, "body"),
        contentVersion: 1,
        lastUpdated: new Date().toISOString().slice(0, 10),
        isArchived: false,
      });
      return proposeChange(
        "propose_upsert_knowledge_doc",
        "knowledgeDocs",
        action,
        id,
        after,
        str(args, "summary"),
        ctx
      );
    },
  },
  {
    name: "propose_update_company_app",
    description:
      "Propose updating fields on an existing Company master-list row. Does NOT save until confirmed.",
    modes: ["write"],
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Company document id" },
        patch: {
          type: "object",
          description: "Partial fields to merge onto the existing row (e.g. comments, hasChanges)",
        },
        summary: { type: "string" },
      },
      required: ["id", "patch", "summary"],
    },
    handler: async (args, ctx) => {
      const id = str(args, "id");
      const existing = await getDocById(ctx, "companyApps", id);
      if (!existing) return { error: "Company not found" };
      const patch =
        args.patch && typeof args.patch === "object" && !Array.isArray(args.patch)
          ? (args.patch as Record<string, unknown>)
          : {};
      const after = {
        ...existing,
        ...patch,
        id,
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
      return proposeChange(
        "propose_update_company_app",
        "companyApps",
        "update",
        id,
        after,
        str(args, "summary"),
        ctx
      );
    },
  },
  {
    name: "propose_delete_doc",
    description:
      "Propose deleting a FAQ, KB article, knowledge doc, calendar event, team member, or contact team. Does NOT delete until confirmed.",
    modes: ["write"],
    inputSchema: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          enum: [
            "faqs",
            "kbArticles",
            "knowledgeDocs",
            "calendarEvents",
            "teamMembers",
            "contactTeams",
          ],
        },
        id: { type: "string" },
        summary: { type: "string" },
      },
      required: ["collection", "id", "summary"],
    },
    handler: async (args, ctx) => {
      const collection = str(args, "collection") as ProposalCollection;
      if (!WRITABLE_COLLECTIONS.includes(collection)) {
        return { error: `collection must be one of ${WRITABLE_COLLECTIONS.join(", ")}` };
      }
      return proposeChange(
        "propose_delete_doc",
        collection,
        "delete",
        str(args, "id"),
        null,
        str(args, "summary"),
        ctx
      );
    },
  },
];

export const ALL_TOOLS: NexusToolDefinition[] = [
  ...knowledgeLayerTools,
  ...readKbTools,
  ...readHubTools,
  ...writeTools,
];

export function toolsForMode(mode: AgentMode): NexusToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.modes.includes(mode));
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: Parameters<NexusToolDefinition["handler"]>[1],
  mode: AgentMode
): Promise<unknown> {
  const tool = toolsForMode(mode).find((t) => t.name === name);
  if (!tool) {
    return { error: `Unknown or unavailable tool for mode ${mode}: ${name}` };
  }

  const budgetCheck = consumeRetrievalBudget(ctx.retrievalBudget, name);
  if (budgetCheck.ok === false) {
    return { error: budgetCheck.error, budgetExhausted: true };
  }

  try {
    return await tool.handler(args ?? {}, ctx);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/** Convert tool defs to Gemini functionDeclarations */
export function toGeminiFunctionDeclarations(mode: AgentMode): FunctionDeclaration[] {
  return toolsForMode(mode).map((t) => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: Type.OBJECT,
      properties: Object.fromEntries(
        Object.entries(t.inputSchema.properties).map(([key, schema]) => {
          const s = schema as Record<string, unknown>;
          const mapped: Record<string, unknown> = {
            type: mapJsonTypeToGemini(String(s.type ?? "STRING")),
            description: s.description,
          };
          if (Array.isArray(s.enum)) mapped.enum = s.enum;
          if (s.items) {
            mapped.items = {
              type: mapJsonTypeToGemini(String((s.items as { type?: string }).type ?? "STRING")),
            };
          }
          if (s.type === "object") {
            mapped.type = Type.OBJECT;
          }
          return [key, mapped];
        })
      ),
      required: t.inputSchema.required ?? [],
    },
  }));
}

function mapJsonTypeToGemini(t: string): Type {
  switch (t.toLowerCase()) {
    case "string":
      return Type.STRING;
    case "number":
    case "integer":
      return Type.NUMBER;
    case "boolean":
      return Type.BOOLEAN;
    case "array":
      return Type.ARRAY;
    case "object":
      return Type.OBJECT;
    default:
      return Type.STRING;
  }
}
