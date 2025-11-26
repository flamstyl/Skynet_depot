// ===== HISTORY PANEL MANAGER =====

const historyList = document.getElementById('history-list');
const historySearch = document.getElementById('history-search');

let allHistory = [];
let filteredHistory = [];

// Initialize
init();

function init() {
  historySearch.addEventListener('input', handleSearch);
  loadHistoryPanel();

  // Refresh every 5 seconds
  setInterval(loadHistoryPanel, 5000);
}

async function loadHistoryPanel() {
  try {
    const result = await window.historyAPI.list({ limit: 100 });

    if (result.success && result.history) {
      allHistory = result.history;
      filteredHistory = allHistory;
      renderHistory();
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();

  if (!query) {
    filteredHistory = allHistory;
  } else {
    filteredHistory = allHistory.filter(item =>
      item.command.toLowerCase().includes(query)
    );
  }

  renderHistory();
}

function renderHistory() {
  if (filteredHistory.length === 0) {
    historyList.innerHTML = '<p class="placeholder">No commands found...</p>';
    return;
  }

  historyList.innerHTML = '';

  filteredHistory.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';

    const statusClass = item.exitCode === 0 ? 'status-success' : 'status-error';
    const timeStr = formatTime(item.timestamp);

    historyItem.innerHTML = `
      <div class="history-command">${escapeHtml(item.command)}</div>
      <div class="history-time">
        ${timeStr}
        <span class="history-status ${statusClass}"></span>
      </div>
    `;

    // Click to re-execute
    historyItem.addEventListener('click', () => {
      window.insertCommand(item.command);
    });

    historyList.appendChild(historyItem);
  });
}

function formatTime(timestamp) {
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

  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // More than 1 day
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose to window
window.refreshHistoryPanel = loadHistoryPanel;

console.log('History panel initialized');
