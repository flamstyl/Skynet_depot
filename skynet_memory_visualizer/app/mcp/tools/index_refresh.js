/**
 * Index Refresh Tool
 * Refreshes RAG index metadata and embeddings
 */

const fs = require('fs').promises;
const path = require('path');

class IndexRefresh {
    constructor() {
        this.docsPath = path.join(__dirname, '../../../data/docs');
        this.indexPath = path.join(__dirname, '../../../data/rag_index');
        this.isRefreshing = false;
    }

    async refresh(options = {}) {
        if (this.isRefreshing) {
            throw new Error('Index refresh already in progress');
        }

        const { full = false } = options;

        console.log(`Starting index refresh (full: ${full})`);

        this.isRefreshing = true;

        try {
            const result = {
                added: 0,
                updated: 0,
                removed: 0,
                errors: 0,
                timestamp: new Date().toISOString()
            };

            // Load existing index
            const existingIndex = await this.loadIndex();

            // Scan documents
            const currentDocs = await this.scanDocuments();

            // Build new index
            const newIndex = {
                embeddings: {},
                metadata: {}
            };

            for (const doc of currentDocs) {
                try {
                    const docId = this.pathToId(doc.path);

                    // Check if document needs updating
                    const existing = existingIndex.metadata[docId];
                    const needsUpdate = full || !existing || existing.modified !== doc.modified;

                    if (needsUpdate) {
                        // Update metadata
                        newIndex.metadata[docId] = {
                            path: doc.path,
                            title: this.extractTitle(doc.content),
                            summary: this.generateSummary(doc.content),
                            size: doc.size,
                            created: doc.created,
                            modified: doc.modified,
                            tags: this.extractTags(doc.content)
                        };

                        // TODO: Generate embeddings
                        newIndex.embeddings[docId] = existingIndex.embeddings[docId] || [];

                        if (existing) {
                            result.updated++;
                        } else {
                            result.added++;
                        }
                    } else {
                        // Keep existing data
                        newIndex.metadata[docId] = existing;
                        newIndex.embeddings[docId] = existingIndex.embeddings[docId];
                    }

                } catch (error) {
                    console.error(`Failed to process ${doc.path}:`, error);
                    result.errors++;
                }
            }

            // Detect removed documents
            const currentPaths = new Set(currentDocs.map(d => this.pathToId(d.path)));
            for (const docId of Object.keys(existingIndex.metadata)) {
                if (!currentPaths.has(docId)) {
                    result.removed++;
                }
            }

            // Save index
            await this.saveIndex(newIndex);

            console.log(`Index refresh completed:`, result);

            return result;

        } catch (error) {
            console.error('Index refresh failed:', error);
            throw error;

        } finally {
            this.isRefreshing = false;
        }
    }

    async loadIndex() {
        try {
            const embeddingsFile = path.join(this.indexPath, 'embeddings.json');
            const metadataFile = path.join(this.indexPath, 'metadata.json');

            const embeddings = JSON.parse(await fs.readFile(embeddingsFile, 'utf8'));
            const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf8'));

            return { embeddings, metadata };

        } catch (error) {
            console.warn('Failed to load existing index, creating new:', error.message);
            return {
                embeddings: {},
                metadata: {}
            };
        }
    }

    async saveIndex(index) {
        await fs.mkdir(this.indexPath, { recursive: true });

        await fs.writeFile(
            path.join(this.indexPath, 'embeddings.json'),
            JSON.stringify(index.embeddings, null, 2),
            'utf8'
        );

        await fs.writeFile(
            path.join(this.indexPath, 'metadata.json'),
            JSON.stringify(index.metadata, null, 2),
            'utf8'
        );

        console.log('Index saved successfully');
    }

    async scanDocuments() {
        const documents = [];

        const files = await this.getFiles(this.docsPath);

        for (const file of files) {
            try {
                const stats = await fs.stat(file);
                const content = await fs.readFile(file, 'utf8');
                const relativePath = path.relative(this.docsPath, file);

                documents.push({
                    path: relativePath,
                    content,
                    size: stats.size,
                    created: stats.birthtime.toISOString(),
                    modified: stats.mtime.toISOString()
                });

            } catch (error) {
                console.error(`Failed to read ${file}:`, error);
            }
        }

        return documents;
    }

    async getFiles(dir) {
        const files = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    files.push(...await this.getFiles(fullPath));
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (['.md', '.txt', '.json'].includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to read directory ${dir}:`, error);
        }

        return files;
    }

    extractTitle(content) {
        // Extract first heading or first line
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                return trimmed.substring(2).trim();
            }
            if (trimmed.length > 0 && trimmed.length < 100) {
                return trimmed;
            }
        }
        return 'Untitled';
    }

    generateSummary(content, maxLength = 200) {
        // Simple summary: first paragraph
        const paragraphs = content.split('\n\n');
        for (const para of paragraphs) {
            const trimmed = para.trim();
            if (trimmed.length > 20) {
                return trimmed.substring(0, maxLength) + (trimmed.length > maxLength ? '...' : '');
            }
        }
        return content.substring(0, maxLength);
    }

    extractTags(content) {
        // Extract tags from markdown frontmatter or content
        const tags = [];

        // Look for tags in frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[([^\]]+)\]/);
            if (tagsMatch) {
                tags.push(...tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')));
            }
        }

        // Look for hashtags
        const hashtagMatches = content.matchAll(/#(\w+)/g);
        for (const match of hashtagMatches) {
            if (match[1].length > 2) {
                tags.push(match[1].toLowerCase());
            }
        }

        return [...new Set(tags)]; // Remove duplicates
    }

    pathToId(filePath) {
        return filePath.replace(/[\/\\\.]/g, '_');
    }

    async getStatus() {
        try {
            const index = await this.loadIndex();

            return {
                total_documents: Object.keys(index.metadata).length,
                total_embeddings: Object.keys(index.embeddings).length,
                is_refreshing: this.isRefreshing,
                index_path: this.indexPath
            };

        } catch (error) {
            return {
                error: error.message,
                is_refreshing: this.isRefreshing
            };
        }
    }
}

module.exports = new IndexRefresh();
