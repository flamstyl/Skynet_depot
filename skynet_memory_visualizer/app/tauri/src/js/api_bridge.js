/**
 * API Bridge - Communication layer between Tauri frontend and Flask/MCP backends
 * Skynet Memory Visualizer
 */

class APIBridge {
    constructor() {
        this.flaskURL = 'http://localhost:5432';
        this.mcpURL = 'http://localhost:3456';
    }

    // === Generic Request Handler ===
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(error.error || error.message || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // === Dashboard APIs ===
    async getStats() {
        return this.request(`${this.flaskURL}/api/stats`);
    }

    async getTimeline() {
        return this.request(`${this.flaskURL}/api/timeline`);
    }

    async checkHealth() {
        try {
            await this.request(`${this.flaskURL}/api/health`);
            return true;
        } catch {
            return false;
        }
    }

    // === Search APIs ===
    async search(query) {
        return this.request(`${this.flaskURL}/api/search?q=${encodeURIComponent(query)}`);
    }

    // === File Management APIs ===
    async getFileTree(path = '/') {
        return this.request(`${this.flaskURL}/api/files/tree?path=${encodeURIComponent(path)}`);
    }

    async loadDocument(path) {
        return this.request(`${this.flaskURL}/api/files/load?path=${encodeURIComponent(path)}`);
    }

    async saveDocument(path, content) {
        return this.request(`${this.flaskURL}/api/files/save`, {
            method: 'POST',
            body: JSON.stringify({ path, content })
        });
    }

    async deleteFile(path) {
        return this.request(`${this.flaskURL}/api/files/delete`, {
            method: 'DELETE',
            body: JSON.stringify({ path })
        });
    }

    async renameFile(oldPath, newPath) {
        return this.request(`${this.flaskURL}/api/files/rename`, {
            method: 'POST',
            body: JSON.stringify({ old_path: oldPath, new_path: newPath })
        });
    }

    async getFilePreview(path, lines = 5) {
        return this.request(`${this.flaskURL}/api/files/preview?path=${encodeURIComponent(path)}&lines=${lines}`);
    }

    // === Tag Management APIs ===
    async getTags(path) {
        return this.request(`${this.flaskURL}/api/tags/get?path=${encodeURIComponent(path)}`);
    }

    async addTag(path, tag) {
        return this.request(`${this.flaskURL}/api/tags/add`, {
            method: 'POST',
            body: JSON.stringify({ path, tag })
        });
    }

    async removeTag(path, tag) {
        return this.request(`${this.flaskURL}/api/tags/remove`, {
            method: 'DELETE',
            body: JSON.stringify({ path, tag })
        });
    }

    async getAllTags() {
        return this.request(`${this.flaskURL}/api/tags/all`);
    }

    async filterByTag(tag) {
        return this.request(`${this.flaskURL}/api/tags/filter?tag=${encodeURIComponent(tag)}`);
    }

    // === Metadata APIs ===
    async getMetadata(path) {
        return this.request(`${this.flaskURL}/api/metadata/get?path=${encodeURIComponent(path)}`);
    }

    async saveMetadata(path, metadata) {
        return this.request(`${this.flaskURL}/api/metadata/save`, {
            method: 'POST',
            body: JSON.stringify({ path, metadata })
        });
    }

    // === Version History APIs ===
    async getHistory(path) {
        return this.request(`${this.flaskURL}/api/history/list?path=${encodeURIComponent(path)}`);
    }

    async getVersion(path, versionId) {
        return this.request(`${this.flaskURL}/api/history/version?path=${encodeURIComponent(path)}&version=${versionId}`);
    }

    async restoreVersion(path, versionId) {
        return this.request(`${this.flaskURL}/api/history/restore`, {
            method: 'POST',
            body: JSON.stringify({ path, version_id: versionId })
        });
    }

    // === Compare APIs ===
    async generateDiff(textA, textB) {
        return this.request(`${this.flaskURL}/api/compare/diff`, {
            method: 'POST',
            body: JSON.stringify({ text_a: textA, text_b: textB })
        });
    }

    async exportDiff(path, diff) {
        return this.request(`${this.flaskURL}/api/compare/export`, {
            method: 'POST',
            body: JSON.stringify({ path, diff })
        });
    }

    // === AI APIs ===
    async suggestTags(content) {
        return this.request(`${this.flaskURL}/api/ai/suggest-tags`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    async aiRegenerate(content, promptType = 'regenerate_doc') {
        return this.request(`${this.flaskURL}/api/ai/regenerate`, {
            method: 'POST',
            body: JSON.stringify({ content, prompt_type: promptType })
        });
    }

    async aiSummarize(content, level = 'medium') {
        return this.request(`${this.flaskURL}/api/ai/summarize`, {
            method: 'POST',
            body: JSON.stringify({ content, level })
        });
    }

    async aiExtractMetadata(content) {
        return this.request(`${this.flaskURL}/api/ai/extract-metadata`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    // === RAG APIs ===
    async refreshIndex() {
        return this.request(`${this.flaskURL}/api/rag/refresh`, {
            method: 'POST'
        });
    }

    async getIndexStatus() {
        return this.request(`${this.flaskURL}/api/rag/status`);
    }

    // === MCP APIs ===
    async syncRAG() {
        return this.request(`${this.mcpURL}/sync/rag`, {
            method: 'POST'
        });
    }

    async exportMemory() {
        return this.request(`${this.mcpURL}/ai/export`, {
            method: 'POST'
        });
    }

    async mcpHealth() {
        try {
            await this.request(`${this.mcpURL}/health/visualizer`);
            return true;
        } catch {
            return false;
        }
    }
}

// Create global API instance
const api = new APIBridge();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIBridge;
}
