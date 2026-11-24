import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { corpusDocuments } from '../db/schema.js';
import { readSeedDocuments } from './corpus.js';
import { createLmStudioEmbeddingClient, type EmbeddingClient } from './embeddings.js';

const batchSize = 10;

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../../.env'),
});

export async function embedInBatches(
  documents: readonly { content: string }[],
  embeddingClient: EmbeddingClient,
): Promise<readonly number[][]> {
  const embeddings: number[][] = [];
  for (let start = 0; start < documents.length; start += batchSize) {
    const batch = documents.slice(start, start + batchSize);
    embeddings.push(...await embeddingClient.embed(batch.map(({ content }) => content)));
  }
  return embeddings;
}

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL must be configured');

  const documents = await readSeedDocuments(resolve(process.cwd(), '../../data/corpus'));
  const embeddings = await embedInBatches(documents, createLmStudioEmbeddingClient({
    baseUrl: process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1',
    model: process.env.LM_STUDIO_EMBEDDING_MODEL ?? 'text-embedding-embeddinggemma-300m-qat',
  }));

  const pool = new Pool({ connectionString: databaseUrl });
  const database = drizzle({ client: pool });
  try {
    for (const [index, document] of documents.entries()) {
      await database.insert(corpusDocuments).values({ ...document, embedding: embeddings[index] })
        .onConflictDoUpdate({
          target: [corpusDocuments.recipeId, corpusDocuments.language, corpusDocuments.chunkIndex],
          set: {
            title: document.title, content: document.content, ingredients: document.ingredients,
            servings: document.servings, prepMinutes: document.prepMinutes, cookMinutes: document.cookMinutes,
            dietaryTags: document.dietaryTags, allergens: document.allergens,
            relevantTemperaturesC: document.relevantTemperaturesC, sourceName: document.sourceName,
            sourceTitle: document.sourceTitle, sourceAuthor: document.sourceAuthor,
            sourceUrl: document.sourceUrl, sourceLicense: document.sourceLicense,
            sourceAccessedAt: document.sourceAccessedAt, sourceRevision: document.sourceRevision,
            embedding: embeddings[index],
          },
        });
    }
  } finally {
    await pool.end();
  }
  console.log(`Seeded ${documents.length} corpus documents.`);
}

if (import.meta.url === `file://${process.argv[1]}`) void run();
