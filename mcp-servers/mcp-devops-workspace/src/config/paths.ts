/**
 * Configuration des chemins autorisés et politiques de sécurité
 */

import { homedir } from "os";
import { join } from "path";

export const PATHS_CONFIG = {
  // Chemins autorisés pour les opérations de fichiers
  ALLOWED_PATHS: [
    homedir(),
    "/tmp",
    "/var/log", // lecture seule
  ],

  // Chemins interdits (blacklist)
  FORBIDDEN_PATHS: [
    "/etc/passwd",
    "/etc/shadow",
    "/root",
    "/sys",
    "/proc",
  ],

  // Répertoire projets par défaut
  DEFAULT_PROJECTS_DIR: process.env.PROJECTS_DIR || join(homedir(), "projects"),

  // Extensions de fichiers autorisées pour lecture/écriture
  ALLOWED_FILE_EXTENSIONS: [
    ".txt",
    ".md",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".env",
    ".py",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".css",
    ".scss",
    ".sh",
    ".bash",
    ".gitignore",
    ".dockerignore",
    "Dockerfile",
    "Makefile",
  ],

  // Taille maximale de fichier (en bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
} as const;
