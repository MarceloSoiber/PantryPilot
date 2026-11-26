import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWebSearchNode,
  extractReadableText,
  splitIntoChunks,
  type WebPageToStore,
} from '../src/nodes/web-search.js';

test('web search uses one query per missing aspect and stores chunk embeddings', async () => {
  const queries: string[] = [];
  const saved: WebPageToStore[] = [];
  const node = createWebSearchNode({
    searchProvider: {
      async search(query) {
        queries.push(query);
        return [
          { title: 'Useful source', snippet: '...', url: 'https://example.com/useful' },
          { title: 'Ignored source', snippet: '...', url: 'https://example.com/ignored' },
        ];
      },
    },
    embeddingClient: { async embed(texts) { return texts.map((_, index) => [index + 1]); } },
    webDocumentStore: {
      async refreshIfUnchanged() { return false; },
      async replacePage(page) { saved.push(page); },
    },
    webSourcePolicy: { allows: () => true },
    async fetchPageText(url) {
      if (url.endsWith('ignored')) throw new Error('unavailable');
      return 'A'.repeat(1_050);
    },
    now: () => new Date('2026-11-26T12:00:00.000Z'),
    createId: (() => { let next = 0; return () => `web-${++next}`; })(),
  });

  await node({ question: 'How do I cook chickpeas?', missingAspects: ['safe simmering'] });

  assert.deepEqual(queries, ['How do I cook chickpeas? safe simmering']);
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0]?.documents.map(({ id, query, title, sourceUrl }) => ({
    id, query, title, sourceUrl,
  })), [
    {
      id: 'web-1', query: 'How do I cook chickpeas? safe simmering', title: 'Useful source',
      sourceUrl: 'https://example.com/useful',
    },
    {
      id: 'web-2', query: 'How do I cook chickpeas? safe simmering', title: 'Useful source',
      sourceUrl: 'https://example.com/useful',
    },
  ]);
  assert.equal(saved[0]?.documents[0]?.content.length, 1_000);
  assert.equal(saved[0]?.documents[1]?.content.length, 150);
  assert.deepEqual(saved[0]?.documents.map(({ embedding }) => embedding), [[1], [2]]);
  assert.equal(saved[0]?.expiresAt.toISOString(), '2027-02-24T12:00:00.000Z');
});

test('web search falls back to the question when no aspect is missing', async () => {
  const queries: string[] = [];
  const node = createWebSearchNode({
    searchProvider: { async search(query) { queries.push(query); return []; } },
    embeddingClient: { async embed() { return []; } },
    webDocumentStore: { async refreshIfUnchanged() { return false; }, async replacePage() {} },
    webSourcePolicy: { allows: () => true },
  });

  await node({ question: 'How do I cook rice?', missingAspects: [] });

  assert.deepEqual(queries, ['How do I cook rice?']);
});

test('readable text extraction and overlapping chunks are deterministic', () => {
  assert.equal(
    extractReadableText('<style>.hidden {}</style><p>Hello&nbsp;<b>world</b></p><script>bad()</script>'),
    'Hello world',
  );
  assert.deepEqual(splitIntoChunks('abcdefghij', 6, 2), ['abcdef', 'efghij', 'ij']);
});

test('web search does not fetch a source rejected by the persistence policy', async () => {
  let fetched = false;
  const node = createWebSearchNode({
    searchProvider: {
      async search() {
        return [{ title: 'Unapproved', snippet: '...', url: 'https://unapproved.example' }];
      },
    },
    embeddingClient: { async embed() { return []; } },
    webDocumentStore: {
      async refreshIfUnchanged() { throw new Error('must not persist'); },
      async replacePage() { throw new Error('must not persist'); },
    },
    webSourcePolicy: { allows: () => false },
    async fetchPageText() { fetched = true; return 'content'; },
  });

  await node({ question: 'question', missingAspects: [] });

  assert.equal(fetched, false);
});

test('web search renews unchanged content without creating new embeddings', async () => {
  let embedded = false;
  let replaced = false;
  const node = createWebSearchNode({
    searchProvider: {
      async search() { return [{ title: 'Stable source', snippet: '...', url: 'https://example.com/stable' }]; },
    },
    embeddingClient: { async embed() { embedded = true; return []; } },
    webDocumentStore: {
      async refreshIfUnchanged({ expiresAt }) {
        assert.equal(expiresAt.toISOString(), '2027-02-24T12:00:00.000Z');
        return true;
      },
      async replacePage() { replaced = true; },
    },
    webSourcePolicy: { allows: () => true },
    async fetchPageText() { return 'unchanged content'; },
    now: () => new Date('2026-11-26T12:00:00.000Z'),
  });

  await node({ question: 'question', missingAspects: [] });

  assert.equal(embedded, false);
  assert.equal(replaced, false);
});
