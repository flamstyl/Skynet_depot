/**
 * Logs Panel Component
 * Manages multiple output panels (stdout, stderr, docker, autofix, build)
 */

class LogsPanel {
    constructor() {
        this.panels = {
            output: {
                element: document.getElementById('outputContent'),
                clear: document.getElementById('clearOutputBtn'),
                copy: document.getElementById('copyOutputBtn')
            },
            errors: {
                element: document.getElementById('errorsContent'),
                clear: document.getElementById('clearErrorsBtn'),
                copy: document.getElementById('copyErrorsBtn'),
                badge: document.getElementById('errorBadge')
            },
            docker: {
                element: document.getElementById('dockerContent'),
                clear: document.getElementById('clearDockerBtn'),
                copy: document.getElementById('copyDockerBtn')
            },
            autofix: {
                element: document.getElementById('autofixContent'),
                clear: document.getElementById('clearAutofixBtn')
            },
            build: {
                element: document.getElementById('buildContent'),
                clear: document.getElementById('clearBuildBtn'),
                copy: document.getElementById('copyBuildBtn')
            }
        };

        this.initializePanels();
    }

    initializePanels() {
        // Set up clear buttons
        Object.entries(this.panels).forEach(([name, panel]) => {
            if (panel.clear) {
                panel.clear.addEventListener('click', () => this.clear(name));
            }
            if (panel.copy) {
                panel.copy.addEventListener('click', () => this.copy(name));
            }
        });
    }

    append(panelName, content, options = {}) {
        const panel = this.panels[panelName];
        if (!panel || !panel.element) return;

        if (options.timestamp) {
            const time = new Date().toLocaleTimeString();
            content = `[${time}] ${content}`;
        }

        if (options.color) {
            const span = document.createElement('span');
            span.style.color = options.color;
            span.textContent = content;
            panel.element.appendChild(span);
            panel.element.appendChild(document.createTextNode('\n'));
        } else {
            panel.element.textContent += content;
        }

        // Auto-scroll to bottom
        if (options.autoScroll !== false) {
            panel.element.scrollTop = panel.element.scrollHeight;
        }

        // Update error badge
        if (panelName === 'errors' && content.trim()) {
            this.updateErrorBadge();
        }
    }

    appendLine(panelName, line, options = {}) {
        this.append(panelName, line + '\n', options);
    }

    clear(panelName) {
        const panel = this.panels[panelName];
        if (!panel || !panel.element) return;

        if (panelName === 'autofix') {
            panel.element.innerHTML = '';
        } else {
            panel.element.textContent = '';
        }

        if (panelName === 'errors' && panel.badge) {
            panel.badge.style.display = 'none';
            panel.badge.textContent = '0';
        }
    }

    copy(panelName) {
        const panel = this.panels[panelName];
        if (!panel || !panel.element) return;

        const text = panel.element.textContent;
        navigator.clipboard.writeText(text).then(() => {
            this.showCopySuccess(panel.copy);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.color = '#4ec9b0';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.color = '';
        }, 2000);
    }

    updateErrorBadge() {
        const panel = this.panels.errors;
        if (!panel.badge) return;

        const errorCount = (panel.element.textContent.match(/error|exception|traceback/gi) || []).length;
        if (errorCount > 0) {
            panel.badge.style.display = 'inline-block';
            panel.badge.textContent = errorCount;
        }
    }

    // Auto-fix specific methods
    addAutofixAttempt(attempt, totalAttempts, error, fix = null, success = false) {
        const panel = this.panels.autofix;
        if (!panel.element) return;

        const attemptElement = document.createElement('div');
        attemptElement.className = `autofix-attempt ${success ? 'success' : error ? 'error' : ''}`;

        const header = document.createElement('div');
        header.className = 'autofix-attempt-header';

        const title = document.createElement('div');
        title.className = 'autofix-attempt-title';
        title.textContent = success
            ? `✓ Attempt ${attempt}/${totalAttempts} - Success!`
            : `⚠ Attempt ${attempt}/${totalAttempts}`;
        header.appendChild(title);

        const time = document.createElement('div');
        time.className = 'autofix-attempt-time';
        time.textContent = new Date().toLocaleTimeString();
        header.appendChild(time);

        attemptElement.appendChild(header);

        if (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'autofix-attempt-error';
            errorDiv.textContent = `Error: ${error}`;
            attemptElement.appendChild(errorDiv);
        }

        if (fix) {
            const fixDiv = document.createElement('div');
            fixDiv.className = 'autofix-attempt-fix';
            fixDiv.textContent = `Fix applied: ${fix}`;
            attemptElement.appendChild(fixDiv);
        }

        panel.element.appendChild(attemptElement);
        panel.element.scrollTop = panel.element.scrollHeight;
    }

    // Docker logs formatting
    appendDockerLog(level, message, containerId = null) {
        const colors = {
            info: '#4ec9b0',
            warn: '#cca700',
            error: '#f48771',
            debug: '#858585'
        };

        const time = new Date().toLocaleTimeString();
        const prefix = containerId ? `[${containerId.substring(0, 12)}]` : '';
        const log = `[${time}] ${prefix} [${level.toUpperCase()}] ${message}\n`;

        this.append('docker', log, {
            color: colors[level] || colors.info,
            autoScroll: true
        });
    }

    // Build output formatting
    appendBuildOutput(message, type = 'info') {
        const icons = {
            info: 'ℹ',
            success: '✓',
            error: '✗',
            warning: '⚠'
        };

        const colors = {
            info: '#858585',
            success: '#4ec9b0',
            error: '#f48771',
            warning: '#cca700'
        };

        const formatted = `${icons[type]} ${message}\n`;
        this.append('build', formatted, {
            color: colors[type],
            timestamp: true
        });
    }

    // Utility methods
    setContent(panelName, content) {
        const panel = this.panels[panelName];
        if (!panel || !panel.element) return;

        if (panelName === 'autofix') {
            panel.element.innerHTML = content;
        } else {
            panel.element.textContent = content;
        }
    }

    getContent(panelName) {
        const panel = this.panels[panelName];
        if (!panel || !panel.element) return '';

        return panel.element.textContent;
    }

    clearAll() {
        Object.keys(this.panels).forEach(name => {
            this.clear(name);
        });
    }
}

export default LogsPanel;
