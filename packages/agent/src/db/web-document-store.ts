import { and, eq } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { WebDocumentStore, WebPageToStore } from '../nodes/web-search.js';
import type { WebDocumentsTable } from './retrieve-similar.js';

export interface WebDocumentStoreDependencies {
  database: PgDatabase<PgQueryResultHKT>;
  webDocuments: WebDocumentsTable;
}

/**
 * Persists web enrichment with a page-level freshness policy. A matching hash
 * only refreshes dates; a changed page atomically replaces all of its chunks.
 */
export function createWebDocumentStore(
  { database, webDocuments }: WebDocumentStoreDependencies,
): WebDocumentStore {
  return {
    async refreshIfUnchanged({ sourceUrl, contentHash, fetchedAt, expiresAt }) {
      const updated = await database
        .update(webDocuments)
        .set({ fetchedAt, expiresAt })
        .where(and(
          eq(webDocuments.sourceUrl, sourceUrl),
          eq(webDocuments.contentHash, contentHash),
        ))
        .returning({ id: webDocuments.id });

      return updated.length > 0;
    },

    async replacePage(page) {
      await database.transaction(async (transaction) => {
        await transaction.delete(webDocuments).where(eq(webDocuments.sourceUrl, page.sourceUrl));
        await transaction.insert(webDocuments).values(page.documents.map((document) => ({
          id: document.id,
          query: page.query,
          title: page.title,
          content: document.content,
          sourceUrl: page.sourceUrl,
          contentHash: page.contentHash,
          fetchedAt: page.fetchedAt,
          expiresAt: page.expiresAt,
          embedding: [...document.embedding],
        })));
      });
    },
  };
}
