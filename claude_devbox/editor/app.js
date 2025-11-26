/**
 * Claude DevBox - Main Application
 * Orchestrates all components and manages application state
 */

import APIClient from './components/APIClient.js';
import WebSocketClient from './components/WebSocketClient.js';
import CodeEditor from './components/CodeEditor.js';
import TerminalView from './components/TerminalView.js';
import LogsPanel from './components/LogsPanel.js';
import FileTree from './components/FileTree.js';
import SplitView from './components/SplitView.js';

class DevBoxApp {
    constructor() {
        this.apiClient = new APIClient();
        this.wsClient = new WebSocketClient();
        this.codeEditor = null;
        this.terminal = null;
        this.logsPanel = null;
        this.fileTree = null;
        this.splitView = null;

        this.currentLanguage = 'python';
        this.currentRunId = null;
        this.isRunning = false;
        this.autofixInProgress = false;
    }

    async init() {
        console.log('🧠 Initializing Claude DevBox...');

        try {
            // Initialize components
            await this.initializeComponents();

            // Set up event listeners
            this.setupEventListeners();

            // Connect WebSocket
            await this.connectWebSocket();

            // Check health
            await this.checkHealth();

            console.log('✓ Claude DevBox initialized successfully');
            this.updateStatus('Ready', 'ready');
        } catch (error) {
            console.error('Failed to initialize DevBox:', error);
            this.updateStatus('Initialization Error', 'error');
        }
    }

    async initializeComponents() {
        // Initialize Code Editor
        this.codeEditor = new CodeEditor('editor', {
            language: this.currentLanguage,
            onChange: (code) => this.handleCodeChange(code),
            onSave: (code) => this.handleCodeSave(code)
        });
        await this.codeEditor.init();

        // Initialize Logs Panel
        this.logsPanel = new LogsPanel();

        // Initialize Terminal
        this.terminal = new TerminalView('terminal', this.wsClient);
        await this.terminal.init();

        // Initialize File Tree
        this.fileTree = new FileTree('fileTree', this.apiClient, (file, content) => {
            this.handleFileSelect(file, content);
        });
        await this.fileTree.init();

        // Initialize Split View
        this.splitView = new SplitView('topSection', 'bottomSection', 'horizontalResizeHandle');
    }

