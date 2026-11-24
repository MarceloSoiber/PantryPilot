import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { readSeedDocuments } from '../src/seed/corpus.js';
import { embeddingDimensions, type EmbeddingClient } from '../src/seed/embeddings.js';
import { embedInBatches } from '../src/seed/run.js';

test('maps the licensed corpus into traceable retrieval documents', async () => {
  const documents = await readSeedDocuments(resolve(process.cwd(), '../../data/corpus'));
  assert.equal(documents.length, 100);
  assert.equal(documents[0]?.id, 'plwb:6384:en:0');
  assert.equal(documents[0]?.language, 'en');
  assert.match(documents[0]?.content ?? '', /^Vinaigrette dressing/);
  assert.equal(documents[0]?.sourceLicense, 'CC-BY-SA-4.0');
  assert.equal(documents[0]?.relevantTemperaturesC, null);
});

test('requests embeddings in deterministic batches of ten', async () => {
  const calls: string[][] = [];
  const fakeClient: EmbeddingClient = {
    async embed(texts) {
      calls.push([...texts]);
      return texts.map(() => Array.from({ length: embeddingDimensions }, () => 0));
    },
  };
  const documents = Array.from({ length: 21 }, (_, index) => ({ content: `recipe ${index}` }));
  const embeddings = await embedInBatches(documents, fakeClient);
  assert.deepEqual(calls.map((batch) => batch.length), [10, 10, 1]);
  assert.equal(embeddings.length, 21);
  assert.equal(embeddings[0]?.length, embeddingDimensions);
});
