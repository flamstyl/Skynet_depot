// ===== TERMINAL UI MANAGER =====

const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const btnExecute = document.getElementById('btn-execute');
const btnClear = document.getElementById('btn-clear');

// History navigation
let commandHistory = [];
let historyIndex = -1;
let currentInput = '';

// Initialize
init();

function init() {
  // Event listeners
  terminalInput.addEventListener('keydown', handleKeyDown);
  terminalInput.addEventListener('input', handleInput);
  btnExecute.addEventListener('click', executeCommand);
  btnClear.addEventListener('click', clearTerminal);

  // Focus input on load
  terminalInput.focus();

  // Load history from backend
  loadHistory();
}

async function handleKeyDown(e) {
  // Enter: execute command
  if (e.key === 'Enter') {
    e.preventDefault();
    await executeCommand();
    return;
  }

  // Ctrl+L: clear terminal
  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault();
    clearTerminal();
    return;
  }

  // Ctrl+Space: force IA suggestion
  if (e.ctrlKey && e.key === ' ') {
    e.preventDefault();
    await forceSuggestion();
    return;
  }

  // Arrow Up: previous command
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    navigateHistory('up');
    return;
  }

  // Arrow Down: next command
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    navigateHistory('down');
    return;
  }
}

async function handleInput(e) {
  const text = e.target.value.trim();

  // Trigger IA suggestion (debounced in suggestions_ui.js)
  if (text.length > 2) {
    window.requestSuggestion(text);
  }
}

async function executeCommand() {
  const command = terminalInput.value.trim();

  if (!command) return;

  // Add to history
  commandHistory.unshift(command);
  historyIndex = -1;
  currentInput = '';

  // Display command in output
  appendToOutput('command', command);

  // Clear input
  terminalInput.value = '';

  // Check if it's a natural language alias
  const aliasResult = await window.aliasAPI.resolve(command);

  if (aliasResult.success && aliasResult.command) {
    // Display resolved command
    appendToOutput('info', `Resolved alias: ${aliasResult.command}`);

    // Ask for confirmation
    const confirmed = confirm(`Execute this command?\n\n${aliasResult.command}\n\nDescription: ${aliasResult.description || 'N/A'}`);

    if (!confirmed) {
      appendToOutput('info', 'Execution cancelled by user.');
      return;
    }

    // Execute the resolved command
    await runShellCommand(aliasResult.command);
  } else {
    // Execute as normal command
    await runShellCommand(command);
  }

  // Refresh history panel
  window.refreshHistoryPanel();

  // Update memory
  window.updateSessionMemory();

  // Scroll to bottom
  scrollToBottom();
}

async function runShellCommand(command) {
  // Show loading
  const loadingId = appendToOutput('info', '⏳ Executing...');

  try {
    const result = await window.shellAPI.run(command);

    // Remove loading
    removeFromOutput(loadingId);

    if (result.success !== false) {
      // Display stdout
      if (result.stdout) {
        appendToOutput('stdout', result.stdout);
      }

      // Display stderr
      if (result.stderr) {
        appendToOutput('stderr', result.stderr);
      }

      // Display exit code
      const exitMsg = `Exit code: ${result.exitCode} | Duration: ${result.duration || 0}ms`;
      appendToOutput('info', exitMsg);

    } else {
      // Error
      appendToOutput('stderr', `Error: ${result.error || 'Unknown error'}`);
    }

  } catch (error) {
    // Remove loading
    removeFromOutput(loadingId);
    appendToOutput('stderr', `Fatal error: ${error.message}`);
  }
}

function appendToOutput(type, text) {
  const entry = document.createElement('div');
  entry.className = 'command-entry';
  const id = `output-${Date.now()}-${Math.random()}`;
  entry.id = id;

  if (type === 'command') {
    entry.innerHTML = `
      <div class="command-line">
        <span class="command-prompt">λ</span>
        <span class="command-text">${escapeHtml(text)}</span>
      </div>
    `;
  } else if (type === 'stdout') {
    entry.innerHTML = `
      <div class="command-output output-stdout">${escapeHtml(text)}</div>
    `;
  } else if (type === 'stderr') {
    entry.innerHTML = `
      <div class="command-output output-stderr">${escapeHtml(text)}</div>
    `;
  } else if (type === 'info') {
    entry.innerHTML = `
      <div class="command-output output-info">${escapeHtml(text)}</div>
    `;
  }

  terminalOutput.appendChild(entry);
  return id;
}

function removeFromOutput(id) {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
  }
}

function clearTerminal() {
  // Keep welcome message, remove everything else
  const entries = terminalOutput.querySelectorAll('.command-entry');
  entries.forEach(entry => entry.remove());
}

function navigateHistory(direction) {
  if (commandHistory.length === 0) return;

  if (direction === 'up') {
    if (historyIndex === -1) {
      currentInput = terminalInput.value;
    }
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      terminalInput.value = commandHistory[historyIndex];
    }
  } else if (direction === 'down') {
    if (historyIndex > 0) {
      historyIndex--;
      terminalInput.value = commandHistory[historyIndex];
    } else if (historyIndex === 0) {
      historyIndex = -1;
      terminalInput.value = currentInput;
    }
  }
}

async function loadHistory() {
  try {
    const result = await window.historyAPI.list({ limit: 100 });
    if (result.success && result.history) {
      commandHistory = result.history.map(item => item.command);
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

async function forceSuggestion() {
  const text = terminalInput.value.trim();
  if (text) {
    window.requestSuggestion(text, true);
  }
}

function scrollToBottom() {
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose functions to window for other modules
window.insertCommand = function(command) {
  terminalInput.value = command;
  terminalInput.focus();
};

window.executeInsertedCommand = async function(command) {
  terminalInput.value = command;
  await executeCommand();
};

console.log('Terminal UI initialized');
