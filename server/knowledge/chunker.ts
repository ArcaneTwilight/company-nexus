import type {
  KnowledgeChunk,
  KnowledgeChunkSourceCollection,
  KnowledgeDomain,
} from "../types";

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/gm;
const SHORT_DOCUMENT_WORDS = 500;
const TARGET_CHARS = 6000;

type SourceDocument = Record<string, unknown> & { id: string };

export type ChunkDraft = Omit<
  KnowledgeChunk,
  "id" | "chunkIndex" | "embedding" | "embeddingModel" | "embeddingDimensions"
>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function joinLabeledParts(parts: Array<[string, string]>): string {
  return parts
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function sentencePieces(value: string): string[] {
  const paragraphs = value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const pieces: string[] = [];

  for (const paragraph of paragraphs) {
    const matches = paragraph.match(/[^.!?\n]+(?:[.!?]+|$)/g) ?? [paragraph];
    pieces.push(...matches.map((piece) => piece.trim()).filter(Boolean));
  }

  return pieces;
}

function splitAtSentenceBoundaries(
  value: string,
  heading?: string,
  maxWords = Number.MAX_SAFE_INTEGER
): string[] {
  const pieces = sentencePieces(value);
  if (pieces.length === 0) return [];

  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    const candidate = current ? `${current} ${piece}` : piece;
    const candidateWords = candidate.split(/\s+/).filter(Boolean).length;
    if (current && (candidate.length > TARGET_CHARS || candidateWords > maxWords)) {
      chunks.push(current.trim());
      current = piece;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current.trim());

  return chunks.map((chunk) => (heading ? `${heading}\n\n${chunk}` : chunk));
}

function markdownSections(body: string): Array<{ heading?: string; body: string }> {
  const matches = [...body.matchAll(HEADING_RE)];
  if (matches.length === 0) return [{ body }];

  const sections: Array<{ heading?: string; body: string }> = [];
  const preamble = body.slice(0, matches[0]?.index ?? 0).trim();
  if (preamble) sections.push({ body: preamble });

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const heading = text(match[2]);
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? body.length;
    const sectionBody = body.slice(start, end).trim();
    if (sectionBody) sections.push({ heading, body: sectionBody });
  }

  return sections;
}

function markdownDrafts(
  collection: "kbArticles" | "knowledgeDocs",
  doc: SourceDocument
): ChunkDraft[] {
  const title = text(doc.title) || doc.id;
  const body = text(doc.body);
  if (!body) return [];

  const category = collection === "kbArticles" ? text(doc.category) || undefined : undefined;
  const domain = collection === "knowledgeDocs" ? (text(doc.domain) as KnowledgeDomain) : undefined;
  const tags = stringList(doc.tags);
  const sections = markdownSections(body);
  const hasHeaders = [...body.matchAll(HEADING_RE)].length > 0;
  const drafts: ChunkDraft[] = [];

  for (const section of sections) {
    const sectionText = section.body;
    const chunks = sectionText.length > TARGET_CHARS ||
      (!hasHeaders && !isShortHeaderlessDocument(body))
      ? splitAtSentenceBoundaries(
          sectionText,
          section.heading,
          !hasHeaders ? SHORT_DOCUMENT_WORDS - 1 : Number.MAX_SAFE_INTEGER
        )
      : [sectionText];

    for (const chunkText of chunks) {
      drafts.push({
        sourceCollection: collection,
        sourceDocId: doc.id,
        chunkText: joinLabeledParts([
          ["Title", title],
          ["Content", chunkText],
        ]),
        title,
        ...(section.heading ? { sectionHeading: section.heading } : {}),
        ...(category ? { category } : {}),
        ...(domain ? { domain } : {}),
        ...(tags.length ? { tags } : {}),
      });
    }
  }

  return drafts;
}

function faqDraft(doc: SourceDocument): ChunkDraft[] {
  const title = text(doc.title) || doc.id;
  const body = text(doc.body);
  if (!body && !title) return [];

  return [{
    sourceCollection: "faqs",
    sourceDocId: doc.id,
    chunkText: joinLabeledParts([["Question", title], ["Answer", body]]),
    title,
    ...(text(doc.category) ? { category: text(doc.category) } : {}),
    ...(stringList(doc.tags).length ? { tags: stringList(doc.tags) } : {}),
  }];
}

function appDraft(doc: SourceDocument): ChunkDraft[] {
  const title = text(doc.companyName) || doc.id;
  if (!title) return [];

  const metadata: Array<[string, string]> = [
    ["Status", text(doc.statusLabel) || text(doc.statusKey)],
    ["Version", text(doc.liveVersion)],
    ["Release", text(doc.v3Release) || text(doc.v3ReleaseRaw)],
    ["Order", text(doc.upgradeOrNewOrder)],
    ["Country", text(doc.country)],
    ["Market", text(doc.market)],
    ["Stock exchange", text(doc.stockExchange)],
    ["Comments", text(doc.comments)],
    ["Sales onboarding POC", stringList(doc.salesOnboardingPoc).join(", ")],
    ["PSS POC", stringList(doc.pssPoc).join(", ")],
    ["Dev POC", stringList(doc.devPoc).join(", ")],
    ["Account feature", text((doc.accountFeature as Record<string, unknown> | undefined)?.label)],
    ["Media feature", text((doc.media as Record<string, unknown> | undefined)?.label)],
    ["AI features", text((doc.aiFeatures as Record<string, unknown> | undefined)?.label)],
    ["Dynamic content", text(doc.dynamicContent)],
    ["Manual update module", text(doc.manualUpdateModule)],
    ["Marketing material", stringList(doc.marketingMaterial).join(", ")],
  ];

  return [{
    sourceCollection: "companyApps",
    sourceDocId: doc.id,
    chunkText: joinLabeledParts([["Company", title], ...metadata]),
    title,
    ...(text(doc.country) || text(doc.market) ? {
      category: [text(doc.country), text(doc.market)].filter(Boolean).join(" / "),
    } : {}),
  }];
}

export function chunkDocument(
  sourceCollection: KnowledgeChunkSourceCollection,
  doc: SourceDocument
): ChunkDraft[] {
  if (sourceCollection === "faqs") return faqDraft(doc);
  if (sourceCollection === "companyApps") return appDraft(doc);
  return markdownDrafts(sourceCollection, doc);
}

export function chunkDocuments(
  sourceCollection: KnowledgeChunkSourceCollection,
  docs: SourceDocument[]
): ChunkDraft[] {
  return docs.flatMap((doc) => chunkDocument(sourceCollection, doc));
}

export function isShortHeaderlessDocument(body: string): boolean {
  return text(body).split(/\s+/).filter(Boolean).length < SHORT_DOCUMENT_WORDS;
}
