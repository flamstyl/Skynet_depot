// ===== SUGGESTIONS UI MANAGER =====

const suggestionsPanel = document.getElementById('suggestions-panel');
const suggestionsContent = document.getElementById('suggestions-content');
const btnToggleSuggestions = document.getElementById('btn-toggle-suggestions');
const btnCloseSuggestions = document.getElementById('btn-close-suggestions');

let suggestionDebounceTimer = null;
const DEBOUNCE_DELAY = 500; // ms

// Initialize
init();

function init() {
  btnToggleSuggestions.addEventListener('click', togglePanel);
  btnCloseSuggestions.addEventListener('click', togglePanel);
}

function togglePanel() {
  suggestionsPanel.classList.toggle('hidden');
}

async function requestSuggestion(text, force = false) {
  // Clear previous timer
  if (suggestionDebounceTimer) {
    clearTimeout(suggestionDebounceTimer);
  }

  // If force, execute immediately
  if (force) {
    await fetchSuggestion(text);
    return;
  }

  // Otherwise, debounce
  suggestionDebounceTimer = setTimeout(async () => {
    await fetchSuggestion(text);
  }, DEBOUNCE_DELAY);
}

async function fetchSuggestion(text) {
  // Show loading
  showLoading();

  try {
    // Get session memory for context
    const memoryResult = await window.memoryAPI.getSession();
    const context = memoryResult.success ? memoryResult.memory : {};

    // Request suggestion from IA
    const result = await window.iaAPI.suggest(text, context);

    if (result.success && result.suggestions && result.suggestions.length > 0) {
      displaySuggestions(result.suggestions);
    } else {
      showError(result.error || 'No suggestions available');
    }

  } catch (error) {
    console.error('Suggestion error:', error);
    showError(error.message);
  }
}

function displaySuggestions(suggestions) {
  suggestionsContent.innerHTML = '';

  suggestions.forEach((suggestion, index) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';

    // Determine badge
    let badge = '';
    let badgeClass = '';

    if (suggestion.safety === 'safe') {
      badge = '🟢 SAFE';
      badgeClass = 'badge-safe';
    } else if (suggestion.safety === 'danger') {
      badge = '🔴 DANGER';
      badgeClass = 'badge-danger';
    } else {
      badge = '🟡 COMPLEX';
      badgeClass = 'badge-complex';
    }

    item.innerHTML = `
      <div class="suggestion-badge ${badgeClass}">${badge}</div>
      <div class="suggestion-command">${escapeHtml(suggestion.command)}</div>
      <div class="suggestion-explanation">${escapeHtml(suggestion.explanation || '')}</div>
    `;

    // Click to insert
    item.addEventListener('click', () => {
      window.insertCommand(suggestion.command);
    });

    suggestionsContent.appendChild(item);
  });

  // Show panel if hidden
  if (suggestionsPanel.classList.contains('hidden')) {
    suggestionsPanel.classList.remove('hidden');
  }
}

function showLoading() {
  suggestionsContent.innerHTML = `
    <p class="suggestions-placeholder loading">⏳ Getting AI suggestions...</p>
  `;
}

function showError(message) {
  suggestionsContent.innerHTML = `
    <p class="suggestions-placeholder">❌ ${escapeHtml(message)}</p>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose to window
window.requestSuggestion = requestSuggestion;

console.log('Suggestions UI initialized');
