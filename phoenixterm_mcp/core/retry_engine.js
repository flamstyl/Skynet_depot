/**
 * 🔥 PhoenixTerm Retry Engine
 * Auto-retry logic avec stratégies configurables
 */

export class RetryEngine {
  constructor(config = {}) {
    this.config = config.retry || {};
    this.enabled = this.config.enabled !== false;
    this.strategy = this.config.strategy || 'exponential_backoff';
    this.maxRetries = this.config.maxRetries || 3;
    this.initialDelay = this.config.initialDelay || 1000;
    this.maxDelay = this.config.maxDelay || 10000;
    this.retryableExitCodes = this.config.retryableExitCodes || [1, 127, 130];
  }

  /**
   * Détermine si une commande doit être réessayée
   */
  shouldRetry(exitCode, attemptNumber, error = null) {
    if (!this.enabled) {
      return false;
    }

    if (attemptNumber >= this.maxRetries) {
      return false;
    }

    // Vérifier si le code de sortie est retryable
    if (exitCode !== null && this.retryableExitCodes.includes(exitCode)) {
      return true;
    }

    // Erreurs réseau ou timeout sont retryables
    if (error) {
      const retryableErrors = [
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ECONNRESET',
        'EHOSTUNREACH',
        'ENETUNREACH',
      ];

      if (retryableErrors.some(err => error.message?.includes(err))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calcule le délai avant le prochain retry
   */
  calculateDelay(attemptNumber) {
    let delay;

    switch (this.strategy) {
      case 'exponential_backoff':
        delay = Math.min(
          this.initialDelay * Math.pow(2, attemptNumber),
          this.maxDelay
        );
        break;

      case 'linear':
        delay = Math.min(
          this.initialDelay * (attemptNumber + 1),
          this.maxDelay
        );
        break;

      case 'fixed':
        delay = this.initialDelay;
        break;

      case 'random':
        delay = Math.random() * this.maxDelay;
        break;

      default:
        delay = this.initialDelay;
    }

    // Ajouter un jitter aléatoire pour éviter les thundering herd
    const jitter = Math.random() * 0.3 * delay; // ±30% jitter
    return Math.floor(delay + jitter);
  }

  /**
   * Attend avant le prochain retry
   */
  async waitForRetry(attemptNumber) {
    const delay = this.calculateDelay(attemptNumber);
    console.error(`[Retry] Waiting ${delay}ms before retry ${attemptNumber + 1}/${this.maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Exécute une fonction avec retry automatique
   */
  async executeWithRetry(fn, context = {}) {
    let lastError = null;
    let lastExitCode = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.error(`[Retry] Attempt ${attempt + 1}/${this.maxRetries + 1}`);

        const result = await fn(attempt);

        // Succès
        if (result.exitCode === 0 || result.exitCode === null) {
          if (attempt > 0) {
            console.error(`[Retry] Success after ${attempt} retries`);
          }
          return {
            success: true,
            result,
            attempts: attempt + 1,
            retried: attempt > 0,
          };
        }

        // Échec avec exit code
        lastExitCode = result.exitCode;
        lastError = result.error;

        // Vérifier si on doit retry
        if (!this.shouldRetry(lastExitCode, attempt, result.error)) {
          console.error(`[Retry] Exit code ${lastExitCode} not retryable`);
          break;
        }

        // Attendre avant le prochain retry
        if (attempt < this.maxRetries) {
          await this.waitForRetry(attempt);
        }

      } catch (error) {
        lastError = error;

        if (!this.shouldRetry(null, attempt, error)) {
          console.error(`[Retry] Error not retryable:`, error.message);
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.waitForRetry(attempt);
        }
      }
    }

    // Tous les retries ont échoué
    console.error(`[Retry] All ${this.maxRetries + 1} attempts failed`);
    return {
      success: false,
      error: lastError,
      exitCode: lastExitCode,
      attempts: this.maxRetries + 1,
      retried: true,
    };
  }

  /**
   * Analyse les patterns d'échec pour recommander des actions
   */
  analyzeFailurePattern(attempts = []) {
    if (attempts.length === 0) {
      return { pattern: 'none', recommendation: 'No failures to analyze' };
    }

    const exitCodes = attempts.map(a => a.exitCode).filter(c => c !== null);
    const errors = attempts.map(a => a.error).filter(e => e !== null);

    // Tous les mêmes exit codes?
    const uniqueExitCodes = [...new Set(exitCodes)];
    if (uniqueExitCodes.length === 1) {
      return {
        pattern: 'consistent_failure',
        recommendation: `Command consistently fails with exit code ${uniqueExitCodes[0]}. Check command syntax or dependencies.`,
        exitCode: uniqueExitCodes[0],
      };
    }

    // Erreurs réseau?
    const networkErrors = errors.filter(e =>
      ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'].some(ne => e?.includes(ne))
    );

    if (networkErrors.length > 0) {
      return {
        pattern: 'network_issues',
        recommendation: 'Network connectivity issues detected. Check internet connection or firewall.',
      };
    }

    // Pattern intermittent
    if (exitCodes.some(c => c === 0)) {
      return {
        pattern: 'intermittent_failure',
        recommendation: 'Command sometimes succeeds. May be a timing or resource availability issue.',
      };
    }

    return {
      pattern: 'unknown',
      recommendation: 'No clear pattern detected. Manual investigation required.',
    };
  }

  /**
   * Génère un rapport de retry
   */
  generateRetryReport(attempts = []) {
    const totalAttempts = attempts.length;
    const successes = attempts.filter(a => a.exitCode === 0).length;
    const failures = totalAttempts - successes;

    const avgDelay = attempts.reduce((sum, a, i) => {
      if (i > 0 && a.delay) {
        return sum + a.delay;
      }
      return sum;
    }, 0) / Math.max(1, totalAttempts - 1);

    return {
      strategy: this.strategy,
      totalAttempts,
      successes,
      failures,
      successRate: totalAttempts > 0 ? (successes / totalAttempts) * 100 : 0,
      averageRetryDelay: avgDelay,
      failurePattern: this.analyzeFailurePattern(attempts),
      timestamp: Date.now(),
    };
  }
}

export default RetryEngine;
