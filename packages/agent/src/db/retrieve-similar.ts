import { and, asc, cosineDistance, gt } from 'drizzle-orm';
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

export interface RetrievedWebDocument {
  id: string;
  query: string;
  title: string;
  content: string;
  sourceUrl: string;
  fetchedAt: Date;
  expiresAt: Date;
  distance: number;
}

export type RetrievedSimilarDocument = RetrievedCorpusDocument | RetrievedWebDocument;

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

/** The subset of the temporary web-enrichment schema required for retrieval. */
export type WebDocumentsTable = PgTable & {
  id: AnyPgColumn;
  query: AnyPgColumn;
  title: AnyPgColumn;
  content: AnyPgColumn;
  sourceUrl: AnyPgColumn;
  contentHash: AnyPgColumn;
  fetchedAt: AnyPgColumn;
  expiresAt: AnyPgColumn;
  embedding: AnyPgColumn;
};

export interface RetrieveSimilarDependencies {
  database: PgDatabase<PgQueryResultHKT>;
  corpusDocuments: CorpusDocumentsTable;
  webDocuments?: WebDocumentsTable;
  now?: () => Date;
}

/**
 * Binds a Drizzle database and the application-owned corpus table to a
 * similarity search. pgvector's cosine-distance operator is emitted through
 * Drizzle's `cosineDistance` helper and sorted ascending (nearest first).
 */
export function createRetrieveSimilar(
  { database, corpusDocuments, webDocuments, now = () => new Date() }: RetrieveSimilarDependencies,
): (embedding: readonly number[], limit: number) => Promise<readonly RetrievedSimilarDocument[]> {
  return async (embedding, limit) => {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new RangeError('limit must be a positive integer');
    }

    const corpusDistance = cosineDistance(corpusDocuments.embedding, [...embedding]);
    const corpusRows = await database
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
        distance: corpusDistance,
      })
      .from(corpusDocuments)
      .orderBy(asc(corpusDistance))
      .limit(limit);

    if (!webDocuments) {
      return corpusRows as unknown as RetrievedCorpusDocument[];
    }

    const webDistance = cosineDistance(webDocuments.embedding, [...embedding]);
    const webRows = await database
      .select({
        id: webDocuments.id,
        query: webDocuments.query,
        title: webDocuments.title,
        content: webDocuments.content,
        sourceUrl: webDocuments.sourceUrl,
        fetchedAt: webDocuments.fetchedAt,
        expiresAt: webDocuments.expiresAt,
        distance: webDistance,
      })
      .from(webDocuments)
      .where(and(gt(webDocuments.expiresAt, now())))
      .orderBy(asc(webDistance))
      .limit(limit);

    return [...(corpusRows as unknown as RetrievedCorpusDocument[]),
      ...(webRows as unknown as RetrievedWebDocument[])]
      .sort((left, right) => left.distance - right.distance)
      .slice(0, limit);
  };
}
