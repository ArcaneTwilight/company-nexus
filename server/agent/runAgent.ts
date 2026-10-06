import { GoogleGenAI, type Content, type Part } from "@google/genai";
import type {
  AgentMode,
  AgentChatTurn,
  AgentSuccessResponse,
  ResolvedKnowledgeMode,
  ToolContext,
} from "../types";
import { executeTool, toGeminiFunctionDeclarations } from "../tools/registry";
import { agentConfig } from "./config";
import { agentAdmission, AgentRateLimitError } from "./rateLimit";
import { retrieveKnowledgeChunks, type RetrievedKnowledgeChunk } from "../knowledge/retrieval";

const DEFAULT_MODEL = "gemini-3.5-flash";

function resolveModel(): string {
  const raw = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  return raw.replace(/^["']|["']$/g, "");
}

function systemInstructionForMode(
  mode: AgentMode,
  knowledgeMode: ResolvedKnowledgeMode
): string {
  const base = `You are the Company Nexus AI Assistant for a private IR/operations team.
Use tools to look up factual information from the Nexus repositories. Do NOT invent data.
Cite document titles, company names, or event titles you used.
Keep answers concise, objective, and use Markdown.
If tools return no matches, say so clearly.

Knowledge routing mode: ${knowledgeMode} (domains are pre-filtered server-side).
Retrieval protocol (save tokens / free-tier quota):
1. Always start with search_knowledge_registry.
2. If summaries/outlines are enough, answer — do not load full docs.
3. Else get_knowledge_summary (card metadata only), then get_knowledge_section for one heading.
4. Use get_knowledge_doc only when necessary (short docs or no headings).
5. Hard server budgets apply: ~2 registry searches, ~3 summaries, ~2 sections, ~1 full doc per turn.
6. For company/team/calendar virtual entries, use search_company_apps, find_team_member, find_contact_team, or calendar tools.
7. Avoid legacy search_faqs / search_kb unless registry search misses.
8. Prefer a short final answer over more tool rounds.`;

  if (mode === "kb") {
    return `${base}
You may use knowledge registry tools plus FAQ/KB search (search_faqs, search_kb, get_doc_by_id).
Prefer the knowledge registry layer. Answer using repository knowledge only.`;
  }

  if (mode === "hub") {
    return `${base}
You can search the knowledge registry, FAQs, KB, master list, calendar events, members, and partner contact teams.
Prefer registry + specialized structured tools over guessing. For deadlines, use get_upcoming_deadlines or list_calendar_events. For who owns app-adjacent content, use find_contact_team.`;
  }

  return `${base}
You can read hub/knowledge data AND propose writes via propose_* tools.
CRITICAL: propose_* tools never save automatically. Tell the user a confirmation card will appear and they must Confirm before anything is written.
Never claim a change was saved — only that a proposal is ready for confirmation.`;
}

function isGeminiRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b|RESOURCE_EXHAUSTED|rate[_ ]?limit|quota/i.test(msg);
}

export function knowledgeSystemInstruction(
  message: string,
  chunks: RetrievedKnowledgeChunk[]
): string {
  const context = chunks.length === 0
    ? "[No matching knowledge chunks were retrieved.]"
    : chunks.map((chunk, index) => [
        `[${index + 1}] Source: ${chunk.title} [${chunk.sourceCollection}/${chunk.sourceDocId}, chunk ${chunk.chunkIndex}]`,
        chunk.sectionHeading ? `Section: ${chunk.sectionHeading}` : "",
        chunk.chunkText,
      ].filter(Boolean).join("\n")).join("\n\n");

  return `You are the Company Nexus AI Assistant for a private IR/operations team.
For this knowledge-answering request, use only the retrieved knowledge chunks below. Do not use general model knowledge, unsupported assumptions, or information outside these chunks. If the chunks do not answer the user's question, say that the available Nexus knowledge does not contain the answer. Do not guess.
Answer concisely and objectively in Markdown. After the answer, add a Sources section listing every source title you actually used. Use the exact title shown below. Do not cite a source you did not use.

Retrieved knowledge chunks:
${context}

User question:
${message}`;
}

function citationsUsedInReply(
  reply: string,
  chunks: RetrievedKnowledgeChunk[]
) {
  const normalizedReply = reply.toLowerCase();
  const seen = new Set<string>();
  return chunks
    .filter((chunk) => normalizedReply.includes(chunk.title.toLowerCase()))
    .filter((chunk) => {
      const key = `${chunk.sourceCollection}/${chunk.sourceDocId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ chunkText: _chunkText, ...citation }) => citation);
}

function logUsage(model: string, round: number, response: { usageMetadata?: unknown }) {
  const usage = response.usageMetadata as
    | {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      }
    | undefined;
  if (!usage) return;
  console.log(
    `[agent] usage model=${model} round=${round} prompt=${usage.promptTokenCount ?? "?"} candidates=${usage.candidatesTokenCount ?? "?"} total=${usage.totalTokenCount ?? "?"}`
  );
}

export async function runAgent(options: {
  message: string;
  history?: AgentChatTurn[];
  mode: AgentMode;
  ctx: ToolContext;
}): Promise<AgentSuccessResponse> {
  const { message, history = [], mode, ctx } = options;
  const cfg = agentConfig();

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const contents: Content[] = [];

  for (const msg of history.slice(-cfg.historyTurns)) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  const functionDeclarations = toGeminiFunctionDeclarations(mode);
  const toolsUsed: string[] = [];
  const retrievedChunks = mode === "kb"
    ? await retrieveKnowledgeChunks(ctx, message)
    : [];

  const model = resolveModel();
  console.log(
    `[agent] Using model: ${model}; knowledgeMode=${ctx.knowledgeMode}; domains=${ctx.allowedDomains.join(",")}; maxRounds=${cfg.maxToolRounds}`
  );

  for (let round = 0; round < cfg.maxToolRounds; round++) {
    await agentAdmission.acquireGeminiCall();

    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: mode === "kb"
            ? knowledgeSystemInstruction(message, retrievedChunks)
            : systemInstructionForMode(mode, ctx.knowledgeMode),
          temperature: 0.2,
          maxOutputTokens: cfg.maxOutputTokens,
          ...(mode === "kb" ? {} : { tools: [{ functionDeclarations }] }),
        },
      });
    } catch (err) {
      if (isGeminiRateLimitError(err)) {
        throw new AgentRateLimitError(
          "Gemini free-tier rate limit hit. Please wait about a minute, or use header search for lookups.",
          60
        );
      }
      throw err;
    }

    logUsage(model, round, response);

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const modelParts = response.candidates?.[0]?.content?.parts;
      if (modelParts?.length) {
        contents.push({ role: "model", parts: modelParts });
      } else {
        contents.push({
          role: "model",
          parts: functionCalls.map((fc) => ({
            functionCall: {
              name: fc.name,
              args: (fc.args ?? {}) as Record<string, unknown>,
              id: fc.id,
            },
          })),
        });
      }

      const responseParts: Part[] = [];
      for (const fc of functionCalls) {
        const name = fc.name || "unknown";
        toolsUsed.push(name);
        const args = (fc.args ?? {}) as Record<string, unknown>;
        const result = await executeTool(name, args, ctx, mode);
        responseParts.push({
          functionResponse: {
            name,
            ...(fc.id ? { id: fc.id } : {}),
            response: result as Record<string, unknown>,
          },
        });
      }
      contents.push({ role: "user", parts: responseParts });
      continue;
    }

    const reply = response.text?.trim() || "I could not generate a response.";
    return {
      success: true,
      reply,
      proposals: [...ctx.proposals],
      toolsUsed: [...new Set(toolsUsed)],
      citations: citationsUsedInReply(reply, retrievedChunks),
    };
  }

  return {
    success: true,
    reply:
      "I reached the tool-call limit before finishing (kept short for free-tier quota). Please ask a more specific question, pick a knowledge domain chip, or use header search.",
    proposals: [...ctx.proposals],
    toolsUsed: [...new Set(toolsUsed)],
  };
}
