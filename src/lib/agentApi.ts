import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
import { normalizeMarkdownKnowledgeFields } from "./knowledgeMarkdown";
import type {
  AgentMode,
  AgentProposal,
  FAQItem,
  KBItem,
  KnowledgeDoc,
  companymasterapp,
  CalendarEvent,
  TeamMember,
  ContactTeam,
  ProposalCollection,
  KnowledgeMode,
  KnowledgeCitation,
} from "../types";
import type { NexusRepositoryActions } from "../services/nexusRepository";

function enrichClientMarkdownDoc(
  collection: ProposalCollection,
  document: Record<string, unknown>
): Record<string, unknown> {
  if (
    collection !== "faqs" &&
    collection !== "kbArticles" &&
    collection !== "knowledgeDocs"
  ) {
    return document;
  }
  const body = String(document.body ?? "");
  const title = String(document.title ?? document.id ?? "Untitled");
  const existingSummary =
    typeof document.summary === "string" ? document.summary : undefined;
  const derived = normalizeMarkdownKnowledgeFields(body, existingSummary, title);
  return {
    ...document,
    summary: derived.summary,
    outline: derived.outline,
    tokenEstimate: derived.tokenEstimate,
    contentVersion:
      typeof document.contentVersion === "number" ? document.contentVersion : 1,
  };
}

export interface AgentApiResult {
  success: boolean;
  reply?: string;
  proposals?: AgentProposal[];
  toolsUsed?: string[];
  citations?: KnowledgeCitation[];
  cached?: boolean;
  error?: string;
  retryAfterSec?: number;
}

export interface ConfirmApiResult {
  success: boolean;
  proposal?: AgentProposal;
  applyPayload?: {
    collection: ProposalCollection;
    action: "create" | "update" | "delete";
    documentId: string;
    document: Record<string, unknown> | null;
  };
  error?: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (isFirebaseConfigured()) {
    const user = getFirebaseAuth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
  } else {
    const session =
      sessionStorage.getItem("company_nexus_session") ||
      sessionStorage.getItem("irapp_nexus_session");
    if (session) {
      headers["X-Nexus-Session"] = session;
      headers.Authorization = `Bearer ${session}`;
    }
  }

  return headers;
}

export async function callAgent(options: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  mode: AgentMode;
  knowledgeMode?: KnowledgeMode;
}): Promise<AgentApiResult> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      message: options.message,
      history: options.history,
      mode: options.mode,
      knowledgeMode: options.knowledgeMode ?? "auto",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      success: false,
      error: data.error || `HTTP ${response.status}`,
      retryAfterSec:
        typeof data.retryAfterSec === "number"
          ? data.retryAfterSec
          : response.status === 429
            ? 30
            : undefined,
    };
  }
  return data as AgentApiResult;
}

export async function confirmProposal(
  proposalId: string,
  decision: "confirm" | "reject"
): Promise<ConfirmApiResult> {
  const response = await fetch("/api/confirm", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ proposalId, decision }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || `HTTP ${response.status}` };
  }
  return data as ConfirmApiResult;
}

/** Apply confirm payload locally when server could not write Firestore. */
export async function applyConfirmLocally(
  result: ConfirmApiResult,
  actions: NexusRepositoryActions
): Promise<void> {
  const proposal = result.proposal;
  if (!proposal || proposal.status !== "confirmed") return;

  const payload = result.applyPayload;
  const collection = payload?.collection ?? proposal.collection;
  const action = payload?.action ?? proposal.action;
  const documentId = payload?.documentId ?? proposal.documentId;
  const document = payload?.document ?? proposal.after;

  if (action === "delete") {
    switch (collection) {
      case "faqs":
        await actions.deleteFaq(documentId);
        break;
      case "kbArticles":
        await actions.deleteArticle(documentId);
        break;
      case "calendarEvents":
        await actions.deleteCalendarEvent(documentId);
        break;
      case "teamMembers":
        await actions.deleteTeamMember(documentId);
        break;
      case "contactTeams":
        await actions.deleteContactTeam(documentId);
        break;
      case "companyApps":
        await actions.deletecompanyApp(documentId);
        break;
      case "knowledgeDocs":
        await actions.deleteKnowledgeDoc(documentId);
        break;
    }
    return;
  }

  if (!document) return;

  const enriched = enrichClientMarkdownDoc(collection, document);

  switch (collection) {
    case "faqs":
      await actions.upsertFaq(enriched as unknown as FAQItem);
      break;
    case "kbArticles":
      await actions.upsertArticle(enriched as unknown as KBItem);
      break;
    case "calendarEvents":
      await actions.upsertCalendarEvent(enriched as unknown as CalendarEvent);
      break;
    case "teamMembers":
      await actions.upsertTeamMember(enriched as unknown as TeamMember);
      break;
    case "contactTeams":
      await actions.upsertContactTeam(enriched as unknown as ContactTeam);
      break;
    case "companyApps":
      await actions.upsertcompanyApp(enriched as unknown as companymasterapp);
      break;
    case "knowledgeDocs":
      await actions.upsertKnowledgeDoc(enriched as unknown as KnowledgeDoc);
      break;
  }
}
