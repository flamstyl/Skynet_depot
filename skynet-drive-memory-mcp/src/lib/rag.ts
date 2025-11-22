import { GoogleDriveClient } from './drive-client.js';
import { Embedder } from './embedder.js';
import { EmbeddingCache } from './cache.js';
import { logger } from './logger.js';
import { config } from '../config.js';
import { drive_v3 } from 'googleapis';

export interface RagResult {
  path: string;
  fileId: string;
  score: number;
  snippet: string;
  metadata: {
    mimeType: string;
    size: number;
    modifiedTime: string;
  };
}

export class RagEngine {
  private driveClient: GoogleDriveClient;
  private embedder: Embedder;
  private cache: EmbeddingCache;

  constructor(driveClient: GoogleDriveClient, embedder: Embedder, cache: EmbeddingCache) {
    this.driveClient = driveClient;
    this.embedder = embedder;
    this.cache = cache;
  }

  async query(
    query: string,
    options: {
      topK?: number;
      threshold?: number;
      path?: string;
      mimeType?: string;
    }
  ): Promise<{ results: RagResult[]; totalScanned: number; duration: number }> {
    const startTime = Date.now();

    logger.info('RAG query started', { query, options });

    // Générer l'embedding de la query
    const queryEmbedding = await this.embedder.generateEmbedding(query);

    // Lister les fichiers depuis Drive
    const files = await this.driveClient.listFiles({
      path: options.path,
      mimeType: options.mimeType,
      maxResults: config.maxFilesToScan,
    });

    logger.info('Files fetched for RAG', { count: files.length });

    // Calculer les similarités
    const results: RagResult[] = [];

    for (const file of files) {
      try {
        // Ignorer les fichiers non textuels
        const mimeType = file.mimeType || '';
        if (!this.isTextFile(mimeType)) {
          continue;
        }

        let content: string;
        let embedding: number[];

        // Vérifier le cache
        const cached = config.cacheEmbeddings
          ? this.cache.get(file.id!, file.modifiedTime!)
          : null;

        if (cached) {
          content = cached.content;
          embedding = cached.embedding;
          logger.debug('Using cached embedding', { fileId: file.id, fileName: file.name });
        } else {
          // Lire le fichier
          content = await this.driveClient.readFile(file.id!);

          // Limiter la longueur pour l'embedding (garder les 1000 premiers caractères)
          const textForEmbedding = content.substring(0, 1000);

          // Générer l'embedding
          embedding = await this.embedder.generateEmbedding(textForEmbedding);

          // Sauvegarder dans le cache
          if (config.cacheEmbeddings) {
            this.cache.set({
              fileId: file.id!,
              fileName: file.name!,
              content,
              embedding,
              modifiedTime: file.modifiedTime!,
            });
          }
        }

        // Calculer la similarité
        const score = this.embedder.cosineSimilarity(queryEmbedding, embedding);

        // Filtrer par seuil
        if (score >= (options.threshold || 0.5)) {
          // Extraire un snippet
          const snippet = this.extractSnippet(content, query);

          results.push({
            path: file.name!,
            fileId: file.id!,
            score,
            snippet,
            metadata: {
              mimeType: file.mimeType!,
              size: parseInt(file.size || '0', 10),
              modifiedTime: file.modifiedTime!,
            },
          });
        }
      } catch (error: any) {
        logger.warn('Failed to process file for RAG', { fileId: file.id, error: error.message });
      }
    }

    // Trier par score décroissant
    results.sort((a, b) => b.score - a.score);

    // Limiter aux top K
    const topResults = results.slice(0, options.topK || 3);

    // Sauvegarder le cache
    if (config.cacheEmbeddings) {
      await this.cache.save();
    }

    const duration = Date.now() - startTime;

    logger.info('RAG query completed', {
      query,
      results: topResults.length,
      totalScanned: files.length,
      duration,
    });

    return {
      results: topResults,
      totalScanned: files.length,
      duration,
    };
  }

  private isTextFile(mimeType: string): boolean {
    return (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/vnd.google-apps.document' ||
      mimeType === 'application/vnd.google-apps.spreadsheet'
    );
  }

  private extractSnippet(content: string, query: string, contextLength = 200): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    const index = contentLower.indexOf(queryLower);

    if (index !== -1) {
      const start = Math.max(0, index - contextLength / 2);
      const end = Math.min(content.length, index + queryLower.length + contextLength / 2);

      let snippet = content.substring(start, end);

      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';

      return snippet;
    }

    // Si pas de match exact, retourner le début
    return content.substring(0, contextLength) + '...';
  }
}
