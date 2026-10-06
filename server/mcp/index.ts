/**
 * Company Nexus MCP server. This process is intentionally stdio-only and is
 * trusted-local when launched by Claude Desktop. Do not expose it over a
 * network transport without adding authentication and request controls.
 */

import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createToolContext } from "../auth";
import { searchDocs } from "../data/store";
import { retrieveKnowledgeChunks } from "../knowledge/retrieval";
import {
  proposeHubUpdate,
  WRITABLE_COLLECTIONS,
} from "../tools/registry";
import type { ProposalCollection } from "../types";

const TOOLS = [
  {
    name: "search_knowledge_base",
    description:
      "Search the embedded Company Nexus knowledge base for factual answers. Use this for source-backed questions; the result contains ranked chunks and citations for the host model to summarize.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The question or search query." },
        topK: {
          type: "number",
          description: "Maximum number of ranked chunks to return. Defaults to 5.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_faq",
    description:
      "Find FAQs matching a topic or support question. Use this when the user is specifically asking for an FAQ-style answer; this tool only reads data.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The FAQ topic or support question." },
      },
      required: ["topic"],
    },
  },
  {
    name: "propose_hub_update",
    description:
      "Create a pending proposal to create or update a writable Company Nexus document. Use only when the user explicitly requests a data change. This does not apply the change: the user must approve the proposal through the existing web UI and /api/confirm flow before anything is written.",
    inputSchema: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: "Writable collection to change.",
          enum: WRITABLE_COLLECTIONS,
        },
        docId: {
          type: ["string", "null"],
          description: "Existing document id for an update, or null to create.",
        },
        changes: {
          type: "object",
          description: "Fields to create or update on the document.",
        },
      },
      required: ["collection", "docId", "changes"],
    },
  },
];

function buildCtx() {
  const idToken = process.env.NEXUS_ID_TOKEN || null;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || null;
  const useFirestore = Boolean(idToken && projectId);
  return createToolContext(
    {
      uid: process.env.NEXUS_MCP_UID || "mcp-local",
      email: null,
      idToken,
      useFirestore,
      projectId,
    },
    { knowledgeMode: "general" }
  );
}

const server = new Server(
  { name: "irapp-nexus", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  const ctx = buildCtx();
  let result: unknown;

  if (name === "search_knowledge_base") {
    if (typeof args.query !== "string" || !args.query.trim()) {
      result = { error: "query is required" };
    } else {
      const topK = typeof args.topK === "number" && Number.isFinite(args.topK)
        ? Math.min(20, Math.max(1, Math.floor(args.topK)))
        : 5;
      result = { results: await retrieveKnowledgeChunks(ctx, args.query, { k: topK }) };
    }
  } else if (name === "get_faq") {
    if (typeof args.topic !== "string" || !args.topic.trim()) {
      result = { error: "topic is required" };
    } else {
      const results = await searchDocs(ctx, "faqs", args.topic);
      result = { count: results.length, results };
    }
  } else if (name === "propose_hub_update") {
    const collection = args.collection;
    const docId = args.docId;
    const changes = args.changes;
    if (
      typeof collection !== "string" ||
      !WRITABLE_COLLECTIONS.includes(collection as ProposalCollection)
    ) {
      result = { error: `collection must be one of ${WRITABLE_COLLECTIONS.join(", ")}` };
    } else if (docId !== null && typeof docId !== "string") {
      result = { error: "docId must be a string or null" };
    } else if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
      result = { error: "changes must be an object" };
    } else {
      const normalizedDocId = docId === null ? null : (docId as string);
      result = await proposeHubUpdate(
        collection as ProposalCollection,
        normalizedDocId,
        changes as Record<string, unknown>,
        ctx
      );
    }
  } else {
    result = { error: `Unknown MCP tool: ${name}` };
  }

  const text = JSON.stringify(result, null, 2);
  return {
    content: [{ type: "text", text }],
    structuredContent: result as Record<string, unknown>,
    isError: Boolean(result && typeof result === "object" && "error" in (result as object)),
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Company Nexus MCP server running over stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
