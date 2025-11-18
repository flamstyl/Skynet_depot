/**
 * Skynet Command Center - Dashboard Auto-Refresh
 * ==============================================
 * Handles auto-refresh of all dashboard panels
 */

// Configuration
const REFRESH_INTERVAL = 2000; // 2 seconds

// State
let refreshTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DASHBOARD] Initializing...');

    // Initial load
    refreshDashboard();

    // Start auto-refresh
    startAutoRefresh();

    // Terminal input handler
    setupTerminalInput();
});

/**
 * Refresh all dashboard data
 */
async function refreshDashboard() {
    try {
        const response = await fetch('/api/dashboard/summary');
        const data = await response.json();

        if (data.success) {
            updateAgentsPanel(data.agents);
            updateMemoryPanel(data.memory);
            updateLogsPanel(data.logs);
        } else {
            console.error('[DASHBOARD] Error:', data.error);
        }
    } catch (error) {
        console.error('[DASHBOARD] Fetch error:', error);
    }
}

/**
 * Update agents panel
 */
function updateAgentsPanel(agentsData) {
    // Update summary counts
    document.getElementById('agents-online').textContent = agentsData.online;
    document.getElementById('agents-offline').textContent = agentsData.offline;
    document.getElementById('agents-error').textContent = agentsData.error;

    // Update agents list
    const agentsList = document.getElementById('agents-list');

    if (agentsData.agents.length === 0) {
        agentsList.innerHTML = '<p class="loading">No agents configured</p>';
        return;
    }

    agentsList.innerHTML = '';

    agentsData.agents.forEach(agent => {
        const item = document.createElement('div');
        item.className = 'agent-item';

        const statusDot = document.createElement('div');
        statusDot.className = `agent-status ${agent.status}`;

        const name = document.createElement('div');
        name.className = 'agent-name';
        name.textContent = agent.name;

        const pid = document.createElement('div');
        pid.className = 'agent-pid';
        pid.textContent = agent.pid ? `PID: ${agent.pid}` : 'Offline';

        item.appendChild(statusDot);
        item.appendChild(name);
        item.appendChild(pid);

        agentsList.appendChild(item);
    });

    // Flash refresh indicator
    flashIndicator('agents-refresh');
}

/**
 * Update memory panel
 */
function updateMemoryPanel(memoryData) {
    document.getElementById('memory-files').textContent = `${memoryData.total_files} files`;
    document.getElementById('memory-size').textContent = memoryData.total_size;
    document.getElementById('memory-updated').textContent = formatTimestamp(memoryData.last_updated);

    flashIndicator('memory-refresh');
}

/**
 * Update logs panel
 */
function updateLogsPanel(logsData) {
    const logsContainer = document.getElementById('logs-container');

    if (logsData.latest.length === 0) {
        logsContainer.innerHTML = '<p class="loading">No logs available</p>';
        return;
    }

    logsContainer.innerHTML = '';

    logsData.latest.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = formatTimestamp(log.timestamp);

        const level = document.createElement('span');
        level.className = `log-level ${log.level}`;
        level.textContent = log.level;

        const source = document.createElement('span');
        source.className = 'log-source';
        source.textContent = `[${log.source}]`;

        const message = document.createElement('span');
        message.className = 'log-message';
        message.textContent = log.message;

        entry.appendChild(timestamp);
        entry.appendChild(level);
        entry.appendChild(source);
        entry.appendChild(message);

        logsContainer.appendChild(entry);
    });

    flashIndicator('logs-refresh');
}

/**
 * Setup terminal input handler
 */
function setupTerminalInput() {
    const input = document.getElementById('terminal-input');

    if (!input) return;

    input.addEventListener('keypress', async function(e) {
        if (e.key === 'Enter') {
            const command = input.value.trim();

            if (!command) return;

            // Add command to output
            addTerminalLine(`skynet@command-center:~$ ${command}`, 'prompt');

            // Clear input
            input.value = '';

            // Execute command
            try {
                const response = await fetch('/api/terminal/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command: command })
                });

                const result = await response.json();

                if (result.output === '__CLEAR__') {
                    clearTerminalOutput();
                } else {
                    addTerminalLine(result.output, result.success ? 'text' : 'error');
                }
            } catch (error) {
                addTerminalLine(`Error: ${error.message}`, 'error');
            }
        }
    });
}

/**
 * Add line to terminal output
 */
function addTerminalLine(text, type) {
    const output = document.getElementById('terminal-output');
    const line = document.createElement('div');
    line.className = 'terminal-line';

    if (type === 'prompt') {
        line.innerHTML = `<span class="terminal-text">${text}</span>`;
    } else if (type === 'error') {
        line.innerHTML = `<span class="terminal-text" style="color: var(--error);">${text}</span>`;
    } else {
        line.innerHTML = `<span class="terminal-text">${text}</span>`;
    }

    output.appendChild(line);

    // Scroll to bottom
    output.scrollTop = output.scrollHeight;

    // Limit lines
    while (output.children.length > 50) {
        output.removeChild(output.firstChild);
    }
}

/**
 * Clear terminal output
 */
function clearTerminalOutput() {
    const output = document.getElementById('terminal-output');
    output.innerHTML = `
        <div class="terminal-line">
            <span class="terminal-prompt">skynet@command-center:~$</span>
            <span class="terminal-text">Terminal cleared</span>
        </div>
    `;
}

/**
 * Flash refresh indicator
 */
function flashIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
        indicator.style.color = 'var(--success)';
        setTimeout(() => {
            indicator.style.color = '';
        }, 300);
    }
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp) {
    if (!timestamp || timestamp === 'Never') return 'Never';

    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }

        // Format as date
        return date.toLocaleString();
    } catch (e) {
        return timestamp;
    }
}

/**
 * Start auto-refresh
 */
function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(refreshDashboard, REFRESH_INTERVAL);
    console.log('[DASHBOARD] Auto-refresh started');
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
        console.log('[DASHBOARD] Auto-refresh stopped');
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});
