/**
 * API Client for Claude DevBox Backend
 * Handles all REST API communication
 */

class APIClient {
    constructor(baseUrl = 'http://localhost:4000/api') {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Execution endpoints
    async run(code, language, options = {}) {
        return this.request('/run', {
            method: 'POST',
            body: JSON.stringify({
                code,
                language,
                ...options
            })
        });
    }

    async exec(command, workdir = '/workspace') {
        return this.request('/exec', {
            method: 'POST',
            body: JSON.stringify({ command, workdir })
        });
    }

    async lint(code, language, linters = []) {
        return this.request('/lint', {
            method: 'POST',
            body: JSON.stringify({ code, language, linters })
        });
    }

    async build(language, buildTool, command) {
        return this.request('/build', {
            method: 'POST',
            body: JSON.stringify({ language, buildTool, command })
        });
    }

    // Auto-fix endpoint
    async autofix(code, language, options = {}) {
        return this.request('/autofix', {
            method: 'POST',
            body: JSON.stringify({
                code,
                language,
                maxRetries: options.maxRetries || 5,
                timeout: options.timeout || 300000,
                context: options.context || ''
            })
        });
    }

    // File management
    async listFiles(path = '/workspace') {
        const params = new URLSearchParams({ path });
        return this.request(`/files?${params}`);
    }

    async readFile(path) {
        const params = new URLSearchParams({ path });
        return this.request(`/files/read?${params}`);
    }

    async writeFile(path, content, encoding = 'utf-8') {
        return this.request('/files/write', {
            method: 'POST',
            body: JSON.stringify({ path, content, encoding })
        });
    }

    async deleteFile(path) {
        return this.request('/files', {
            method: 'DELETE',
            body: JSON.stringify({ path })
        });
    }

    // Logs and history
    async getLogs(runId) {
        return this.request(`/logs/${runId}`);
    }

    async getRuns(limit = 20, offset = 0, success = null) {
        const params = new URLSearchParams({ limit, offset });
        if (success !== null) params.append('success', success);
        return this.request(`/runs?${params}`);
    }

    // VM testing
    async testLinux(code, options = {}) {
        return this.request('/vm/test/linux', {
            method: 'POST',
            body: JSON.stringify({
                code,
                distribution: options.distribution || 'ubuntu-22.04',
                testScript: options.testScript || '',
                snapshot: options.snapshot || 'clean-state'
            })
        });
    }

    async testWindows(code, options = {}) {
        return this.request('/vm/test/windows', {
            method: 'POST',
            body: JSON.stringify({
                code,
                version: options.version || 'Windows-10',
                testScript: options.testScript || '',
                snapshot: options.snapshot || 'clean-state'
            })
        });
    }

    // Health check
    async health() {
        return this.request('/health');
    }
}

export default APIClient;
