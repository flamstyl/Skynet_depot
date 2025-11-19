/**
 * File Manager Service
 * Handles workspace file operations
 */

import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import logger from './logger.js';

class FileManager {
    constructor() {
        this.workspaceDir = path.resolve('../workspace');
        this.runsDir = path.resolve('../runs');
        this.watcher = null;
        this.fileChangeCallbacks = [];
    }

    async init() {
        // Ensure directories exist
        await fs.ensureDir(this.workspaceDir);
        await fs.ensureDir(path.join(this.workspaceDir, 'input'));
        await fs.ensureDir(path.join(this.workspaceDir, 'output'));
        await fs.ensureDir(this.runsDir);

        // Set up file watcher
        this.watcher = chokidar.watch(this.workspaceDir, {
            persistent: true,
            ignoreInitial: true
        });

        this.watcher.on('change', (filepath) => {
            logger.info(`File changed: ${filepath}`);
            this.notifyFileChange('change', filepath);
        });

        this.watcher.on('add', (filepath) => {
            logger.info(`File added: ${filepath}`);
            this.notifyFileChange('add', filepath);
        });

        this.watcher.on('unlink', (filepath) => {
            logger.info(`File removed: ${filepath}`);
            this.notifyFileChange('unlink', filepath);
        });

        logger.info('✓ File manager initialized');
    }

    async listFiles(dirPath = this.workspaceDir) {
        try {
            const absolutePath = path.resolve(dirPath);

            // Security check: ensure path is within workspace
            if (!absolutePath.startsWith(this.workspaceDir)) {
                throw new Error('Access denied: path outside workspace');
            }

            const items = await fs.readdir(absolutePath, { withFileTypes: true });

            const files = await Promise.all(
                items.map(async (item) => {
                    const itemPath = path.join(absolutePath, item.name);
                    const stats = await fs.stat(itemPath);

                    let children = 0;
                    if (item.isDirectory()) {
                        const dirContents = await fs.readdir(itemPath);
                        children = dirContents.length;
                    }

                    return {
                        name: item.name,
                        path: itemPath,
                        type: item.isDirectory() ? 'directory' : 'file',
                        size: stats.size,
                        modified: stats.mtime,
                        children: item.isDirectory() ? children : undefined
                    };
                })
            );

            return files;
        } catch (error) {
            logger.error('Failed to list files:', error);
            throw error;
        }
    }

    async readFile(filepath) {
        try {
            const absolutePath = path.resolve(filepath);

            // Security check
            if (!absolutePath.startsWith(this.workspaceDir) &&
                !absolutePath.startsWith(this.runsDir)) {
                throw new Error('Access denied: path outside allowed directories');
            }

            const content = await fs.readFile(absolutePath, 'utf-8');
            const stats = await fs.stat(absolutePath);

            return {
                path: absolutePath,
                content,
                encoding: 'utf-8',
                size: stats.size,
                modified: stats.mtime
            };
        } catch (error) {
            logger.error(`Failed to read file ${filepath}:`, error);
            throw error;
        }
    }

    async writeFile(filepath, content, encoding = 'utf-8') {
        try {
            const absolutePath = path.resolve(filepath);

            // Security check
            if (!absolutePath.startsWith(this.workspaceDir)) {
                throw new Error('Access denied: path outside workspace');
            }

            // Ensure parent directory exists
            await fs.ensureDir(path.dirname(absolutePath));

            await fs.writeFile(absolutePath, content, encoding);

            logger.info(`File written: ${absolutePath}`);

            return { path: absolutePath, size: content.length };
        } catch (error) {
            logger.error(`Failed to write file ${filepath}:`, error);
            throw error;
        }
    }

    async deleteFile(filepath) {
        try {
            const absolutePath = path.resolve(filepath);

            // Security check
            if (!absolutePath.startsWith(this.workspaceDir)) {
                throw new Error('Access denied: path outside workspace');
            }

            await fs.remove(absolutePath);

            logger.info(`File deleted: ${absolutePath}`);

            return { path: absolutePath };
        } catch (error) {
            logger.error(`Failed to delete file ${filepath}:`, error);
            throw error;
        }
    }

