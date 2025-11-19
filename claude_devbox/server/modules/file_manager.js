import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger.js';

const WORKSPACE_DIR = path.resolve(process.cwd(), '../workspace');
const INPUT_DIR = path.join(WORKSPACE_DIR, 'input');
const OUTPUT_DIR = path.join(WORKSPACE_DIR, 'output');

/**
 * Get all files in workspace as tree structure
 */
export async function getWorkspaceFiles() {
  try {
    const files = await buildFileTree(INPUT_DIR, INPUT_DIR);
    return files;
  } catch (error) {
    logger.error('Failed to get workspace files:', error);
    throw error;
  }
}

/**
 * Build file tree recursively
 */
async function buildFileTree(dir, rootDir) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  const tree = [];

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (item.isDirectory()) {
      const children = await buildFileTree(fullPath, rootDir);
      tree.push({
        name: item.name,
        path: relativePath,
        type: 'folder',
        children
      });
    } else {
      tree.push({
        name: item.name,
        path: relativePath,
        type: 'file'
      });
    }
  }

  return tree;
}

/**
 * Read file content
 */
export async function readFile(filePath) {
  try {
    const fullPath = path.join(INPUT_DIR, filePath);

    // Security check: prevent path traversal
    if (!fullPath.startsWith(INPUT_DIR)) {
      throw new Error('Invalid file path');
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    logger.info(`Read file: ${filePath}`);
    return content;
  } catch (error) {
    logger.error(`Failed to read file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Save file to workspace
 */
export async function saveFile(filename, content) {
  try {
    const fullPath = path.join(INPUT_DIR, filename);

    // Security check: prevent path traversal
    if (!fullPath.startsWith(INPUT_DIR)) {
      throw new Error('Invalid file path');
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(fullPath));

    await fs.writeFile(fullPath, content, 'utf-8');
    logger.info(`Saved file: ${filename}`);
  } catch (error) {
    logger.error(`Failed to save file ${filename}:`, error);
    throw error;
  }
}

/**
 * Delete file from workspace
 */
export async function deleteFile(filePath) {
  try {
    const fullPath = path.join(INPUT_DIR, filePath);

    // Security check: prevent path traversal
    if (!fullPath.startsWith(INPUT_DIR)) {
      throw new Error('Invalid file path');
    }

    await fs.remove(fullPath);
    logger.info(`Deleted file: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Create new file in workspace
 */
export async function createFile(filename, content = '') {
  try {
    const fullPath = path.join(INPUT_DIR, filename);

    // Security check
    if (!fullPath.startsWith(INPUT_DIR)) {
      throw new Error('Invalid file path');
    }

    // Check if file already exists
    if (await fs.pathExists(fullPath)) {
      throw new Error('File already exists');
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(fullPath));

    await fs.writeFile(fullPath, content, 'utf-8');
    logger.info(`Created file: ${filename}`);
  } catch (error) {
    logger.error(`Failed to create file ${filename}:`, error);
    throw error;
  }
}

/**
 * Create directory in workspace
 */
export async function createDirectory(dirPath) {
  try {
    const fullPath = path.join(INPUT_DIR, dirPath);

    // Security check
    if (!fullPath.startsWith(INPUT_DIR)) {
      throw new Error('Invalid directory path');
    }

    await fs.ensureDir(fullPath);
    logger.info(`Created directory: ${dirPath}`);
  } catch (error) {
    logger.error(`Failed to create directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Copy output files back to input workspace
 */
export async function syncOutputToInput() {
  try {
    const outputExists = await fs.pathExists(OUTPUT_DIR);
    if (!outputExists) {
      return;
    }

    const files = await fs.readdir(OUTPUT_DIR);

    for (const file of files) {
      const srcPath = path.join(OUTPUT_DIR, file);
      const destPath = path.join(INPUT_DIR, file);

      await fs.copy(srcPath, destPath, { overwrite: true });
      logger.info(`Synced output file: ${file}`);
    }

    // Clean output directory
    await fs.emptyDir(OUTPUT_DIR);
  } catch (error) {
    logger.error('Failed to sync output to input:', error);
    throw error;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath) {
  try {
    const fullPath = path.join(INPUT_DIR, filePath);

    if (!fullPath.startsWith(INPUT_DIR)) {
      throw new Error('Invalid file path');
    }

    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    logger.error(`Failed to get stats for ${filePath}:`, error);
    throw error;
  }
}
