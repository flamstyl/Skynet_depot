// AI Prompt Manager
const AIPromptManager = {
    isProcessing: false,

    async submitPrompt(prompt) {
        if (!prompt.trim() || this.isProcessing) return;

        this.isProcessing = true;
        this.showLoading();

        try {
            const result = await window.electronAPI.aiPrompt(prompt);

            if (result.success) {
                this.displayResponse(result.data);
            } else {
                this.displayError('AI request failed: ' + result.error);
            }
        } catch (error) {
            console.error('AI prompt error:', error);
            this.displayError('AI service unavailable');
        } finally {
            this.isProcessing = false;
            this.hideLoading();
        }
    },

    displayResponse(data) {
        const container = document.getElementById('aiResponseContent');

        // Format response
        let content = '';

        if (data.response) {
            content += this.formatMarkdown(data.response);
        }

        // Display suggested actions if available
        if (data.actions && data.actions.length > 0) {
            content += '<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">';
            content += '<div style="font-weight: 600; margin-bottom: 8px; color: var(--accent-secondary);">Suggested Actions:</div>';
            data.actions.forEach((action, index) => {
                content += `
                    <div class="suggested-action" data-action-index="${index}" style="
                        padding: 8px 12px;
                        margin: 4px 0;
                        background: var(--bg-primary);
                        border-radius: 6px;
                        cursor: pointer;
                        transition: background 0.15s;
                    " onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-primary)'">
                        <div style="font-weight: 500;">${this.escapeHtml(action.title)}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${this.escapeHtml(action.description || '')}</div>
                    </div>
                `;
            });
            content += '</div>';
        }

        container.innerHTML = content;

        // Add click handlers to suggested actions
        container.querySelectorAll('.suggested-action').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.actionIndex);
                this.executeSuggestedAction(data.actions[index]);
            });
        });

        this.showAIResponse();
    },

    async executeSuggestedAction(action) {
        try {
            await window.electronAPI.executeAction(action);
        } catch (error) {
            console.error('Failed to execute suggested action:', error);
        }
    },

    displayError(message) {
        const container = document.getElementById('aiResponseContent');
        container.innerHTML = `
            <div style="color: #ef4444; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">❌</span>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        this.showAIResponse();
    },

    formatMarkdown(text) {
        // Simple markdown formatting
        // TODO: Use a proper markdown library for production

        // Escape HTML first
        let formatted = this.escapeHtml(text);

        // Headers
        formatted = formatted.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        formatted = formatted.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        formatted = formatted.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Code blocks
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        // Lists
        formatted = formatted.replace(/^- (.*$)/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        return formatted;
    },

    showAIResponse() {
        document.getElementById('aiResponseContainer').style.display = 'block';
        document.getElementById('resultsContainer').style.display = 'none';
    },

    hideAIResponse() {
        document.getElementById('aiResponseContainer').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'block';
    },

    showLoading() {
        const container = document.getElementById('aiResponseContent');
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="spinner"></div>
                <span style="color: var(--text-secondary);">Thinking...</span>
            </div>
        `;
        this.showAIResponse();
    },

    hideLoading() {
        // Loading is replaced by actual content
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
