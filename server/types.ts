/** Shared types for the Nexus agent, tools, and MCP surface. */

export type AgentMode = "kb" | "hub" | "write";

/** Retrieval routing hint — orthogonal to AgentMode (capability). */
export type KnowledgeMode =
  | "support"
  | "developer"
  | "clients"
  | "team"
  | "reports"
  | "general"
  | "auto";

export type KnowledgeDomain =
  | "support"
  | "developer"
  | "clients"
  | "team"
  | "reports"
  | "general";

export type ResolvedKnowledgeMode = Exclude<KnowledgeMode, "auto">;

export type KnowledgeSourceCollection =
  | "faqs"
  | "kbArticles"
  | "companyApps"
  | "calendarEvents"
  | "teamMembers"
  | "contactTeams"
  | "knowledgeDocs"
  | "virtual";

export type KnowledgeChunkSourceCollection =
  | "faqs"
  | "kbArticles"
  | "companyApps"
  | "knowledgeDocs";

export interface KnowledgeChunk {
  id: string;
  sourceCollection: KnowledgeChunkSourceCollection;
  sourceDocId: string;
  chunkIndex: number;
  chunkText: string;
  title: string;
  sectionHeading?: string;
  category?: string;
  domain?: KnowledgeDomain;
  tags?: string[];
  embedding: number[];
  embeddingModel: string;
  embeddingDimensions: number;
}

export interface KnowledgeOutlineHeading {
  heading: string;
  anchor: string;
  charStart?: number;
  charEnd?: number;
}

export interface KnowledgeRegistryEntry {
  id: string;
  sourceCollection: KnowledgeSourceCollection;
  sourceId: string;
  title: string;
  domain: KnowledgeDomain;
  tags: string[];
  summary: string;
  outline: KnowledgeOutlineHeading[];
  tokenEstimate: number;
  contentHash: string;
  contentVersion: number;
  updatedAt: string;
  isArchived: boolean;
}

export interface AgentChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AgentRequestBody {
  message: string;
  history?: AgentChatTurn[];
  /** kb = FAQ+KB tools; hub = + master list/calendar/team; write = + propose_* tools */
  mode?: AgentMode;
  /** Optional retrieval domain hint; omit or "auto" to detect from the query */
  knowledgeMode?: KnowledgeMode;
}

export type ProposalAction = "create" | "update" | "delete";

export type ProposalCollection =
  | "faqs"
  | "kbArticles"
  | "companyApps"
  | "calendarEvents"
  | "teamMembers"
  | "contactTeams"
  | "knowledgeDocs";

export interface AgentProposal {
  id: string;
  tool: string;
  collection: ProposalCollection;
  action: ProposalAction;
  documentId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  summary: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
  createdBy: string;
}

export interface KnowledgeCitation {
  id: string;
  sourceCollection: KnowledgeChunkSourceCollection;
  sourceDocId: string;
  chunkIndex: number;
  title: string;
  sectionHeading?: string;
  score: number;
}

export interface AgentSuccessResponse {
  success: true;
  reply: string;
  proposals: AgentProposal[];
  toolsUsed: string[];
  citations?: KnowledgeCitation[];
  /** True when served from the in-process answer cache (no Gemini call). */
  cached?: boolean;
}

export interface AgentErrorResponse {
  success: false;
  error: string;
  /** Seconds until the client should retry (rate limits). */
  retryAfterSec?: number;
}

export type AgentResponse = AgentSuccessResponse | AgentErrorResponse;

export interface ConfirmRequestBody {
  proposalId: string;
  decision: "confirm" | "reject";
}

export interface ConfirmSuccessResponse {
  success: true;
  proposal: AgentProposal;
  /** When server cannot write, client applies this via nexusRepository. */
  applyPayload?: {
    collection: ProposalCollection;
    action: ProposalAction;
    documentId: string;
    document: Record<string, unknown> | null;
  };
}

export interface RetrievalBudgetCounters {
  registrySearches: number;
  summaries: number;
  sections: number;
  fullDocs: number;
  legacyBodySearches: number;
}

export interface ToolContext {
  uid: string;
  /** Firebase ID token when available (Firestore REST). */
  idToken: string | null;
  /** Prefer live Firestore; fall back to seed/local cache. */
  useFirestore: boolean;
  projectId: string | null;
  /** Proposals created during this agent turn (mutated by propose_* tools). */
  proposals: AgentProposal[];
  /** Resolved knowledge routing mode (never "auto"). */
  knowledgeMode: ResolvedKnowledgeMode;
  /** Domains the registry/tools may search this turn. */
  allowedDomains: KnowledgeDomain[];
  /** Hard per-turn retrieval budgets (enforced in executeTool). */
  retrievalBudget: RetrievalBudgetCounters;
}

export interface NexusToolDefinition {
  name: string;
  description: string;
  /** MCP / JSON Schema object */
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  /** Which agent modes expose this tool */
  modes: AgentMode[];
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
}
