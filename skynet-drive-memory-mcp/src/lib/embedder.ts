import { pipeline } from '@xenova/transformers';
import { config } from '../config.js';
import { logger } from './logger.js';
import { ExecutionError } from './errors.js';

export class Embedder {
  private extractor: any = null;

  async initialize() {
    if (config.embeddingMode === 'local') {
      logger.info('Initializing local embedding model...');

      try {
        // Utiliser le modèle par défaut de transformers.js
        this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        logger.info('Local embedding model initialized');
      } catch (error: any) {
        logger.error('Failed to initialize local embedding model', { error: error.message });
        throw new ExecutionError(`Failed to initialize embeddings: ${error.message}`);
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (config.embeddingMode === 'local') {
      if (!this.extractor) {
        await this.initialize();
      }

      try {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
      } catch (error: any) {
        logger.error('Failed to generate local embedding', { error: error.message });
        throw new ExecutionError(`Failed to generate embedding: ${error.message}`);
      }
    } else if (config.embeddingMode === 'cloudflare' && config.cloudflare) {
      // Cloudflare Workers AI
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/ai/run/${config.cloudflare.model}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.cloudflare.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
        }

        return data.result.data[0];
      } catch (error: any) {
        logger.error('Failed to generate Cloudflare embedding', { error: error.message });
        throw new ExecutionError(`Failed to generate embedding: ${error.message}`);
      }
    }

    throw new ExecutionError('No embedding mode configured');
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
