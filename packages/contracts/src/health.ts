import { z } from 'zod';

export const healthStatusSchema = z.enum(['ok', 'degraded']);

export const healthResponseSchema = z.object({
  status: healthStatusSchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