    async createDirectory(dirPath) {
        try {
            const absolutePath = path.resolve(dirPath);

            // Security check
            if (!absolutePath.startsWith(this.workspaceDir)) {
                throw new Error('Access denied: path outside workspace');
            }

            await fs.ensureDir(absolutePath);

            logger.info(`Directory created: ${absolutePath}`);

            return { path: absolutePath };
        } catch (error) {
            logger.error(`Failed to create directory ${dirPath}:`, error);
            throw error;
        }
    }

    async createSnapshot(runId, code, language) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const snapshotDir = path.join(this.runsDir, `${timestamp}_${runId}`);

            await fs.ensureDir(snapshotDir);
            await fs.ensureDir(path.join(snapshotDir, 'code_snapshot'));

            // Copy code files
            const { filename } = this.getFilenameForLanguage(language);
            await fs.writeFile(
                path.join(snapshotDir, 'code_snapshot', filename),
                code
            );

            // Create metadata
            const metadata = {
                runId,
                language,
                timestamp,
                startTime: new Date().toISOString()
            };

            await fs.writeFile(
                path.join(snapshotDir, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );

            logger.info(`Snapshot created: ${snapshotDir}`);

            return snapshotDir;
        } catch (error) {
            logger.error('Failed to create snapshot:', error);
            throw error;
        }
    }

    async saveRunLogs(snapshotDir, logs) {
        try {
            if (logs.stdout) {
                await fs.writeFile(
                    path.join(snapshotDir, 'stdout.log'),
                    logs.stdout
                );
            }

            if (logs.stderr) {
                await fs.writeFile(
                    path.join(snapshotDir, 'stderr.log'),
                    logs.stderr
                );
            }

            if (logs.containerInfo) {
                await fs.writeFile(
                    path.join(snapshotDir, 'container_info.json'),
                    JSON.stringify(logs.containerInfo, null, 2)
                );
            }

            if (logs.attempts) {
                await fs.writeFile(
                    path.join(snapshotDir, 'fixed_attempts.json'),
                    JSON.stringify(logs.attempts, null, 2)
                );
            }

            // Update metadata with end time
            const metadataPath = path.join(snapshotDir, 'metadata.json');
            const metadata = await fs.readJson(metadataPath);
            metadata.endTime = new Date().toISOString();
            metadata.duration = logs.duration;
            metadata.exitCode = logs.exitCode;
            metadata.success = logs.success;
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

            logger.info(`Run logs saved: ${snapshotDir}`);
        } catch (error) {
            logger.error('Failed to save run logs:', error);
            throw error;
        }
    }

    getFilenameForLanguage(language) {
        const map = {
            python: { filename: 'main.py' },
            javascript: { filename: 'main.js' },
            typescript: { filename: 'main.ts' },
            java: { filename: 'Main.java' },
            rust: { filename: 'main.rs' },
            go: { filename: 'main.go' },
            cpp: { filename: 'main.cpp' },
            c: { filename: 'main.c' },
            csharp: { filename: 'Program.cs' }
        };

        return map[language] || { filename: 'main.txt' };
    }

    onFileChange(callback) {
        this.fileChangeCallbacks.push(callback);
    }

    notifyFileChange(event, filepath) {
        this.fileChangeCallbacks.forEach(callback => {
            try {
                callback(event, filepath);
            } catch (error) {
                logger.error('File change callback error:', error);
            }
        });
    }

    getWorkspaceInfo() {
        return {
            path: this.workspaceDir,
            watching: this.watcher ? true : false
        };
    }

    async cleanup() {
        if (this.watcher) {
            await this.watcher.close();
            logger.info('File watcher closed');
        }
    }
}

export default FileManager;
