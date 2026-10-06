import type { AgentProposal, KnowledgeDomain, ResolvedKnowledgeMode, ToolContext } from "./types";
import { domainsForMode } from "./knowledge/intentRouter";
import { createRetrievalBudget } from "./agent/retrievalBudget";

const LEGACY_SESSION_TOKEN = "irapp-nexus-session-token-2026-secure";

export interface AuthResult {
  uid: string;
  email: string | null;
  idToken: string | null;
  useFirestore: boolean;
  projectId: string | null;
}

function getProjectId(): string | null {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    null
  );
}

function getWebApiKey(): string | null {
  return process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || null;
}

export function isFirebaseServerConfigured(): boolean {
  return Boolean(getProjectId() && getWebApiKey());
}

/** Verify Firebase ID token via Identity Toolkit, or accept legacy local session. */
export async function authenticateRequest(
  authorizationHeader: string | undefined,
  legacyTokenHeader: string | undefined
): Promise<AuthResult> {
  const bearer = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7).trim()
    : null;

  if (bearer && isFirebaseServerConfigured()) {
    const apiKey = getWebApiKey()!;
    const projectId = getProjectId()!;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: bearer }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new AuthError(`Invalid Firebase token: ${err}`, 401);
    }

    const data = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string }>;
    };
    const user = data.users?.[0];
    if (!user?.localId) {
      throw new AuthError("Firebase token did not resolve to a user", 401);
    }

    return {
      uid: user.localId,
      email: user.email ?? null,
      idToken: bearer,
      useFirestore: true,
      projectId,
    };
  }

  // Local legacy mode (dev without Firebase)
  const legacy =
    legacyTokenHeader === LEGACY_SESSION_TOKEN || bearer === LEGACY_SESSION_TOKEN;
  if (legacy && !isFirebaseServerConfigured()) {
    return {
      uid: "legacy-local",
      email: null,
      idToken: null,
      useFirestore: false,
      projectId: null,
    };
  }

  // Allow unauthenticated local agent when Firebase is not configured at all
  if (!isFirebaseServerConfigured() && process.env.NODE_ENV !== "production") {
    return {
      uid: "dev-anonymous",
      email: null,
      idToken: null,
      useFirestore: false,
      projectId: null,
    };
  }

  throw new AuthError(
    "Missing or invalid Authorization Bearer token. Sign in and pass a Firebase ID token.",
    401
  );
}

export function createToolContext(
  auth: AuthResult,
  opts?: {
    knowledgeMode?: ResolvedKnowledgeMode;
    allowedDomains?: KnowledgeDomain[];
  }
): ToolContext {
  const knowledgeMode = opts?.knowledgeMode ?? "general";
  return {
    uid: auth.uid,
    idToken: auth.idToken,
    useFirestore: auth.useFirestore,
    projectId: auth.projectId,
    proposals: [] as AgentProposal[],
    knowledgeMode,
    allowedDomains: opts?.allowedDomains ?? domainsForMode(knowledgeMode),
    retrievalBudget: createRetrievalBudget(),
  };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