    setupEventListeners() {
        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        languageSelect.addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            this.codeEditor.setLanguage(this.currentLanguage);
        });

        // Control buttons
        document.getElementById('runBtn').addEventListener('click', () => this.runCode());
        document.getElementById('autofixBtn').addEventListener('click', () => this.autofix());
        document.getElementById('buildBtn').addEventListener('click', () => this.build());
        document.getElementById('testLinuxBtn').addEventListener('click', () => this.testLinux());
        document.getElementById('testWindowsBtn').addEventListener('click', () => this.testWindows());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());

        // Editor toolbar
        document.getElementById('formatBtn').addEventListener('click', () => this.codeEditor.format());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveCurrentFile());

        // File tree buttons
        document.getElementById('refreshFilesBtn').addEventListener('click', () => this.fileTree.refresh());
        document.getElementById('newFileBtn').addEventListener('click', () => this.createNewFile());

        // Terminal buttons
        document.getElementById('clearTerminalBtn').addEventListener('click', () => this.terminal.clear());
        document.getElementById('restartTerminalBtn').addEventListener('click', () => this.terminal.restart());

        // Tab switching
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.panel));
        });
    }

    async connectWebSocket() {
        try {
            await this.wsClient.connect();

            // Set up WebSocket event handlers
            this.wsClient.on('stdout', (data) => {
                this.logsPanel.append('output', data.chunk, { autoScroll: true });
            });

            this.wsClient.on('stderr', (data) => {
                this.logsPanel.append('errors', data.chunk, { autoScroll: true });
            });

            this.wsClient.on('docker_log', (data) => {
                this.logsPanel.appendDockerLog(data.level, data.message, data.containerId);
            });

            this.wsClient.on('exit', (data) => {
                this.handleExecutionComplete(data);
            });

            this.wsClient.on('fix_attempt', (data) => {
                this.handleFixAttempt(data);
            });

            this.wsClient.on('fix_success', (data) => {
                this.handleFixSuccess(data);
            });

            this.wsClient.on('terminal_output', (data) => {
                // Already handled in TerminalView
            });

            this.wsClient.on('connected', () => {
                this.updateConnectionStatus(true);
            });

            this.wsClient.on('disconnected', () => {
                this.updateConnectionStatus(false);
            });

            // Subscribe to all streams
            this.wsClient.subscribe(['stdout', 'stderr', 'docker', 'autofix']);

        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.updateConnectionStatus(false);
        }
    }

    async checkHealth() {
        try {
            const health = await this.apiClient.health();
            this.updateHealthStatus(health);
        } catch (error) {
            console.error('Health check failed:', error);
        }
    }

    // Code execution methods
    async runCode() {
        if (this.isRunning) {
            console.log('Already running...');
            return;
        }

        const code = this.codeEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first');
            return;
        }

        this.isRunning = true;
        this.updateStatus('Running...', 'running');
        this.logsPanel.clear('output');
        this.logsPanel.clear('errors');
        this.codeEditor.clearErrors();

        try {
            // Use WebSocket for real-time output
            this.wsClient.execute(code, this.currentLanguage);

        } catch (error) {
            console.error('Execution failed:', error);
            this.logsPanel.append('errors', `Error: ${error.message}\n`);
            this.isRunning = false;
            this.updateStatus('Error', 'error');
        }
    }

    handleExecutionComplete(data) {
        this.isRunning = false;
        this.currentRunId = data.runId;

        if (data.exitCode === 0) {
            this.updateStatus('Success', 'ready');
            this.updateRunInfo(`✓ Completed in ${data.duration}ms`);
        } else {
            this.updateStatus('Failed', 'error');
            this.updateRunInfo(`✗ Exit code: ${data.exitCode}`);
        }
    }

    async autofix() {
        if (this.autofixInProgress) {
            console.log('Auto-fix already in progress...');
            return;
        }

        const code = this.codeEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first');
            return;
        }

        this.autofixInProgress = true;
        this.updateStatus('Auto-fixing...', 'running');
        this.logsPanel.clear('autofix');
        this.showAutofixModal(true);

        try {
            const result = await this.apiClient.autofix(code, this.currentLanguage, {
                maxRetries: 5,
                context: 'User requested auto-fix'
            });

            if (result.success) {
                this.codeEditor.setValue(result.finalCode);
                this.logsPanel.addAutofixAttempt(
                    result.attempts,
                    result.attempts,
                    null,
                    'Code fixed successfully!',
                    true
                );
                this.updateStatus('Auto-fix Complete', 'ready');
            } else {
                this.logsPanel.addAutofixAttempt(
                    result.attempts,
                    5,
                    'Max retries exceeded',
                    null,
                    false
                );
                this.updateStatus('Auto-fix Failed', 'error');
            }

            this.switchTab('autofix');

        } catch (error) {
            console.error('Auto-fix failed:', error);
            this.logsPanel.append('errors', `Auto-fix error: ${error.message}\n`);
            this.updateStatus('Auto-fix Error', 'error');
        } finally {
            this.autofixInProgress = false;
            this.showAutofixModal(false);
        }
    }

    handleFixAttempt(data) {
        this.logsPanel.addAutofixAttempt(
            data.attempt,
            data.totalAttempts,
            data.error,
            null,
            false
        );

        this.updateAutofixProgress(data.attempt, data.totalAttempts);
    }

    handleFixSuccess(data) {
        this.codeEditor.setValue(data.finalCode);
    }

    async build() {
        this.updateStatus('Building...', 'running');
        this.logsPanel.clear('build');
        this.switchTab('build');

        const buildCommands = {
            python: { tool: 'pip', command: 'install -r requirements.txt' },
            javascript: { tool: 'npm', command: 'install && npm run build' },
            typescript: { tool: 'npm', command: 'run build' },
            rust: { tool: 'cargo', command: 'build --release' },
            go: { tool: 'go', command: 'build' },
            java: { tool: 'maven', command: 'package' }
        };

        const buildConfig = buildCommands[this.currentLanguage];
        if (!buildConfig) {
            this.logsPanel.appendBuildOutput('No build command configured for this language', 'warning');
            this.updateStatus('Ready', 'ready');
            return;
        }

        try {
            const result = await this.apiClient.build(
                this.currentLanguage,
                buildConfig.tool,
                buildConfig.command
            );

            if (result.success) {
                this.logsPanel.appendBuildOutput('Build successful!', 'success');
                this.logsPanel.append('build', result.stdout);
                if (result.artifacts) {
                    this.logsPanel.appendBuildOutput(`Artifacts: ${result.artifacts.join(', ')}`, 'info');
                }
                this.updateStatus('Build Complete', 'ready');
            } else {
                this.logsPanel.appendBuildOutput('Build failed', 'error');
                this.logsPanel.append('build', result.stdout);
                this.updateStatus('Build Failed', 'error');
            }
        } catch (error) {
            this.logsPanel.appendBuildOutput(`Build error: ${error.message}`, 'error');
            this.updateStatus('Build Error', 'error');
        }
    }

    async testLinux() {
        this.updateStatus('Testing on Linux...', 'running');
        const code = this.codeEditor.getValue();

        try {
            const result = await this.apiClient.testLinux(code, {
                distribution: 'ubuntu-22.04'
            });

            this.logsPanel.appendBuildOutput(`Linux Test: ${result.success ? 'PASSED' : 'FAILED'}`, result.success ? 'success' : 'error');
            this.logsPanel.append('build', result.stdout);
            this.switchTab('build');
            this.updateStatus(result.success ? 'Linux Test Passed' : 'Linux Test Failed', result.success ? 'ready' : 'error');
        } catch (error) {
            this.logsPanel.appendBuildOutput(`Linux test error: ${error.message}`, 'error');
            this.updateStatus('Test Error', 'error');
        }
    }

    async testWindows() {
        this.updateStatus('Testing on Windows...', 'running');
        const code = this.codeEditor.getValue();

        try {
            const result = await this.apiClient.testWindows(code, {
                version: 'Windows-10'
            });

            this.logsPanel.appendBuildOutput(`Windows Test: ${result.success ? 'PASSED' : 'FAILED'}`, result.success ? 'success' : 'error');
            this.logsPanel.append('build', result.stdout);
            this.switchTab('build');
            this.updateStatus(result.success ? 'Windows Test Passed' : 'Windows Test Failed', result.success ? 'ready' : 'error');
        } catch (error) {
            this.logsPanel.appendBuildOutput(`Windows test error: ${error.message}`, 'error');
            this.updateStatus('Test Error', 'error');
        }
    }

    // File management
    handleFileSelect(file, content) {
        this.codeEditor.setValue(content);

        // Detect language from file extension
        const ext = file.name.split('.').pop().toLowerCase();
        const languageMap = {
            py: 'python',
            js: 'javascript',
            ts: 'typescript',
            jsx: 'javascript',
            tsx: 'typescript',
            java: 'java',
            rs: 'rust',
            go: 'go',
            cpp: 'cpp',
            c: 'cpp',
            cs: 'csharp',
            html: 'html',
            css: 'css',
            json: 'json',
            md: 'markdown'
        };

        if (languageMap[ext]) {
            this.currentLanguage = languageMap[ext];
            document.getElementById('languageSelect').value = this.currentLanguage;
            this.codeEditor.setLanguage(this.currentLanguage);
        }
    }

    async saveCurrentFile() {
        const file = this.fileTree.getSelectedFile();
        if (!file) {
            alert('No file selected');
            return;
        }

        const code = this.codeEditor.getValue();
        try {
            await this.apiClient.writeFile(file.path, code);
            this.updateRunInfo('✓ File saved');
            setTimeout(() => this.updateRunInfo(''), 2000);
        } catch (error) {
            alert(`Failed to save file: ${error.message}`);
        }
    }

    async createNewFile() {
        const name = prompt('Enter file name:');
        if (!name) return;

        try {
            await this.fileTree.createFile(name);
        } catch (error) {
            alert(`Failed to create file: ${error.message}`);
        }
    }

    handleCodeChange(code) {
        // Auto-save functionality could go here
    }

    handleCodeSave(code) {
        this.saveCurrentFile();
    }

    // UI methods
    switchTab(panelName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.panel === panelName) {
                tab.classList.add('active');
            }
        });

        // Update panel visibility
        document.querySelectorAll('.output-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${panelName}Panel`).classList.add('active');
    }

    updateStatus(text, state = 'ready') {
        const indicator = document.getElementById('statusIndicator');
        const statusText = indicator.querySelector('.status-text');

        statusText.textContent = text;
        indicator.className = `status-indicator ${state}`;
    }

    updateRunInfo(text) {
        document.getElementById('runInfo').textContent = text;
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = connected ? '🟢 Connected' : '🔴 Disconnected';
    }

    updateHealthStatus(health) {
        if (health.docker && health.docker.connected) {
            document.getElementById('dockerStatus').textContent = `🐳 Docker Ready (${health.docker.version})`;
        }

        if (health.vms) {
            const linuxStatus = health.vms.linux === 'running' ? '✓' : '✗';
            const windowsStatus = health.vms.windows === 'running' ? '✓' : '✗';
            document.getElementById('vmStatus').textContent = `🖥 VMs: Linux ${linuxStatus} | Windows ${windowsStatus}`;
        }
    }

    showAutofixModal(show) {
        const modal = document.getElementById('autofixModal');
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    }

    updateAutofixProgress(current, total) {
        const progress = (current / total) * 100;
        document.getElementById('autofixProgress').style.width = `${progress}%`;
        document.getElementById('autofixStatus').textContent = `Attempt ${current} of ${total}...`;
    }

    clearAll() {
        this.logsPanel.clearAll();
        this.codeEditor.clearErrors();
        this.updateStatus('Ready', 'ready');
        this.updateRunInfo('');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.devBoxApp = new DevBoxApp();
    await window.devBoxApp.init();
});
