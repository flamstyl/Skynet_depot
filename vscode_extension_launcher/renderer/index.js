// State management
let extensions = [];
let selectedExtension = null;
let showDisabled = false;

// DOM elements
const extensionsGrid = document.getElementById('extensions-grid');
const contextPanel = document.getElementById('context-panel');
const contextContent = document.getElementById('context-content');
const vscodeStatus = document.getElementById('vscode-status');
const extensionCount = document.getElementById('extension-count');
const logsModal = document.getElementById('logs-modal');
const logsContent = document.getElementById('logs-content');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// Initialize the application
async function init() {
  console.log('Initializing VS Code Extension Launcher...');

  // Check VS Code installation
  await checkVSCode();

  // Load extensions
  await loadExtensions();

  // Set up event listeners
  setupEventListeners();
}

/**
 * Check if VS Code is installed
 */
async function checkVSCode() {
  try {
    const response = await window.api.checkVSCode();

    if (response.success && response.data.installed) {
      setVSCodeStatus(true);
    } else {
      setVSCodeStatus(false);
    }
  } catch (error) {
    console.error('Error checking VS Code:', error);
    setVSCodeStatus(false);
  }
}

/**
 * Set VS Code status indicator
 */
function setVSCodeStatus(installed) {
  const statusDot = vscodeStatus.querySelector('.status-dot');
  const statusText = vscodeStatus.querySelector('.status-text');

  if (installed) {
    statusDot.className = 'status-dot status-dot-success';
    statusText.textContent = 'VS Code Detected';
  } else {
    statusDot.className = 'status-dot status-dot-error';
    statusText.textContent = 'VS Code Not Found';
  }
}

/**
 * Load all extensions
 */
async function loadExtensions() {
  try {
    const response = await window.api.getExtensions();

    if (!response.success) {
      showNotification('Failed to load extensions', 'error');
      return;
    }

    extensions = response.data;
    renderExtensions();
    updateExtensionCount();
  } catch (error) {
    console.error('Error loading extensions:', error);
    showNotification('Error loading extensions', 'error');
  }
}

/**
 * Render extensions grid
 */
function renderExtensions() {
  const filteredExtensions = showDisabled
    ? extensions
    : extensions.filter(ext => ext.enabled);

  if (filteredExtensions.length === 0) {
    extensionsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No extensions available</p>
      </div>
    `;
    return;
  }

  extensionsGrid.innerHTML = filteredExtensions.map(ext => createExtensionCard(ext)).join('');
}

/**
 * Create an extension card HTML
 */
function createExtensionCard(extension) {
  const disabledClass = extension.enabled ? '' : 'extension-card-disabled';
  const statusBadge = extension.enabled
    ? '<span class="badge badge-success">Active</span>'
    : '<span class="badge badge-disabled">Disabled</span>';

  return `
    <div class="extension-card ${disabledClass}" data-id="${extension.id}">
      <div class="extension-icon">${extension.icon || '📦'}</div>
      <div class="extension-info">
        <h3 class="extension-name">${extension.name}</h3>
        <p class="extension-description">${extension.description || 'No description'}</p>
        <div class="extension-meta">
          <span class="meta-item">
            <span class="meta-label">Agent:</span>
            <span class="meta-value agent-badge">${extension.agent}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">ID:</span>
            <span class="meta-value">${extension.vscode_id}</span>
          </span>
        </div>
      </div>
      <div class="extension-actions">
        ${statusBadge}
        <button class="btn btn-primary btn-launch" data-id="${extension.id}" ${!extension.enabled ? 'disabled' : ''}>
          <span class="btn-icon">🚀</span>
          Launch
        </button>
        <button class="btn btn-secondary btn-context" data-id="${extension.id}">
          <span class="btn-icon">📋</span>
          Context
        </button>
      </div>
    </div>
  `;
}

/**
 * Update extension count display
 */
function updateExtensionCount() {
  const enabledCount = extensions.filter(ext => ext.enabled).length;
  const totalCount = extensions.length;
  extensionCount.textContent = `${enabledCount} active / ${totalCount} total`;
}

/**
 * Launch an extension
 */
async function launchExtension(extensionId) {
  try {
    showNotification(`Launching extension...`, 'info');

    const response = await window.api.launchExtension(extensionId);

    if (response.success) {
      showNotification(`✓ ${response.data.message}`, 'success');
    } else {
      showNotification(`✗ ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('Error launching extension:', error);
    showNotification('Failed to launch extension', 'error');
  }
}

/**
 * Show context for an extension
 */
async function showContext(extensionId) {
  try {
    const response = await window.api.getContext(extensionId);

    if (!response.success) {
      showNotification('Failed to load context', 'error');
      return;
    }

    selectedExtension = extensions.find(ext => ext.id === extensionId);
    const { context, summary } = response.data;

    renderContext(context, summary);
    contextPanel.classList.add('context-panel-visible');
  } catch (error) {
    console.error('Error loading context:', error);
    showNotification('Error loading context', 'error');
  }
}

