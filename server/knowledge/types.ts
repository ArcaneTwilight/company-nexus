/** Server-side knowledge layer shapes (aligned with client Knowledge* types). */

export type {
  KnowledgeDomain,
  KnowledgeMode,
  KnowledgeOutlineHeading,
  KnowledgeRegistryEntry,
  KnowledgeSourceCollection,
  ResolvedKnowledgeMode,
} from "../types";

export interface KnowledgeSectionSlice {
  registryId: string;
  title: string;
  heading: string;
  body: string;
  truncated: boolean;
}

export interface KnowledgeDocPayload {
  registryId: string;
  title: string;
  domain: string;
  sourceCollection: string;
  sourceId: string;
  body: string;
  truncated: boolean;
  outline: Array<{ heading: string; anchor: string }>;
  hint?: string;
}
