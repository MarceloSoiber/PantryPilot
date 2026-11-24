import 'dotenv/config';
import { Pool } from 'pg';
import { buildApp } from './app.js';
import { createPostgresHealthChecker } from './database.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured');
}

const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? 1_000);
const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: timeoutMs,
  statement_timeout: timeoutMs,
});
const app = buildApp(createPostgresHealthChecker(pool));

async function start() {
  try {
    await app.listen({
      host: process.env.HOST ?? '0.0.0.0',
      port: Number(process.env.PORT ?? 3000),
    });
  } catch (error) {
    app.log.error(error);
    await pool.end();
    process.exit(1);
  }
}

void start();
