import { logger } from './logger.js';

/**
 * Rate limiter simple par tool
 */
class RateLimiter {
  private callCounts: Map<string, { count: number; resetTime: number }>;
  private windowMs: number;
  private maxCalls: number;

  constructor(maxCallsPerMinute: number) {
    this.callCounts = new Map();
    this.windowMs = 60 * 1000; // 1 minute
    this.maxCalls = maxCallsPerMinute;
  }

  check(toolName: string): boolean {
    const now = Date.now();
    const record = this.callCounts.get(toolName);

    if (!record || now > record.resetTime) {
      // Nouvelle fenêtre
      this.callCounts.set(toolName, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxCalls) {
      logger.warn(`Rate limit atteint pour tool : ${toolName}`);
      return false;
    }

    record.count++;
    return true;
  }
}

export const rateLimiter = new RateLimiter(60); // 60 calls/min par défaut

/**
 * Vérifie si une opération est autorisée
 */
export function checkPermission(operation: string): boolean {
  // Ici on pourrait ajouter un système de permissions plus complexe
  // Pour l'instant, on utilise la config
  const dangerousOps = ['delete', 'stop_service', 'docker_down'];

  if (dangerousOps.some((op) => operation.includes(op))) {
    logger.warn(`Opération dangereuse demandée : ${operation}`);
    // On ne bloque pas, mais on log
  }

  return true;
}
