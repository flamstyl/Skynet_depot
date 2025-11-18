/**
 * Skynet Command Center - Logs Loader
 * ====================================
 * Handles log viewing and filtering
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[LOGS] Initializing...');

    loadLogs();

    // Button handlers
    document.getElementById('refresh-logs').addEventListener('click', loadLogs);
    document.getElementById('clear-logs').addEventListener('click', clearLogs);
    document.getElementById('level-filter').addEventListener('change', onFilterChange);
});

/**
 * Load logs
 */
async function loadLogs() {
    const level = document.getElementById('level-filter').value;

    try {
        let url = '/api/logs/latest?limit=100';

        // Apply level filter if selected
        if (level) {
            url = `/api/logs/level/${level}?limit=100`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderLogs(data.logs);
        } else {
            console.error('[LOGS] Error:', data.error);
        }
    } catch (error) {
        console.error('[LOGS] Fetch error:', error);
    }
}

/**
 * Render logs
 */
function renderLogs(logs) {
    const container = document.getElementById('logs-container-full');

    if (logs.length === 0) {
        container.innerHTML = '<p class="loading">No logs available</p>';
        return;
    }

    container.innerHTML = '';

    logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.style.padding = '10px';
        entry.style.borderBottom = '1px solid var(--border)';

        const header = document.createElement('div');
        header.style.marginBottom = '5px';

        const timestamp = document.createElement('span');
        timestamp.style.color = 'var(--text-secondary)';
        timestamp.style.marginRight = '10px';
        timestamp.textContent = formatTime(log.timestamp);

        const level = document.createElement('span');
        level.style.fontWeight = 'bold';
        level.style.marginRight = '10px';
        level.style.color = getLevelColor(log.level);
        level.textContent = `[${log.level}]`;

        const source = document.createElement('span');
        source.style.color = 'var(--success)';
        source.style.marginRight = '10px';
        source.textContent = `[${log.source}]`;

        header.appendChild(timestamp);
        header.appendChild(level);
        header.appendChild(source);

        const message = document.createElement('div');
        message.style.color = 'var(--text-primary)';
        message.textContent = log.message;

        entry.appendChild(header);
        entry.appendChild(message);

        container.appendChild(entry);
    });
}

/**
 * Get color for log level
 */
function getLevelColor(level) {
    switch (level.toUpperCase()) {
        case 'ERROR':
            return 'var(--error)';
        case 'WARNING':
            return 'var(--warning)';
        case 'INFO':
            return 'var(--accent)';
        default:
            return 'var(--text-primary)';
    }
}

/**
 * Clear logs
 */
async function clearLogs() {
    if (!confirm('Clear all logs?')) return;

    try {
        const response = await fetch('/api/logs/clear', { method: 'POST' });
        const result = await response.json();

        if (result.success) {
            alert('Logs cleared successfully');
            loadLogs();
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

/**
 * Handle filter change
 */
function onFilterChange() {
    loadLogs();
}

/**
 * Format time
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
