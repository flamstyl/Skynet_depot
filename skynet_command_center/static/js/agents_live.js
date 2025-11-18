/**
 * Skynet Command Center - Agents Management
 * ==========================================
 * Handles agent control and live updates
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[AGENTS] Initializing...');

    loadAgents();

    // Refresh button
    document.getElementById('refresh-agents').addEventListener('click', loadAgents);
});

/**
 * Load all agents
 */
async function loadAgents() {
    try {
        const response = await fetch('/api/agents');
        const data = await response.json();

        if (data.success) {
            renderAgentsTable(data.agents);
        } else {
            console.error('[AGENTS] Error:', data.error);
        }
    } catch (error) {
        console.error('[AGENTS] Fetch error:', error);
    }
}

/**
 * Render agents table
 */
function renderAgentsTable(agents) {
    const tbody = document.getElementById('agents-tbody');

    if (agents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No agents configured</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    agents.forEach(agent => {
        const row = document.createElement('tr');

        // Status
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${agent.status}`;
        statusBadge.textContent = agent.status.toUpperCase();
        statusCell.appendChild(statusBadge);

        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = agent.name;

        // PID
        const pidCell = document.createElement('td');
        pidCell.textContent = agent.pid || '-';

        // Last Update
        const updateCell = document.createElement('td');
        updateCell.textContent = formatTime(agent.last_update);

        // Actions
        const actionsCell = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '8px';

        if (agent.status === 'online') {
            const stopBtn = createButton('Stop', 'btn-danger', () => stopAgent(agent.name));
            const restartBtn = createButton('Restart', 'btn-secondary', () => restartAgent(agent.name));
            actionsDiv.appendChild(stopBtn);
            actionsDiv.appendChild(restartBtn);
        } else {
            const startBtn = createButton('Start', 'btn-primary', () => startAgent(agent.name));
            actionsDiv.appendChild(startBtn);
        }

        actionsCell.appendChild(actionsDiv);

        row.appendChild(statusCell);
        row.appendChild(nameCell);
        row.appendChild(pidCell);
        row.appendChild(updateCell);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });
}

/**
 * Create button element
 */
function createButton(text, className, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = `btn ${className}`;
    btn.style.padding = '6px 12px';
    btn.style.fontSize = '12px';
    btn.addEventListener('click', onClick);
    return btn;
}

/**
 * Start agent
 */
async function startAgent(name) {
    try {
        const response = await fetch(`/api/agents/${name}/start`, { method: 'POST' });
        const result = await response.json();

        alert(result.message);
        loadAgents();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

/**
 * Stop agent
 */
async function stopAgent(name) {
    if (!confirm(`Stop agent ${name}?`)) return;

    try {
        const response = await fetch(`/api/agents/${name}/stop`, { method: 'POST' });
        const result = await response.json();

        alert(result.message);
        loadAgents();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

/**
 * Restart agent
 */
async function restartAgent(name) {
    if (!confirm(`Restart agent ${name}?`)) return;

    try {
        const response = await fetch(`/api/agents/${name}/restart`, { method: 'POST' });
        const result = await response.json();

        alert(result.message);
        loadAgents();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
    if (!timestamp) return '-';

    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch (e) {
        return timestamp;
    }
}
