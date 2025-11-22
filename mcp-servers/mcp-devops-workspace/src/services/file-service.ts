/**
 * Service pour les opérations fichiers sécurisées
 */

import { promises as fs } from "fs";
import { join, dirname, basename } from "path";
import { FileEntry } from "../models/types.js";
import { FileSystemError } from "../models/errors.js";
import {
  validatePath,
  validateFileSize,
  validateFileExtension,
} from "../utils/validators.js";
import { logger } from "../utils/logger.js";

export class FileService {
  /**
   * Liste le contenu d'un répertoire
   */
  async listDirectory(
    path: string,
    recursive = false,
    includeHidden = false
  ): Promise<FileEntry[]> {
    const validPath = validatePath(path);

    try {
      const entries = await fs.readdir(validPath, { withFileTypes: true });
      const result: FileEntry[] = [];

      for (const entry of entries) {
        // Ignorer les fichiers cachés si demandé
        if (!includeHidden && entry.name.startsWith(".")) {
          continue;
        }

        const fullPath = join(validPath, entry.name);
        const stats = await fs.stat(fullPath);

        const fileEntry: FileEntry = {
          name: entry.name,
          type: entry.isDirectory()
            ? "directory"
            : entry.isSymbolicLink()
              ? "symlink"
              : "file",
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };

        result.push(fileEntry);

        // Récursif si demandé et c'est un dossier
        if (recursive && entry.isDirectory()) {
          const subEntries = await this.listDirectory(fullPath, true, includeHidden);
          result.push(...subEntries.map((e) => ({ ...e, name: `${entry.name}/${e.name}` })));
        }
      }

      return result;
    } catch (error: any) {
      throw new FileSystemError(`Failed to list directory: ${validPath}`, {
        originalError: error.message,
      });
    }
  }

  /**
   * Lit le contenu d'un fichier
   */
  async readFile(filePath: string, encoding = "utf-8"): Promise<string> {
    const validPath = validatePath(filePath);
    validateFileSize(validPath);

    try {
      const content = await fs.readFile(validPath, encoding);
      logger.debug(`File read: ${validPath}`);
      return content;
    } catch (error: any) {
      throw new FileSystemError(`Failed to read file: ${validPath}`, {
        originalError: error.message,
      });
    }
  }

  /**
   * Écrit dans un fichier (avec backup optionnel)
   */
  async writeFile(
    filePath: string,
    content: string,
    createBackup = true
  ): Promise<string | undefined> {
    const validPath = validatePath(filePath, true); // allowCreate
    validateFileExtension(validPath);

    let backupPath: string | undefined;

    try {
      // Créer backup si le fichier existe
      if (createBackup) {
        try {
          await fs.access(validPath);
          backupPath = `${validPath}.backup.${Date.now()}`;
          await fs.copyFile(validPath, backupPath);
          logger.info(`Backup created: ${backupPath}`);
        } catch {
          // Fichier n'existe pas, pas besoin de backup
        }
      }

      // Créer le dossier parent si nécessaire
      const dir = dirname(validPath);
      await fs.mkdir(dir, { recursive: true });

      // Écrire le fichier
      await fs.writeFile(validPath, content, "utf-8");
      logger.info(`File written: ${validPath}`);

      return backupPath;
    } catch (error: any) {
      throw new FileSystemError(`Failed to write file: ${validPath}`, {
        originalError: error.message,
      });
    }
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(filePath: string): Promise<void> {
    const validPath = validatePath(filePath);

    try {
      await fs.unlink(validPath);
      logger.info(`File deleted: ${validPath}`);
    } catch (error: any) {
      throw new FileSystemError(`Failed to delete file: ${validPath}`, {
        originalError: error.message,
      });
    }
  }

  /**
   * Crée un dossier
   */
  async createDirectory(path: string, recursive = true): Promise<void> {
    const validPath = validatePath(path, true);

    try {
      await fs.mkdir(validPath, { recursive });
      logger.info(`Directory created: ${validPath}`);
    } catch (error: any) {
      throw new FileSystemError(`Failed to create directory: ${validPath}`, {
        originalError: error.message,
      });
    }
  }

  /**
   * Vérifie si un fichier/dossier existe
   */
  async exists(path: string): Promise<boolean> {
    try {
      const validPath = validatePath(path);
      await fs.access(validPath);
      return true;
    } catch {
      return false;
    }
  }
}

export const fileService = new FileService();
