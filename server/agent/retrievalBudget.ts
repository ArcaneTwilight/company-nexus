import { RETRIEVAL_BUDGET_LIMITS } from "./config";

export interface RetrievalBudgetState {
  registrySearches: number;
  summaries: number;
  sections: number;
  fullDocs: number;
  legacyBodySearches: number;
}

export function createRetrievalBudget(): RetrievalBudgetState {
  return {
    registrySearches: 0,
    summaries: 0,
    sections: 0,
    fullDocs: 0,
    legacyBodySearches: 0,
  };
}

type BudgetKey = keyof RetrievalBudgetState;

const TOOL_BUDGET: Record<string, BudgetKey> = {
  search_knowledge_registry: "registrySearches",
  get_knowledge_summary: "summaries",
  get_knowledge_section: "sections",
  get_knowledge_doc: "fullDocs",
  search_kb: "legacyBodySearches",
  search_faqs: "legacyBodySearches",
  get_doc_by_id: "fullDocs",
};

export function consumeRetrievalBudget(
  budget: RetrievalBudgetState | undefined,
  toolName: string
): { ok: true } | { ok: false; error: string } {
  if (!budget) return { ok: true };
  const key = TOOL_BUDGET[toolName];
  if (!key) return { ok: true };

  const limit = RETRIEVAL_BUDGET_LIMITS[key];
  if (budget[key] >= limit) {
    return {
      ok: false,
      error: `Retrieval budget exhausted for ${toolName} (limit ${limit} per turn). Answer from what you already have, or ask the user to narrow the question.`,
    };
  }
  budget[key] += 1;
  return { ok: true };
}
