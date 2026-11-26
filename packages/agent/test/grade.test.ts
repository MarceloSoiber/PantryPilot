import assert from 'node:assert/strict';
import test from 'node:test';
import { ZodError } from 'zod';
import {
  createGradeNode,
  gradeResultSchema,
  type StructuredLlmClient,
} from '../src/nodes/grade.js';
import { gradeSystemPrompt } from '../src/prompts/grade.js';

test('grade node asks the injected LLM for structured culinary coverage', async () => {
  const requests: Parameters<StructuredLlmClient['generateObject']>[0][] = [];
  const node = createGradeNode({
    llmClient: {
      async generateObject(request) {
        requests.push(request);
        return { sufficient: true, missingAspects: [] };
      },
    },
  });

  const result = await node({
    question: 'How do I cook chickpeas safely?',
    documents: [{
      title: 'Quick chickpeas',
      content: 'Simmer cooked chickpeas until hot throughout.',
      sourceName: 'PantryPilot corpus',
    }],
  });

  assert.deepEqual(result, { sufficient: true, missingAspects: [] });
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.schema, gradeResultSchema);
  assert.equal(requests[0]?.system, gradeSystemPrompt);
  assert.match(requests[0]?.prompt ?? '', /How do I cook chickpeas safely\?/);
  assert.match(requests[0]?.prompt ?? '', /Quick chickpeas/);
});

test('grade node preserves missing culinary evidence returned by the LLM', async () => {
  const node = createGradeNode({
    llmClient: {
      async generateObject() {
        return {
          sufficient: false,
          missingAspects: ['A source describing a lactose-free substitution'],
        };
      },
    },
  });

  const result = await node({ question: 'Can I make this lactose-free?', documents: [] });

  assert.deepEqual(result, {
    sufficient: false,
    missingAspects: ['A source describing a lactose-free substitution'],
  });
});

test('grade node rejects an invalid structured LLM response', async () => {
  const node = createGradeNode({
    llmClient: { async generateObject() { return { sufficient: 'yes' }; } },
  });

  await assert.rejects(
    () => node({ question: 'What can I make?', documents: [] }),
    ZodError,
  );
});
