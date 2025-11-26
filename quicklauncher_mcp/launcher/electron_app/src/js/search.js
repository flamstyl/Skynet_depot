// Search Manager
const SearchManager = {
    currentQuery: '',
    searchTimeout: null,
    debounceDelay: 150, // ms

    init() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleInput(e.target.value));
        searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
    },

    handleInput(value) {
        this.currentQuery = value;

        // Check if AI mode
        if (value.startsWith('>')) {
            this.switchToAIMode();
            return;
        } else {
            this.switchToSearchMode();
        }

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Empty query
        if (!value.trim()) {
            ResultsManager.clearResults();
            return;
        }

        // Debounced search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(value);
        }, this.debounceDelay);
    },

    async performSearch(query) {
        // Show loading
        ResultsManager.showLoading();

        try {
            const result = await window.electronAPI.search(query);

            if (result.success) {
                ResultsManager.displayResults(result.data);
                this.updateResultsCount(result.data.length);
            } else {
                console.error('Search failed:', result.error);
                ResultsManager.showError('Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            ResultsManager.showError('Backend not available');
        } finally {
            ResultsManager.hideLoading();
        }
    },

    handleKeydown(e) {
        switch (e.key) {
            case 'Escape':
                window.electronAPI.hideWindow();
                break;
            case 'ArrowDown':
                e.preventDefault();
                ResultsManager.selectNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                ResultsManager.selectPrevious();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.currentQuery.startsWith('>')) {
                    AIPromptManager.submitPrompt(this.currentQuery.substring(1).trim());
                } else {
                    ResultsManager.executeSelected();
                }
                break;
        }
    },

    switchToAIMode() {
        document.getElementById('modeIndicator').textContent = '🤖';
        ResultsManager.clearResults();
        AIPromptManager.showAIResponse();
    },

    switchToSearchMode() {
        document.getElementById('modeIndicator').textContent = '🔍';
        AIPromptManager.hideAIResponse();
    },

    updateResultsCount(count) {
        const countElement = document.getElementById('resultsCount');
        countElement.textContent = `${count} result${count !== 1 ? 's' : ''}`;
    },

    async checkBackendStatus() {
        try {
            const result = await window.electronAPI.search('');
            if (result.success) {
                this.setBackendStatus(true);
            } else {
                this.setBackendStatus(false);
            }
        } catch (error) {
            this.setBackendStatus(false);
        }
    },

    setBackendStatus(online) {
        const statusDot = document.getElementById('backendStatus');
        if (online) {
            statusDot.className = 'status-dot status-online';
        } else {
            statusDot.className = 'status-dot status-offline';
        }
    }
};

// Results Manager
const ResultsManager = {
    results: [],
    selectedIndex: -1,

    displayResults(results) {
        this.results = results;
        this.selectedIndex = results.length > 0 ? 0 : -1;

        const container = document.getElementById('resultsContainer');

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No results found</div>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map((result, index) => `
            <div class="result-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
                <div class="result-icon">
                    ${this.getResultIcon(result)}
                </div>
                <div class="result-content">
                    <div class="result-title">${this.escapeHtml(result.name)}</div>
                    <div class="result-subtitle">${this.escapeHtml(result.path || result.description || '')}</div>
                </div>
                <div class="result-type">${result.type}</div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.executeAtIndex(index);
            });
        });
    },

    getResultIcon(result) {
        const iconMap = {
            app: '📱',
            file: '📄',
            folder: '📁',
            command: '⚡',
            plugin: '🔌',
            web: '🌐',
            system: '⚙️'
        };
        return result.icon || iconMap[result.type] || '📌';
    },

    clearResults() {
        this.results = [];
        this.selectedIndex = -1;
        document.getElementById('resultsContainer').innerHTML = '';
    },

    selectNext() {
        if (this.results.length === 0) return;

        this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
        this.updateSelection();
    },

    selectPrevious() {
        if (this.results.length === 0) return;

        this.selectedIndex = this.selectedIndex - 1;
        if (this.selectedIndex < 0) this.selectedIndex = this.results.length - 1;
        this.updateSelection();
    },

    updateSelection() {
        const items = document.querySelectorAll('.result-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('selected');
            }
        });
    },

    executeSelected() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.results.length) {
            this.executeAtIndex(this.selectedIndex);
        }
    },

    async executeAtIndex(index) {
        const result = this.results[index];
        if (!result) return;

        const action = {
            type: result.type === 'app' ? 'open' : result.type === 'file' ? 'open' : 'run',
            target: result.path || result.command || result.name,
            metadata: result
        };

        try {
            const response = await window.electronAPI.executeAction(action);
            if (!response.success) {
                console.error('Action execution failed:', response.error);
            }
        } catch (error) {
            console.error('Action execution error:', error);
        }
    },

    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    },

    showError(message) {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">${this.escapeHtml(message)}</div>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on load
SearchManager.init();
