/**
 * RelayMCP Dashboard JavaScript
 * Real-time updates and visualization
 */

// Configuration
const REFRESH_INTERVAL = 5000; // 5 seconds
const API_BASE = '';  // Same origin

// State
let refreshTimer = null;
let countdown = 5;
let lastUpdate = null;

// AI Icons mapping
const AI_ICONS = {
    'claude': '🧠',
    'gpt': '🤖',
    'gemini': '✨',
    'perplexity': '🔍',
    'default': '💡'
};

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('RelayMCP Dashboard initializing...');

    // Initial data load
    updateDashboard();

    // Setup auto-refresh
    startAutoRefresh();

    // Setup manual refresh button
    document.getElementById('refresh-messages').addEventListener('click', () => {
        updateDashboard();
    });

    console.log('Dashboard initialized');
});

/**
 * Start auto-refresh countdown
 */
function startAutoRefresh() {
    countdown = 5;
    updateCountdown();

    refreshTimer = setInterval(() => {
        countdown--;
        updateCountdown();

        if (countdown <= 0) {
            updateDashboard();
            countdown = 5;
        }
    }, 1000);
}

/**
 * Update countdown display
 */
function updateCountdown() {
    const countdownEl = document.getElementById('refresh-countdown');
    if (countdownEl) {
        countdownEl.textContent = countdown;
    }
}

/**
 * Main update function - fetches all data
 */
async function updateDashboard() {
    console.log('Updating dashboard...');

    try {
        // Fetch stats and connections
        await Promise.all([
            updateStats(),
            updateRecentMessages(),
            updateBuffer()
        ]);

        // Update status indicator
        setStatus('connected');
        lastUpdate = new Date();
        updateLastUpdateTime();

    } catch (error) {
        console.error('Dashboard update failed:', error);
        setStatus('error');
    }
}

/**
 * Update statistics panel
 */
async function updateStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const stats = data.stats;
        const connections = data.connections;

        // Update connections list
        updateConnectionsList(connections.connections || []);

        // Update stats grid
        const messageBusStats = stats.message_bus || {};
        document.getElementById('stat-total').textContent = messageBusStats.total_processed || 0;
        document.getElementById('stat-latency').textContent = `${messageBusStats.avg_latency_ms || 0}ms`;
        document.getElementById('stat-errors').textContent = `${((messageBusStats.error_rate || 0) * 100).toFixed(1)}%`;

        // Update buffer utilization
        const bufferStats = stats.buffer || {};
        document.getElementById('stat-buffer').textContent = `${bufferStats.utilization_percent || 0}%`;

        // Update activity chart
        updateActivityChart(messageBusStats.by_ai || {});

        // Update connection graph
        updateConnectionGraph(connections.connections || [], messageBusStats.by_ai || {});

    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

/**
 * Update connections list
 */
function updateConnectionsList(connections) {
    const container = document.getElementById('connections-list');

    if (connections.length === 0) {
        container.innerHTML = '<p class="loading">No active connections</p>';
        return;
    }

    container.innerHTML = connections.map(aiKey => {
        const icon = AI_ICONS[aiKey.toLowerCase()] || AI_ICONS.default;
        return `
            <div class="connection-item">
                <span class="connection-icon">${icon}</span>
                <span class="connection-name">${aiKey.toUpperCase()}</span>
                <span class="connection-badge">ACTIVE</span>
            </div>
        `;
    }).join('');
}

/**
 * Update activity chart
 */
function updateActivityChart(byAI) {
    const container = document.getElementById('activity-chart');

    if (Object.keys(byAI).length === 0) {
        container.innerHTML = '<p class="loading">No activity data</p>';
        return;
    }

    // Find max for scaling
    const max = Math.max(...Object.values(byAI), 1);

    container.innerHTML = Object.entries(byAI)
        .sort((a, b) => b[1] - a[1])
        .map(([ai, count]) => {
            const percentage = (count / max) * 100;
            return `
                <div class="activity-bar">
                    <span class="activity-label">${ai.toUpperCase()}</span>
                    <div class="activity-bar-bg">
                        <div class="activity-bar-fill" style="width: ${percentage}%">
                            ${count}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
}

/**
 * Update recent messages
 */
async function updateRecentMessages() {
    try {
        const response = await fetch(`${API_BASE}/api/recent_logs`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const messages = data.logs || [];
        const container = document.getElementById('recent-messages');

        if (messages.length === 0) {
            container.innerHTML = '<p class="loading">No recent messages</p>';
            return;
        }

        container.innerHTML = messages.slice(0, 20).map(entry => {
            const msg = entry.message;
            const resp = entry.response;

            const timestamp = new Date(msg.metadata?.timestamp || Date.now()).toLocaleTimeString();
            const from = msg.from || 'unknown';
            const to = msg.to || 'unknown';
            const content = msg.payload?.content || 'No content';
            const status = resp?.status || 'pending';

            return `
                <div class="message-item">
                    <div class="message-header">
                        <span class="message-route">${from.toUpperCase()} → ${to.toUpperCase()}</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-content" title="${content}">
                        ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}
                    </div>
                    <div class="message-status" style="color: ${status === 'ok' ? 'var(--accent-success)' : 'var(--accent-warning)'}; font-size: 0.8rem; margin-top: 5px;">
                        Status: ${status.toUpperCase()}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to update messages:', error);
    }
}

/**
 * Update buffer panel
 */
async function updateBuffer() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const bufferStats = data.stats.buffer || {};
        const total = bufferStats.total_messages || 0;
        const maxSize = bufferStats.max_size || 10000;
        const utilization = bufferStats.utilization_percent || 0;

        document.getElementById('buffer-count').textContent = total;
        document.getElementById('buffer-max').textContent = maxSize;
        document.getElementById('buffer-util').textContent = `${utilization}%`;

        const bufferBar = document.getElementById('buffer-bar');
        bufferBar.style.width = `${utilization}%`;
        bufferBar.textContent = `${utilization.toFixed(1)}%`;

        // Change color based on utilization
        if (utilization > 80) {
            bufferBar.style.background = 'linear-gradient(90deg, var(--accent-warning), var(--accent-error))';
        } else {
            bufferBar.style.background = 'linear-gradient(90deg, var(--accent-success), var(--accent-primary))';
        }

    } catch (error) {
        console.error('Failed to update buffer:', error);
    }
}

/**
 * Update connection graph (simplified visualization)
 */
function updateConnectionGraph(connections, byAI) {
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 250;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (connections.length === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No connections to display', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Draw simple network graph
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;

    // Draw center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#00d9ff';
    ctx.fill();
    ctx.strokeStyle = '#7b2cbf';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#0a0e27';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RELAY', centerX, centerY + 4);

    // Draw connections
    connections.forEach((ai, index) => {
        const angle = (index / connections.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Draw line to connection
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = '#1a1f3a';
        ctx.fill();
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label
        ctx.fillStyle = '#e8e8e8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ai.toUpperCase().substring(0, 4), x, y + 30);
    });
}

/**
 * Set connection status
 */
function setStatus(status) {
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    const dot = indicator.querySelector('.status-dot');

    if (status === 'connected') {
        text.textContent = 'Connected';
        dot.classList.remove('error');
    } else {
        text.textContent = 'Connection Error';
        dot.classList.add('error');
    }
}

/**
 * Update last update time
 */
function updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdate) {
        lastUpdateEl.textContent = `Last update: ${lastUpdate.toLocaleTimeString()}`;
    }
}
