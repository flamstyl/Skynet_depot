// ===== MEMORY PANEL MANAGER =====

const memorySession = document.getElementById('memory-session');
const memoryLongterm = document.getElementById('memory-longterm');
const btnSessionSummary = document.getElementById('btn-session-summary');

// Initialize
init();

function init() {
  btnSessionSummary.addEventListener('click', showSessionSummary);
  loadMemory();

  // Refresh every 30 seconds
  setInterval(loadMemory, 30000);
}

async function loadMemory() {
  await loadSessionMemory();
  await loadLongtermMemory();
}

async function loadSessionMemory() {
  try {
    const result = await window.memoryAPI.getSession();

    if (result.success && result.memory) {
      renderSessionMemory(result.memory);
    } else {
      memorySession.innerHTML = '<p class="placeholder">No session memory available</p>';
    }
  } catch (error) {
    console.error('Failed to load session memory:', error);
    memorySession.innerHTML = `<p class="placeholder">Error: ${error.message}</p>`;
  }
}

async function loadLongtermMemory() {
  try {
    const result = await window.memoryAPI.getLongTerm();

    if (result.success && result.memory) {
      renderLongtermMemory(result.memory);
    } else {
      memoryLongterm.innerHTML = '<p class="placeholder">No long-term memory available</p>';
    }
  } catch (error) {
    console.error('Failed to load long-term memory:', error);
    memoryLongterm.innerHTML = `<p class="placeholder">Error: ${error.message}</p>`;
  }
}

function renderSessionMemory(memory) {
  let html = '';

  if (memory.sessionId) {
    html += `<div><span class="memory-key">Session ID:</span><span class="memory-value">${memory.sessionId.substring(0, 8)}...</span></div>`;
  }

  if (memory.startedAt) {
    const startTime = new Date(memory.startedAt).toLocaleString();
    html += `<div><span class="memory-key">Started:</span><span class="memory-value">${startTime}</span></div>`;
  }

  if (memory.commands && Array.isArray(memory.commands)) {
    html += `<div><span class="memory-key">Commands:</span><span class="memory-value">${memory.commands.length}</span></div>`;
  }

  if (memory.objectives && Array.isArray(memory.objectives)) {
    html += `<div><span class="memory-key">Objectives:</span></div>`;
    html += '<ul style="margin-left: 20px; margin-top: 8px;">';
    memory.objectives.forEach(obj => {
      html += `<li style="color: var(--color-text); margin-bottom: 4px;">${escapeHtml(obj)}</li>`;
    });
    html += '</ul>';
  }

  if (memory.errors && Array.isArray(memory.errors) && memory.errors.length > 0) {
    html += `<div style="margin-top: 12px;"><span class="memory-key">Recent Errors:</span><span class="memory-value" style="color: var(--color-danger);">${memory.errors.length}</span></div>`;
  }

  if (memory.summary) {
    html += `<div style="margin-top: 12px;"><span class="memory-key">Summary:</span></div>`;
    html += `<div style="margin-top: 8px; padding: 8px; background: var(--color-bg-dark); border-radius: 4px; font-size: 0.8rem; color: var(--color-text-dim);">${escapeHtml(memory.summary)}</div>`;
  }

  memorySession.innerHTML = html || '<p class="placeholder">Empty session memory</p>';
}

function renderLongtermMemory(memory) {
  let html = '';

  if (memory.userId) {
    html += `<div><span class="memory-key">User:</span><span class="memory-value">${escapeHtml(memory.userId)}</span></div>`;
  }

  if (memory.patterns) {
    html += `<div style="margin-top: 12px;"><span class="memory-key">Patterns:</span></div>`;

    if (memory.patterns.mostUsedCommands && Array.isArray(memory.patterns.mostUsedCommands)) {
      html += '<div style="margin-top: 8px; margin-left: 12px;"><strong style="color: var(--color-secondary); font-size: 0.8rem;">Most Used:</strong></div>';
      html += '<ul style="margin-left: 24px; margin-top: 4px;">';
      memory.patterns.mostUsedCommands.slice(0, 5).forEach(cmd => {
        html += `<li style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text); margin-bottom: 2px;">${escapeHtml(cmd)}</li>`;
      });
      html += '</ul>';
    }

    if (memory.patterns.preferredShell) {
      html += `<div style="margin-top: 8px; margin-left: 12px;"><strong style="color: var(--color-secondary); font-size: 0.8rem;">Preferred Shell:</strong> ${escapeHtml(memory.patterns.preferredShell)}</div>`;
    }

    if (memory.patterns.workingHours) {
      html += `<div style="margin-top: 4px; margin-left: 12px;"><strong style="color: var(--color-secondary); font-size: 0.8rem;">Working Hours:</strong> ${escapeHtml(memory.patterns.workingHours)}</div>`;
    }
  }

  if (memory.preferences) {
    html += `<div style="margin-top: 12px;"><span class="memory-key">Preferences:</span></div>`;

    if (memory.preferences.aiProvider) {
      html += `<div style="margin-left: 12px; margin-top: 4px;"><strong style="color: var(--color-secondary); font-size: 0.8rem;">AI Provider:</strong> ${escapeHtml(memory.preferences.aiProvider)}</div>`;
    }

    if (memory.preferences.suggestionMode) {
      html += `<div style="margin-left: 12px; margin-top: 4px;"><strong style="color: var(--color-secondary); font-size: 0.8rem;">Suggestion Mode:</strong> ${escapeHtml(memory.preferences.suggestionMode)}</div>`;
    }
  }

  memoryLongterm.innerHTML = html || '<p class="placeholder">Empty long-term memory</p>';
}

async function showSessionSummary() {
  const confirmed = confirm('Generate AI summary of current session?');

  if (!confirmed) {
    return;
  }

  try {
    const result = await window.sessionAPI.getSummary();

    if (result.success && result.summary) {
      alert(`Session Summary:\n\n${result.summary}`);
      await loadSessionMemory(); // Reload to show updated summary
    } else {
      alert(`Failed to generate summary: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Failed to get session summary:', error);
    alert(`Error: ${error.message}`);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose to window
window.updateSessionMemory = loadSessionMemory;

console.log('Memory panel initialized');
