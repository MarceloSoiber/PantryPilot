import { z } from 'zod';

export const embeddingDimensions = 768;

export interface EmbeddingClient {
  embed(texts: readonly string[]): Promise<readonly number[][]>;
}

interface LmStudioEmbeddingClientOptions {
  baseUrl: string;
  model: string;
  fetchImplementation?: typeof fetch;
}

const embeddingResponseSchema = z.object({
  data: z.array(z.object({ embedding: z.array(z.number().finite()) })),
});

export function createLmStudioEmbeddingClient({
  baseUrl,
  model,
  fetchImplementation = globalThis.fetch,
}: LmStudioEmbeddingClientOptions): EmbeddingClient {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/embeddings`;

  return {
    async embed(texts) {
      if (texts.length === 0) return [];

      const response = await fetchImplementation(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: texts }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio embeddings request failed: ${response.status}`);
      }

      const payload = embeddingResponseSchema.parse(await response.json());
      if (payload.data.length !== texts.length) {
        throw new Error('LM Studio returned a different number of embeddings than inputs');
      }

      return payload.data.map(({ embedding }, index) => {
        if (embedding.length !== embeddingDimensions) {
          throw new Error(
            `Embedding ${index} has ${embedding.length} dimensions; expected ${embeddingDimensions}`,
          );
        }
        return embedding;
      });
    },
  };
}
