import Fastify from 'fastify';
import {
  healthResponseSchema,
  type HealthResponse,
} from '@pantry-pilot/contracts';
import type { DatabaseHealthChecker } from './database.js';

export function buildApp(database: DatabaseHealthChecker) {
  const app = Fastify({ logger: true });

  app.get('/api/health', async (_request, reply): Promise<HealthResponse> => {
    reply.header('Cache-Control', 'no-store');
    try {
      await database.check();
      return healthResponseSchema.parse({ status: 'ok' });
    } catch (error) {
      _request.log.warn({ err: error }, 'PostgreSQL health check failed');
      reply.code(503);
      return healthResponseSchema.parse({ status: 'degraded' });
    }
  });

  return app;
}
