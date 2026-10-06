import type { IncomingMessage, ServerResponse } from "http";
import { AuthError, authenticateRequest, createToolContext } from "../auth";
import { runAgent } from "../agent/runAgent";
import {
  buildAnswerCacheKey,
  getCachedAnswer,
  setCachedAnswer,
} from "../agent/answerCache";
import { agentAdmission, AgentRateLimitError } from "../agent/rateLimit";
import {
  applyProposalWrite,
  loadProposal,
  updateProposal,
  writeAudit,
} from "../data/store";
import { parseKnowledgeMode, resolveKnowledgeMode } from "../knowledge/intentRouter";
import type { AgentMode, AgentRequestBody, ConfirmRequestBody } from "../types";

export function sendJson(res: ServerResponse, status: number, body: unknown) {
  if (typeof (res as { status?: (n: number) => { json: (b: unknown) => void } }).status === "function") {
    (res as any).status(status).json(body);
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function headerFrom(
  req: { headers?: Record<string, string | string[] | undefined>; get?: (n: string) => string },
  name: string
): string | undefined {
  if (typeof req.get === "function") return req.get(name) || undefined;
  const v = req.headers?.[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

export async function processAgentRequest(
  req: { headers?: Record<string, string | string[] | undefined>; get?: (n: string) => string; body?: unknown },
  res: ServerResponse
): Promise<void> {
  let release: (() => void) | null = null;
  try {
    const auth = await authenticateRequest(
      headerFrom(req, "authorization"),
      headerFrom(req, "x-nexus-session")
    );
    const body = (req.body ?? {}) as AgentRequestBody;
    if (!body.message?.trim()) {
      sendJson(res, 400, { success: false, error: "message is required" });
      return;
    }

    const mode: AgentMode = body.mode === "hub" || body.mode === "write" ? body.mode : "kb";
    const message = body.message.trim();
    const selectedKnowledge = parseKnowledgeMode(body.knowledgeMode);
    const resolved = resolveKnowledgeMode(message, selectedKnowledge);

    const cacheKey = buildAnswerCacheKey({
      message,
      history: body.history,
      mode,
      knowledgeMode: resolved.mode,
    });
    const cached = getCachedAnswer(cacheKey);
    if (cached) {
      console.log(`[agent] cache hit uid=${auth.uid} mode=${mode} knowledge=${resolved.mode}`);
      sendJson(res, 200, cached);
      return;
    }

    release = await agentAdmission.acquireTurn(auth.uid);

    const ctx = createToolContext(auth, {
      knowledgeMode: resolved.mode,
      allowedDomains: resolved.allowedDomains,
    });
    const result = await runAgent({
      message,
      history: body.history,
      mode,
      ctx,
    });
    setCachedAnswer(cacheKey, result, mode);
    sendJson(res, 200, result);
  } catch (err) {
    if (err instanceof AuthError) {
      sendJson(res, err.status, { success: false, error: err.message });
      return;
    }
    if (err instanceof AgentRateLimitError) {
      if (typeof res.setHeader === "function") {
        res.setHeader("Retry-After", String(err.retryAfterSec));
      }
      sendJson(res, 429, {
        success: false,
        error: err.message,
        retryAfterSec: err.retryAfterSec,
      });
      return;
    }
    console.error("[agent]", err);
    sendJson(res, 500, {
      success: false,
      error: err instanceof Error ? err.message : "Agent request failed",
    });
  } finally {
    release?.();
  }
}

export async function processConfirmRequest(
  req: { headers?: Record<string, string | string[] | undefined>; get?: (n: string) => string; body?: unknown },
  res: ServerResponse
): Promise<void> {
  try {
    const auth = await authenticateRequest(
      headerFrom(req, "authorization"),
      headerFrom(req, "x-nexus-session")
    );
    const body = (req.body ?? {}) as ConfirmRequestBody;
    if (!body.proposalId || !body.decision) {
      sendJson(res, 400, { success: false, error: "proposalId and decision are required" });
      return;
    }

    const ctx = createToolContext(auth);
    const proposal = await loadProposal(ctx, body.proposalId);
    if (!proposal) {
      sendJson(res, 404, { success: false, error: "Proposal not found" });
      return;
    }
    if (proposal.status !== "pending") {
      sendJson(res, 409, { success: false, error: `Proposal already ${proposal.status}` });
      return;
    }

    if (body.decision === "reject") {
      proposal.status = "rejected";
      await updateProposal(ctx, proposal);
      await writeAudit(ctx, {
        proposalId: proposal.id,
        decision: "reject",
        uid: auth.uid,
        at: new Date().toISOString(),
        collection: proposal.collection,
        action: proposal.action,
      });
      sendJson(res, 200, { success: true, proposal });
      return;
    }

    const { appliedServerSide } = await applyProposalWrite(ctx, proposal);
    proposal.status = "confirmed";
    await updateProposal(ctx, proposal);
    await writeAudit(ctx, {
      proposalId: proposal.id,
      decision: "confirm",
      uid: auth.uid,
      at: new Date().toISOString(),
      collection: proposal.collection,
      action: proposal.action,
      appliedServerSide,
    });

    sendJson(res, 200, {
      success: true,
      proposal,
      applyPayload: appliedServerSide
        ? undefined
        : {
            collection: proposal.collection,
            action: proposal.action,
            documentId: proposal.documentId,
            document: proposal.after,
          },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      sendJson(res, err.status, { success: false, error: err.message });
      return;
    }
    console.error("[confirm]", err);
    sendJson(res, 500, {
      success: false,
      error: err instanceof Error ? err.message : "Confirm request failed",
    });
  }
}

function readRawBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

/** Express handlers — body already parsed by express.json() */
export async function expressAgent(req: any, res: any) {
  await processAgentRequest(req, res);
}

export async function expressConfirm(req: any, res: any) {
  await processConfirmRequest(req, res);
}

/** Node/Vercel handler helpers when body may need reading */
export async function handleAgentRaw(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "Method not allowed" });
    return;
  }
  if (req.body === undefined) {
    (req as { body?: unknown }).body = await readRawBody(req);
  }
  await processAgentRequest(req, res);
}

export async function handleConfirmRaw(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "Method not allowed" });
    return;
  }
  if (req.body === undefined) {
    (req as { body?: unknown }).body = await readRawBody(req);
  }
  await processConfirmRequest(req, res);
}
