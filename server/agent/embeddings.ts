import { GoogleGenAI, type Content } from "@google/genai";

const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-2";
const DEFAULT_OUTPUT_DIMENSIONS = 768;
const DEFAULT_BATCH_SIZE = 8;

function numberEnv(name: string, fallback: number, minimum: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) ? Math.max(minimum, value) : fallback;
}

export function embeddingConfig() {
  return {
    model: process.env.GEMINI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL,
    outputDimensions: numberEnv(
      "GEMINI_EMBEDDING_DIMENSIONS",
      DEFAULT_OUTPUT_DIMENSIONS,
      128
    ),
    batchSize: numberEnv("GEMINI_EMBEDDING_BATCH_SIZE", DEFAULT_BATCH_SIZE, 1),
    maxRetries: numberEnv("GEMINI_EMBEDDING_MAX_RETRIES", 4, 0),
    retryBaseMs: numberEnv("GEMINI_EMBEDDING_RETRY_BASE_MS", 1000, 100),
    batchDelayMs: numberEnv("GEMINI_EMBEDDING_BATCH_DELAY_MS", 1500, 0),
  };
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b429\b|RESOURCE_EXHAUSTED|rate[_ ]?limit|quota/i.test(message);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function embedBatch(
  ai: GoogleGenAI,
  texts: string[],
  model: string,
  outputDimensions: number
): Promise<number[][]> {
  const contents: Content[] = texts.map((text) => ({
    role: "user",
    parts: [{ text: `title: none | text: ${text}` }],
  }));
  const response = await ai.models.embedContent({
    model,
    contents,
    config: { outputDimensionality: outputDimensions },
  });
  const embeddings = response.embeddings?.map((embedding) => embedding.values ?? []) ?? [];
  if (embeddings.length !== texts.length || embeddings.some((embedding) => embedding.length === 0)) {
    throw new Error(`Gemini returned ${embeddings.length} embeddings for ${texts.length} inputs.`);
  }
  return embeddings;
}

export async function embedTexts(texts: string[]): Promise<{
  embeddings: number[][];
  model: string;
  dimensions: number;
  batches: number;
  retries: number;
}> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");
  const config = embeddingConfig();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const embeddings: number[][] = [];
  let retries = 0;
  let batches = 0;

  for (let start = 0; start < texts.length; start += config.batchSize) {
    const batch = texts.slice(start, start + config.batchSize);
    let attempt = 0;
    while (true) {
      try {
        batches += 1;
        embeddings.push(...await embedBatch(ai, batch, config.model, config.outputDimensions));
        break;
      } catch (error) {
        if (!isRateLimitError(error) || attempt >= config.maxRetries) throw error;
        const delay = config.retryBaseMs * 2 ** attempt;
        retries += 1;
        console.warn(`[backfill] embedding rate limit; retry=${retries} delayMs=${delay}`);
        await sleep(delay);
        attempt += 1;
      }
    }
    if (start + config.batchSize < texts.length && config.batchDelayMs > 0) {
      await sleep(config.batchDelayMs);
    }
  }

  return {
    embeddings,
    model: config.model,
    dimensions: config.outputDimensions,
    batches,
    retries,
  };
}