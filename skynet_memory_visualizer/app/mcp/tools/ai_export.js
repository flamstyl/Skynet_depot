/**
 * AI Export Tool
 * Exports documents in formats optimized for AI consumption
 */

const fs = require('fs').promises;
const path = require('path');

class AIExport {
    constructor() {
        this.docsPath = path.join(__dirname, '../../../data/docs');
        this.exportPath = path.join(__dirname, '../../../data/exports');
    }

    async export(options = {}) {
        const {
            format = 'markdown',
            filter = null,
            includeMetadata = true
        } = options;

        console.log(`Exporting memory for AI (format: ${format})`);

        try {
            // Ensure export directory exists
            await fs.mkdir(this.exportPath, { recursive: true });

            // Load documents
            const documents = await this.loadDocuments(filter);

            // Export based on format
            let result;
            switch (format) {
                case 'json':
                    result = await this.exportJSON(documents, includeMetadata);
                    break;
                case 'markdown':
                    result = await this.exportMarkdown(documents, includeMetadata);
                    break;
                case 'text':
                    result = await this.exportText(documents);
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            console.log(`Export completed: ${result.count} documents exported`);

            return result;

        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    async loadDocuments(filter = null) {
        const documents = [];

        try {
            // Load all markdown and text files
            const files = await this.getFiles(this.docsPath);

            for (const file of files) {
                if (this.shouldInclude(file, filter)) {
                    const content = await fs.readFile(file, 'utf8');
                    const relativePath = path.relative(this.docsPath, file);

                    documents.push({
                        path: relativePath,
                        content,
                        size: content.length
                    });
                }
            }

        } catch (error) {
            console.error('Failed to load documents:', error);
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

    shouldInclude(filePath, filter) {
        if (!filter) return true;

        // TODO: Implement tag-based filtering
        return true;
    }

    async exportJSON(documents, includeMetadata) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `memory_export_${timestamp}.json`;
        const filepath = path.join(this.exportPath, filename);

        const exportData = {
            metadata: {
                export_date: new Date().toISOString(),
                total_documents: documents.length,
                format: 'json'
            },
            documents: documents.map(doc => ({
                path: doc.path,
                content: doc.content,
                size: doc.size
            }))
        };

        await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf8');

        return {
            format: 'json',
            path: filepath,
            count: documents.length,
            size: JSON.stringify(exportData).length
        };
    }

    async exportMarkdown(documents, includeMetadata) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `memory_export_${timestamp}.md`;
        const filepath = path.join(this.exportPath, filename);

        let markdown = '# Skynet Memory Export\n\n';

        if (includeMetadata) {
            markdown += `**Export Date:** ${new Date().toLocaleString()}\n`;
            markdown += `**Total Documents:** ${documents.length}\n\n`;
            markdown += '---\n\n';
        }

        for (const doc of documents) {
            markdown += `## ${doc.path}\n\n`;
            markdown += doc.content + '\n\n';
            markdown += '---\n\n';
        }

        await fs.writeFile(filepath, markdown, 'utf8');

        return {
            format: 'markdown',
            path: filepath,
            count: documents.length,
            size: markdown.length
        };
    }

    async exportText(documents) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `memory_export_${timestamp}.txt`;
        const filepath = path.join(this.exportPath, filename);

        let text = 'SKYNET MEMORY EXPORT\n';
        text += '===================\n\n';

        for (const doc of documents) {
            text += `FILE: ${doc.path}\n`;
            text += '-'.repeat(60) + '\n';
            text += doc.content + '\n\n';
        }

        await fs.writeFile(filepath, text, 'utf8');

        return {
            format: 'text',
            path: filepath,
            count: documents.length,
            size: text.length
        };
    }

    async formatForContext(documents) {
        /**
         * Format documents as context for AI prompt
         * Returns a structured context string
         */
        let context = '';

        for (const doc of documents) {
            context += `<document path="${doc.path}">\n`;
            context += doc.content;
            context += '\n</document>\n\n';
        }

        return context;
    }
}

module.exports = new AIExport();
