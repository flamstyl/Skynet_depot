/**
 * Moteur de retry avec exponential backoff
 */

import { logger } from '../utils/logger.js';

export class RetryEngine {
  constructor(config = {}) {
    this.config = config.retry || {
      enabled: true,
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 2000,
      maxDelay: 16000,
    };
  }

  /**
   * Exécute une fonction avec retry automatique
   */
  async executeWithRetry(fn, operationName = 'operation') {
    if (!this.config.enabled) {
      return await fn();
    }

    const maxAttempts = this.config.maxAttempts || 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info('RetryEngine', `${operationName} - Attempt ${attempt}/${maxAttempts}`);

        const result = await fn();

        if (attempt > 1) {
          logger.success('RetryEngine', `${operationName} succeeded on attempt ${attempt}`);
        }

        return result;

      } catch (error) {
        lastError = error;
        logger.warning('RetryEngine', `${operationName} failed on attempt ${attempt}: ${error.message}`);

        // Si c'est la dernière tentative, on throw
        if (attempt === maxAttempts) {
          logger.error('RetryEngine', `${operationName} failed after ${maxAttempts} attempts`);
          throw error;
        }

        // Calculer le délai avant retry
        const delay = this.calculateDelay(attempt);
        logger.info('RetryEngine', `Retrying in ${delay}ms...`);

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Calcule le délai avant retry
   */
  calculateDelay(attempt) {
    const initial = this.config.initialDelay || 2000;
    const max = this.config.maxDelay || 16000;

    let delay;

    switch (this.config.backoff) {
      case 'exponential':
        delay = initial * Math.pow(2, attempt - 1);
        break;
      case 'linear':
        delay = initial * attempt;
        break;
      case 'fixed':
        delay = initial;
        break;
      default:
        delay = initial * Math.pow(2, attempt - 1);
    }

    return Math.min(delay, max);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
