import type { EmbeddingClient, QuestionState } from './retrieve.js';
import type { SearchProvider } from '../search/types.js';

const defaultChunkSize = 1_000;
const defaultChunkOverlap = 100;
const defaultResultLimit = 3;
const defaultTtlDays = 7;

export interface WebSearchState extends QuestionState {
  missingAspects: readonly string[];
}

export interface WebDocumentToStore {
  id: string;
  query: string;
  title: string;
  content: string;
  sourceUrl: string;
  fetchedAt: Date;
  expiresAt: Date;
  embedding: readonly number[];
}

export interface WebDocumentStore {
  insert(document: WebDocumentToStore): Promise<void>;
}

/** Decides whether transient web content from a URL may be persisted. */
export interface WebSourcePolicy {
  allows(url: string): boolean;
}

export interface WebSearchNodeDependencies {
  searchProvider: SearchProvider;
  embeddingClient: EmbeddingClient;
  webDocumentStore: WebDocumentStore;
  webSourcePolicy: WebSourcePolicy;
  fetchPageText?: (url: string) => Promise<string>;
  now?: () => Date;
  createId?: () => string;
  ttlDays?: number;
}

export function extractReadableText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitIntoChunks(
  text: string,
  chunkSize = defaultChunkSize,
  overlap = defaultChunkOverlap,
): string[] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError('chunkSize must be a positive integer');
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new RangeError('overlap must be a non-negative integer smaller than chunkSize');
  }

  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += chunkSize - overlap) {
    const chunk = text.slice(start, start + chunkSize).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

export function createWebSearchNode(
  {
    searchProvider,
    embeddingClient,
    webDocumentStore,
    webSourcePolicy,
    fetchPageText = fetchReadablePageText,
    now = () => new Date(),
    createId = () => crypto.randomUUID(),
    ttlDays = defaultTtlDays,
  }: WebSearchNodeDependencies,
): (state: WebSearchState) => Promise<void> {
  if (!Number.isInteger(ttlDays) || ttlDays < 1) {
    throw new RangeError('ttlDays must be a positive integer');
  }

  return async ({ question, missingAspects }) => {
    const queries = missingAspects.length > 0
      ? missingAspects.map((aspect) => `${question} ${aspect}`)
      : [question];

    for (const query of queries) {
      const results = await searchProvider.search(query);
      for (const result of results.slice(0, defaultResultLimit)) {
        if (!webSourcePolicy.allows(result.url)) continue;

        let text: string;
        try {
          text = await fetchPageText(result.url);
        } catch {
          // A failed page is non-fatal: try the remaining search results.
          continue;
        }

        const chunks = splitIntoChunks(text);
        const embeddings = await embeddingClient.embed(chunks);

        if (embeddings.length !== chunks.length) {
          throw new Error('Embedding client returned a different number of embeddings than web chunks');
        }

        const fetchedAt = now();
        const expiresAt = new Date(fetchedAt);
        expiresAt.setUTCDate(expiresAt.getUTCDate() + ttlDays);

        for (const [index, content] of chunks.entries()) {
          const embedding = embeddings[index];
          if (!embedding) {
            throw new Error('Embedding client returned no embedding for a web chunk');
          }

          await webDocumentStore.insert({
            id: createId(),
            query,
            title: result.title,
            content,
            sourceUrl: result.url,
            fetchedAt,
            expiresAt,
            embedding,
          });
        }
      }
    }
  };
}

export async function fetchReadablePageText(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`Web page fetch failed with status ${response.status}`);
  }
  return extractReadableText(await response.text());
}
