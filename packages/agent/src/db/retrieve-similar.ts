import { asc, cosineDistance } from 'drizzle-orm';
import type { AnyPgColumn, PgDatabase, PgQueryResultHKT, PgTable } from 'drizzle-orm/pg-core';

export interface RetrievedCorpusDocument {
  id: string;
  recipeId: string;
  language: string;
  chunkIndex: number;
  title: string;
  content: string;
  ingredients: unknown;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  dietaryTags: string[];
  allergens: string[];
  relevantTemperaturesC: unknown;
  sourceName: string;
  sourceTitle: string;
  sourceAuthor: string | null;
  sourceUrl: string;
  sourceLicense: string;
  sourceAccessedAt: Date;
  sourceRevision: number | null;
  distance: number;
}

/** The subset of the corpus schema required for retrieval. */
export type CorpusDocumentsTable = PgTable & {
  id: AnyPgColumn;
  recipeId: AnyPgColumn;
  language: AnyPgColumn;
  chunkIndex: AnyPgColumn;
  title: AnyPgColumn;
  content: AnyPgColumn;
  ingredients: AnyPgColumn;
  servings: AnyPgColumn;
  prepMinutes: AnyPgColumn;
  cookMinutes: AnyPgColumn;
  dietaryTags: AnyPgColumn;
  allergens: AnyPgColumn;
  relevantTemperaturesC: AnyPgColumn;
  sourceName: AnyPgColumn;
  sourceTitle: AnyPgColumn;
  sourceAuthor: AnyPgColumn;
  sourceUrl: AnyPgColumn;
  sourceLicense: AnyPgColumn;
  sourceAccessedAt: AnyPgColumn;
  sourceRevision: AnyPgColumn;
  embedding: AnyPgColumn;
};

export interface RetrieveSimilarDependencies {
  database: PgDatabase<PgQueryResultHKT>;
  corpusDocuments: CorpusDocumentsTable;
}

/**
 * Binds a Drizzle database and the application-owned corpus table to a
 * similarity search. pgvector's cosine-distance operator is emitted through
 * Drizzle's `cosineDistance` helper and sorted ascending (nearest first).
 */
export function createRetrieveSimilar(
  { database, corpusDocuments }: RetrieveSimilarDependencies,
): (embedding: readonly number[], limit: number) => Promise<readonly RetrievedCorpusDocument[]> {
  return async (embedding, limit) => {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new RangeError('limit must be a positive integer');
    }

    const distance = cosineDistance(corpusDocuments.embedding, [...embedding]);
    const rows = await database
      .select({
        id: corpusDocuments.id,
        recipeId: corpusDocuments.recipeId,
        language: corpusDocuments.language,
        chunkIndex: corpusDocuments.chunkIndex,
        title: corpusDocuments.title,
        content: corpusDocuments.content,
        ingredients: corpusDocuments.ingredients,
        servings: corpusDocuments.servings,
        prepMinutes: corpusDocuments.prepMinutes,
        cookMinutes: corpusDocuments.cookMinutes,
        dietaryTags: corpusDocuments.dietaryTags,
        allergens: corpusDocuments.allergens,
        relevantTemperaturesC: corpusDocuments.relevantTemperaturesC,
        sourceName: corpusDocuments.sourceName,
        sourceTitle: corpusDocuments.sourceTitle,
        sourceAuthor: corpusDocuments.sourceAuthor,
        sourceUrl: corpusDocuments.sourceUrl,
        sourceLicense: corpusDocuments.sourceLicense,
        sourceAccessedAt: corpusDocuments.sourceAccessedAt,
        sourceRevision: corpusDocuments.sourceRevision,
        distance,
      })
      .from(corpusDocuments)
      .orderBy(asc(distance))
      .limit(limit);

    return rows as unknown as RetrievedCorpusDocument[];
  };
}
