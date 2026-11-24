export interface QuestionState {
  question: string;
}

export interface EmbeddingClient {
  embed(texts: readonly string[]): Promise<readonly number[][]>;
}

export type SimilarDocumentSearch<TDocument> = (
  embedding: readonly number[],
  limit: number,
) => Promise<readonly TDocument[]>;

export interface RetrieveNodeDependencies<TDocument> {
  embeddingClient: EmbeddingClient;
  searchSimilar: SimilarDocumentSearch<TDocument>;
  topK?: number;
}

export interface RetrievedDocumentsState<TDocument> {
  documents: readonly TDocument[];
}

/**
 * Creates the graph node that turns the current question into a vector search.
 * Network and persistence dependencies are supplied by the composition root so
 * this node remains deterministic when tested with fakes.
 */
export function createRetrieveNode<TState extends QuestionState, TDocument>(
  { embeddingClient, searchSimilar, topK = 5 }: RetrieveNodeDependencies<TDocument>,
): (state: TState) => Promise<RetrievedDocumentsState<TDocument>> {
  if (!Number.isInteger(topK) || topK < 1) {
    throw new RangeError('topK must be a positive integer');
  }

  return async (state) => {
    const embeddings = await embeddingClient.embed([state.question]);
    const [questionEmbedding] = embeddings;

    if (!questionEmbedding) {
      throw new Error('Embedding client returned no embedding for the question');
    }

    return { documents: await searchSimilar(questionEmbedding, topK) };
  };
}
