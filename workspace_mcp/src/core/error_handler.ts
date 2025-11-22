/**
 * Gestion centralisée des erreurs MCP
 */

import { MCPError, MCPToolResult } from '../types/tools.js';
import { log } from './logger.js';

export class MCPErrorHandler {
  /**
   * Codes d'erreur standard
   */
  static readonly CODES = {
    // Erreurs client (4xx)
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_PARAMETER: 'MISSING_PARAMETER',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',

    // Erreurs serveur (5xx)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    TIMEOUT: 'TIMEOUT',

    // Erreurs externes
    DOCKER_ERROR: 'DOCKER_ERROR',
    GIT_ERROR: 'GIT_ERROR',
    FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
    COMMAND_FAILED: 'COMMAND_FAILED'
  };

  /**
   * Créer une erreur MCP
   */
  static createError(code: string, message: string, details?: any): MCPError {
    return {
      code,
      message,
      details
    };
  }

  /**
   * Formater une erreur en réponse MCP
   */
  static formatErrorResponse(error: Error | MCPError | string): MCPToolResult {
    const timestamp = new Date().toISOString();

    if (typeof error === 'string') {
      return {
        success: false,
        error,
        timestamp
      };
    }

    if ('code' in error && error.code) {
      // C'est une MCPError
      return {
        success: false,
        error: `[${error.code}] ${error.message}`,
        data: error.details,
        timestamp
      };
    }

    // Erreur standard JavaScript
    return {
      success: false,
      error: error.message || 'Une erreur inconnue est survenue',
      timestamp
    };
  }

  /**
   * Wrapper pour exécuter un tool avec gestion d'erreur automatique
   */
  static async executeTool<T>(
    toolName: string,
    fn: () => Promise<T>
  ): Promise<MCPToolResult> {
    const startTime = Date.now();

    try {
      log.toolCall(toolName, {});
      const data = await fn();
      const duration = Date.now() - startTime;

      log.toolSuccess(toolName, duration);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      log.toolError(toolName, error);

      return this.formatErrorResponse(error);
    }
  }

  /**
   * Valider que les chemins sont dans les répertoires autorisés
   */
  static validatePath(targetPath: string, allowedPaths: string[]): void {
    const normalized = path.resolve(targetPath);
    const isAllowed = allowedPaths.some(allowed =>
      normalized.startsWith(path.resolve(allowed))
    );

    if (!isAllowed) {
      throw this.createError(
        this.CODES.FORBIDDEN,
        `Accès refusé au chemin: ${targetPath}`,
        { allowed_paths: allowedPaths }
      );
    }
  }

  /**
   * Valider la taille d'un fichier
   */
  static validateFileSize(size: number, maxSize: number): void {
    if (size > maxSize) {
      throw this.createError(
        this.CODES.INVALID_INPUT,
        `Fichier trop volumineux (${size} bytes > ${maxSize} bytes)`,
        { size, max_size: maxSize }
      );
    }
  }
}

import path from 'path';
export { MCPErrorHandler };
