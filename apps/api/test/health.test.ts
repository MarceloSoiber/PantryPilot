import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';

test('GET /api/health returns ok when PostgreSQL is reachable', async () => {
  const app = buildApp({ check: async () => undefined });

  const response = await app.inject({ method: 'GET', url: '/api/health' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });
  assert.equal(response.headers['cache-control'], 'no-store');
  await app.close();
});

test('GET /api/health reports degraded when PostgreSQL is unavailable', async () => {
  const app = buildApp({
    check: async () => Promise.reject(new Error('connection refused')),
  });

  const response = await app.inject({ method: 'GET', url: '/api/health' });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), { status: 'degraded' });
  await app.close();
});
