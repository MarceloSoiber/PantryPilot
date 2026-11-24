import type { Pool } from 'pg';

export interface DatabaseHealthChecker {
  check(): Promise<void>;
}

export function createPostgresHealthChecker(
  pool: Pool,
): DatabaseHealthChecker {
  return {
    async check(): Promise<void> {
      await pool.query('SELECT 1');
    },
  };
}
