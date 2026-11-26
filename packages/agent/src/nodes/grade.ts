import { z } from 'zod';
import type { QuestionState } from './retrieve.js';
import {
  createGradePrompt,
  gradeSystemPrompt,
  type GradeDocument,
} from '../prompts/grade.js';

export const gradeResultSchema = z.object({
  sufficient: z.boolean(),
  missingAspects: z.array(z.string()),
});

export type GradeResult = z.infer<typeof gradeResultSchema>;

export interface GradeState extends QuestionState {
  documents: readonly GradeDocument[];
}

export interface StructuredLlmClient {
  generateObject(input: {
    schema: typeof gradeResultSchema;
    system: string;
    prompt: string;
  }): Promise<unknown>;
}

export interface GradeNodeDependencies {
  llmClient: StructuredLlmClient;
}

/**
 * Creates the graph node that checks whether retrieved culinary evidence covers
 * the question. The LLM is injected so the policy can be tested with a fake.
 */
export function createGradeNode(
  { llmClient }: GradeNodeDependencies,
): (state: GradeState) => Promise<GradeResult> {
  return async (state) => gradeResultSchema.parse(await llmClient.generateObject({
    schema: gradeResultSchema,
    system: gradeSystemPrompt,
    prompt: createGradePrompt(state),
  }));
}
