// ===== ALIAS PANEL MANAGER =====

const aliasList = document.getElementById('alias-list');
const btnNewAlias = document.getElementById('btn-new-alias');

let allAliases = [];

// Initialize
init();

function init() {
  btnNewAlias.addEventListener('click', createNewAlias);
  loadAliases();

  // Refresh every 10 seconds
  setInterval(loadAliases, 10000);
}

async function loadAliases() {
  try {
    const result = await window.aliasAPI.list();

    if (result.success && result.aliases) {
      allAliases = result.aliases;
      renderAliases();
    }
  } catch (error) {
    console.error('Failed to load aliases:', error);
  }
}

function renderAliases() {
  if (allAliases.length === 0) {
    aliasList.innerHTML = '<p class="placeholder">No aliases defined...</p>';
    return;
  }

  aliasList.innerHTML = '';

  allAliases.forEach(alias => {
    const aliasItem = document.createElement('div');
    aliasItem.className = 'alias-item';

    aliasItem.innerHTML = `
      <div class="alias-natural">"${escapeHtml(alias.natural)}"</div>
      <div class="alias-command">${escapeHtml(alias.command)}</div>
      ${alias.description ? `<div class="alias-description">${escapeHtml(alias.description)}</div>` : ''}
      <div class="alias-actions">
        <button class="btn-icon btn-use" data-command="${escapeHtml(alias.command)}" title="Use this alias">▶️</button>
        <button class="btn-icon btn-delete" data-natural="${escapeHtml(alias.natural)}" title="Delete alias">🗑️</button>
      </div>
    `;

    aliasList.appendChild(aliasItem);
  });

  // Add event listeners to action buttons
  document.querySelectorAll('.btn-use').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const command = e.target.getAttribute('data-command');
      window.insertCommand(command);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const natural = e.target.getAttribute('data-natural');
      await deleteAlias(natural);
    });
  });
}

async function createNewAlias() {
  const natural = prompt('Enter a natural language phrase:');

  if (!natural || !natural.trim()) {
    return;
  }

  const command = prompt('Enter the shell command:');

  if (!command || !command.trim()) {
    return;
  }

  const description = prompt('Enter a description (optional):') || '';

  try {
    const result = await window.aliasAPI.save({
      natural: natural.trim(),
      command: command.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString()
    });

    if (result.success) {
      alert('Alias created successfully!');
      await loadAliases();
    } else {
      alert(`Failed to create alias: ${result.error}`);
    }
  } catch (error) {
    console.error('Failed to create alias:', error);
    alert(`Error: ${error.message}`);
  }
}

async function deleteAlias(natural) {
  const confirmed = confirm(`Delete alias: "${natural}"?`);

  if (!confirmed) {
    return;
  }

  try {
    const result = await window.aliasAPI.delete(natural);

    if (result.success) {
      await loadAliases();
    } else {
      alert(`Failed to delete alias: ${result.error}`);
    }
  } catch (error) {
    console.error('Failed to delete alias:', error);
    alert(`Error: ${error.message}`);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabName = e.target.getAttribute('data-tab');

    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Add active class to selected tab
    e.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
  });
});

console.log('Alias panel initialized');
