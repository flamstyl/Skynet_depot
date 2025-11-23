import OpenAI from 'openai';
import { config } from '../config/default.js';
import { logger } from '../utils/logger.js';

/**
 * Service LM Studio (via API OpenAI-compatible)
 */
export class LMStudioService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: config.lmstudioBaseUrl,
      apiKey: 'lm-studio', // API key non requise pour LM Studio local
    });

    logger.info(`LM Studio service initialisé : ${config.lmstudioBaseUrl}`);
  }

  /**
   * Vérifie que LM Studio est accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const models = await this.client.models.list();
      return models.data.length > 0;
    } catch (error: any) {
      logger.error('LM Studio non disponible', { error: error.message });
      return false;
    }
  }

  /**
   * Liste les modèles disponibles
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      return response.data.map((m) => m.id);
    } catch (error: any) {
      logger.error('Erreur lors de la liste des modèles', { error: error.message });
      throw new Error(`LM Studio error: ${error.message}`);
    }
  }

  /**
   * Appelle LM Studio avec un prompt
   */
  async complete(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: config.lmstudioModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      });

      const content = response.choices[0]?.message?.content || '';
      logger.debug('LM Studio response reçue', { length: content.length });

      return content;
    } catch (error: any) {
      logger.error('Erreur LM Studio completion', { error: error.message });
      throw new Error(`LM Studio error: ${error.message}`);
    }
  }

  /**
   * Helper pour parser JSON depuis LM Studio
   */
  async completeJSON<T = any>(prompt: string): Promise<T> {
    const response = await this.complete(prompt, { jsonMode: true });

    try {
      return JSON.parse(response) as T;
    } catch (error) {
      logger.error('Erreur parsing JSON depuis LM Studio', { response });
      throw new Error('LM Studio n\'a pas retourné du JSON valide');
    }
  }
}

export const lmstudioService = new LMStudioService();
