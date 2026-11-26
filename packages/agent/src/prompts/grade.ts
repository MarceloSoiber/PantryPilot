export interface GradeDocument {
  title: string;
  content: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface GradePromptInput {
  question: string;
  documents: readonly GradeDocument[];
}

export const gradeSystemPrompt = `You evaluate whether a curated culinary corpus contains enough evidence to answer a user's question.

Only use the supplied documents. Mark the context insufficient when it does not support a reliable answer, when it lacks a source for a factual claim, or when the question asks for medical or nutritional advice, an allergy or cross-contamination guarantee, or a food-safety determination specific to a person's situation. In missingAspects, name each concrete piece of evidence that is absent. Do not invent facts or sources.`;

/** Builds the user message for the LLM's structured coverage assessment. */
export function createGradePrompt({ question, documents }: GradePromptInput): string {
  return [
    `Question:\n${question}`,
    `Retrieved culinary documents:\n${JSON.stringify(documents, null, 2)}`,
    'Decide whether these documents are sufficient to answer the question.',
  ].join('\n\n');
}
