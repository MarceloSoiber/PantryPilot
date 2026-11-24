import assert from 'node:assert/strict';
import test from 'node:test';
import { createRetrieveNode } from '../src/nodes/retrieve.js';

test('retrieve node embeds the question and searches with the default top-k', async () => {
  const embeddedTexts: string[][] = [];
  const searches: Array<{ embedding: readonly number[]; limit: number }> = [];
  const node = createRetrieveNode({
    embeddingClient: {
      async embed(texts) {
        embeddedTexts.push([...texts]);
        return [[0.1, 0.2]];
      },
    },
    async searchSimilar(embedding, limit) {
      searches.push({ embedding, limit });
      return [{ id: 'recipe-1' }];
    },
  });

  const result = await node({ question: 'What can I make with chickpeas?' });

  assert.deepEqual(embeddedTexts, [['What can I make with chickpeas?']]);
  assert.deepEqual(searches, [{ embedding: [0.1, 0.2], limit: 5 }]);
  assert.deepEqual(result, { documents: [{ id: 'recipe-1' }] });
});

test('retrieve node rejects invalid top-k without invoking dependencies', () => {
  assert.throws(
    () => createRetrieveNode({
      embeddingClient: { async embed() { return [[1]]; } },
      async searchSimilar() { return []; },
      topK: 0,
    }),
    /topK must be a positive integer/,
  );
});
