/**
 * Utilitaires de validation pour la sécurité
 */

import { resolve, normalize } from "path";
import { existsSync, statSync } from "fs";
import { PATHS_CONFIG } from "../config/paths.js";
import { SecurityError, ValidationError } from "../models/errors.js";

/**
 * Valide qu'un chemin est sécurisé et autorisé
 */
export function validatePath(path: string, allowCreate = false): string {
  // Normaliser le chemin
  const normalized = normalize(path);
  const resolved = resolve(normalized);

  // Détecter path traversal
  if (
    normalized.includes("..") ||
    normalized.includes("~") ||
    resolved !== normalize(resolved)
  ) {
    throw new SecurityError(`Path traversal detected: ${path}`);
  }

  // Vérifier les chemins interdits
  for (const forbidden of PATHS_CONFIG.FORBIDDEN_PATHS) {
    if (resolved.startsWith(forbidden)) {
      throw new SecurityError(`Access to forbidden path: ${forbidden}`);
    }
  }

  // Vérifier les chemins autorisés
  const isAllowed = PATHS_CONFIG.ALLOWED_PATHS.some((allowed) =>
    resolved.startsWith(allowed)
  );

  if (!isAllowed) {
    throw new SecurityError(
      `Path ${resolved} is not in allowed directories: ${PATHS_CONFIG.ALLOWED_PATHS.join(", ")}`
    );
  }

  // Vérifier l'existence (si allowCreate=false)
  if (!allowCreate && !existsSync(resolved)) {
    throw new ValidationError(`Path does not exist: ${resolved}`);
  }

  return resolved;
}

/**
 * Valide la taille d'un fichier
 */
export function validateFileSize(filePath: string): void {
  if (!existsSync(filePath)) {
    return; // fichier inexistant, sera créé
  }

  const stats = statSync(filePath);
  if (stats.size > PATHS_CONFIG.MAX_FILE_SIZE) {
    throw new ValidationError(
      `File too large: ${stats.size} bytes (max: ${PATHS_CONFIG.MAX_FILE_SIZE})`
    );
  }
}

/**
 * Valide une extension de fichier
 */
export function validateFileExtension(filePath: string): void {
  const ext = filePath.substring(filePath.lastIndexOf("."));
  const baseName = filePath.substring(filePath.lastIndexOf("/") + 1);

  const isAllowed =
    PATHS_CONFIG.ALLOWED_FILE_EXTENSIONS.includes(ext) ||
    PATHS_CONFIG.ALLOWED_FILE_EXTENSIONS.includes(baseName);

  if (!isAllowed) {
    throw new SecurityError(
      `File extension not allowed: ${ext}. Allowed: ${PATHS_CONFIG.ALLOWED_FILE_EXTENSIONS.join(", ")}`
    );
  }
}

/**
 * Valide un nom de projet
 */
export function validateProjectName(name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new ValidationError(
      `Invalid project name: ${name}. Use only alphanumeric, _, and - characters.`
    );
  }
}

/**
 * Sanitize un input pour éviter l'injection de commandes
 */
export function sanitizeInput(input: string): string {
  // Remplacer les caractères dangereux
  return input
    .replace(/[;&|`$(){}[\]<>]/g, "")
    .replace(/\n/g, "")
    .trim();
}

/**
 * Valide un container ID Docker
 */
export function validateContainerId(containerId: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(containerId)) {
    throw new ValidationError(`Invalid container ID: ${containerId}`);
  }
}

/**
 * Valide un nom de service systemd
 */
export function validateServiceName(serviceName: string): void {
  if (!/^[a-zA-Z0-9_.-]+\.service$|^[a-zA-Z0-9_.-]+$/.test(serviceName)) {
    throw new ValidationError(`Invalid service name: ${serviceName}`);
  }
}
