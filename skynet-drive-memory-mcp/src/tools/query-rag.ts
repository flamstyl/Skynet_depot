import { RagEngine } from '../lib/rag.js';
import { logger } from '../lib/logger.js';
import { QueryRagSchema, type QueryRagInput } from '../schemas/drive.js';

export async function queryRag(ragEngine: RagEngine, input: unknown) {
  const params = QueryRagSchema.parse(input);

  logger.info('Executing RAG query', { query: params.query });

  const { results, totalScanned, duration } = await ragEngine.query(params.query, {
    topK: params.topK,
    threshold: params.threshold,
    path: params.path,
    mimeType: params.mimeType,
  });

  const response = {
    results,
    query: params.query,
    totalScanned,
    duration,
  };

  logger.info('RAG query completed', {
    query: params.query,
    resultsCount: results.length,
    duration,
  });

  return response;
}
