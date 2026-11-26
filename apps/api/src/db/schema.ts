import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from 'drizzle-orm/pg-core';

/**
 * Trechos recuperáveis do corpus culinário. Cada receita pode produzir vários
 * documentos, um por idioma e posição de chunk, preservando sua proveniência.
 */
export const corpusDocuments = pgTable(
  'corpus_documents',
  {
    id: text('id').primaryKey(),
    recipeId: text('recipe_id').notNull(),
    language: text('language').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    ingredients: jsonb('ingredients').notNull(),
    servings: integer('servings'),
    prepMinutes: integer('prep_minutes'),
    cookMinutes: integer('cook_minutes'),
    dietaryTags: text('dietary_tags').array().notNull(),
    allergens: text('allergens').array().notNull(),
    relevantTemperaturesC: jsonb('relevant_temperatures_c'),
    sourceName: text('source_name').notNull(),
    sourceTitle: text('source_title').notNull(),
    sourceAuthor: text('source_author'),
    sourceUrl: text('source_url').notNull(),
    sourceLicense: text('source_license').notNull(),
    sourceAccessedAt: timestamp('source_accessed_at', {
      withTimezone: true,
    }).notNull(),
    sourceRevision: integer('source_revision'),
    embedding: vector('embedding', { dimensions: 768 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('corpus_documents_recipe_language_chunk_unique').on(
      table.recipeId,
      table.language,
      table.chunkIndex,
    ),
    index('corpus_documents_embedding_hnsw').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  ],
);

/**
 * Temporary, expiring documents recovered from web search. They remain separate
 * from the curated corpus because their source policy and lifetime differ.
 */
export const webDocuments = pgTable(
  'web_documents',
  {
    id: text('id').primaryKey(),
    query: text('query').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    sourceUrl: text('source_url').notNull(),
    contentHash: text('content_hash'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    embedding: vector('embedding', { dimensions: 768 }).notNull(),
  },
  (table) => [
    index('web_documents_expires_at').on(table.expiresAt),
    index('web_documents_embedding_hnsw').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  ],
);
