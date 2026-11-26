import assert from 'node:assert/strict';
import test from 'node:test';
import { makeGoogleCustomSearchProvider } from '../src/search/google-custom-search.js';
import { createSearchProvider } from '../src/search/index.js';
import { makeSerperProvider } from '../src/search/serper.js';

test('Serper provider maps organic results and sends the expected request', async () => {
  let request: Request | undefined;
  const provider = makeSerperProvider('serper-key', async (input, init) => {
    request = new Request(input, init);
    return Response.json({
      organic: [{ title: 'Chickpea stew', snippet: 'A quick stew.', link: 'https://example.com/stew' }],
    });
  });

  const result = await provider.search('quick chickpea stew');

  assert.deepEqual(result, [{
    title: 'Chickpea stew', snippet: 'A quick stew.', url: 'https://example.com/stew',
  }]);
  assert.equal(request?.url, 'https://google.serper.dev/search');
  assert.equal(request?.method, 'POST');
  assert.equal(request?.headers.get('X-API-KEY'), 'serper-key');
  assert.deepEqual(await request?.json(), { q: 'quick chickpea stew' });
});

test('Google Custom Search provider maps items and includes query parameters', async () => {
  let request: Request | undefined;
  const provider = makeGoogleCustomSearchProvider('google-key', 'search-engine-id', async (input, init) => {
    request = new Request(input, init);
    return Response.json({
      items: [{ title: 'Tomato rice', snippet: 'One-pot rice.', link: 'https://example.com/rice' }],
    });
  });

  const result = await provider.search('tomato rice');

  assert.deepEqual(result, [{ title: 'Tomato rice', snippet: 'One-pot rice.', url: 'https://example.com/rice' }]);
  const parameters = new URL(request?.url ?? '').searchParams;
  assert.equal(parameters.get('key'), 'google-key');
  assert.equal(parameters.get('cx'), 'search-engine-id');
  assert.equal(parameters.get('q'), 'tomato rice');
});

test('search provider factory defaults to Serper and validates its key', () => {
  assert.throws(() => createSearchProvider({}), /SERPER_API_KEY is required/);
  assert.ok(createSearchProvider({ SERPER_API_KEY: 'serper-key' }));
});

test('search provider factory validates Google Custom Search configuration', () => {
  assert.throws(
    () => createSearchProvider({ SEARCH_PROVIDER: 'google-custom-search' }),
    /GOOGLE_CUSTOM_SEARCH_API_KEY is required/,
  );
  assert.throws(
    () => createSearchProvider({
      SEARCH_PROVIDER: 'google-custom-search', GOOGLE_CUSTOM_SEARCH_API_KEY: 'google-key',
    }),
    /GOOGLE_CUSTOM_SEARCH_CX is required/,
  );
  assert.ok(createSearchProvider({
    SEARCH_PROVIDER: 'google-custom-search',
    GOOGLE_CUSTOM_SEARCH_API_KEY: 'google-key',
    GOOGLE_CUSTOM_SEARCH_CX: 'search-engine-id',
  }));
});

test('search provider factory rejects an unknown provider', () => {
  assert.throws(
    () => createSearchProvider({ SEARCH_PROVIDER: 'unknown' }),
    /Unknown SEARCH_PROVIDER "unknown"/,
  );
});