/**
 * Render context panel
 */
function renderContext(context, summary) {
  if (!context) {
    contextContent.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <p>No context available</p>
      </div>
    `;
    return;
  }

  contextContent.innerHTML = `
    <div class="context-details">
      <div class="context-header">
        <div class="extension-icon-large">${selectedExtension.icon || '📦'}</div>
        <div>
          <h4>${selectedExtension.name}</h4>
          <p class="context-summary">${summary}</p>
        </div>
      </div>

      <div class="context-section">
        <h5>Profile</h5>
        <div class="context-value">${context.profile || 'Not set'}</div>
      </div>

      ${context.memory_dir ? `
        <div class="context-section">
          <h5>Memory Directory</h5>
          <div class="context-value context-value-code">${context.memory_dir}</div>
        </div>
      ` : ''}

      ${context.workspace_path ? `
        <div class="context-section">
          <h5>Workspace Path</h5>
          <div class="context-value context-value-code">${context.workspace_path}</div>
        </div>
      ` : ''}

      ${context.instructions && context.instructions.length > 0 ? `
        <div class="context-section">
          <h5>Instructions (${context.instructions.length})</h5>
          <ul class="context-list">
            ${context.instructions.map(instr => `<li>${instr}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${context.env && Object.keys(context.env).length > 0 ? `
        <div class="context-section">
          <h5>Environment Variables (${Object.keys(context.env).length})</h5>
          <div class="context-env">
            ${Object.entries(context.env).map(([key, value]) => `
              <div class="env-item">
                <span class="env-key">${key}</span>
                <span class="env-value">${value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${context.files && context.files.length > 0 ? `
        <div class="context-section">
          <h5>Files (${context.files.length})</h5>
          <ul class="context-list">
            ${context.files.map(file => `<li class="context-value-code">${file}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="context-section">
        <h5>Raw JSON</h5>
        <pre class="context-json">${JSON.stringify(context, null, 2)}</pre>
      </div>
    </div>
  `;
}

/**
 * Close context panel
 */
function closeContext() {
  contextPanel.classList.remove('context-panel-visible');
  selectedExtension = null;
}

/**
 * Show logs modal
 */
async function showLogs() {
  logsModal.classList.add('modal-visible');
  await loadLogs();
}

/**
 * Load logs
 */
async function loadLogs() {
  try {
    const response = await window.api.getLogs(200);

    if (response.success) {
      logsContent.textContent = response.data || 'No logs available';
      logsContent.scrollTop = logsContent.scrollHeight;
    } else {
      logsContent.textContent = 'Failed to load logs';
    }
  } catch (error) {
    console.error('Error loading logs:', error);
    logsContent.textContent = 'Error loading logs';
  }
}

/**
 * Clear logs
 */
async function clearLogs() {
  try {
    const response = await window.api.clearLogs();

    if (response.success) {
      showNotification('Logs cleared', 'success');
      await loadLogs();
    } else {
      showNotification('Failed to clear logs', 'error');
    }
  } catch (error) {
    console.error('Error clearing logs:', error);
    showNotification('Error clearing logs', 'error');
  }
}

/**
 * Close logs modal
 */
function closeLogs() {
  logsModal.classList.remove('modal-visible');
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ️',
    warning: '⚠️'
  };

  toastIcon.textContent = icons[type] || icons.info;
  toastMessage.textContent = message;
  toast.className = `toast toast-${type} toast-visible`;

  setTimeout(() => {
    toast.classList.remove('toast-visible');
  }, 3000);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Extension actions (using event delegation)
  extensionsGrid.addEventListener('click', (e) => {
    const launchBtn = e.target.closest('.btn-launch');
    const contextBtn = e.target.closest('.btn-context');

    if (launchBtn) {
      const extensionId = launchBtn.dataset.id;
      launchExtension(extensionId);
    } else if (contextBtn) {
      const extensionId = contextBtn.dataset.id;
      showContext(extensionId);
    }
  });

  // Header actions
  document.getElementById('refresh-btn').addEventListener('click', () => {
    loadExtensions();
    showNotification('Extensions refreshed', 'success');
  });

  document.getElementById('logs-btn').addEventListener('click', showLogs);

  // Show disabled checkbox
  document.getElementById('show-disabled').addEventListener('change', (e) => {
    showDisabled = e.target.checked;
    renderExtensions();
  });

  // Context panel
  document.getElementById('close-context-btn').addEventListener('click', closeContext);

  // Logs modal
  document.getElementById('close-logs-btn').addEventListener('click', closeLogs);
  document.getElementById('clear-logs-btn').addEventListener('click', clearLogs);

  // Close modal on background click
  logsModal.addEventListener('click', (e) => {
    if (e.target === logsModal) {
      closeLogs();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (logsModal.classList.contains('modal-visible')) {
        closeLogs();
      } else if (contextPanel.classList.contains('context-panel-visible')) {
        closeContext();
      }
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
