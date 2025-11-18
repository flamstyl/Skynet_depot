/**
 * Skynet Command Center - Terminal
 * =================================
 * Handles fullscreen terminal operations
 */

// Command history
let commandHistory = [];
let historyIndex = -1;

document.addEventListener('DOMContentLoaded', function() {
    console.log('[TERMINAL] Initializing...');

    setupTerminal();
    loadHistory();
});

/**
 * Setup terminal input handling
 */
function setupTerminal() {
    const input = document.getElementById('terminal-input-full');

    if (!input) return;

    // Focus input
    input.focus();

    // Handle Enter key
    input.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();

            const command = input.value.trim();

            if (!command) return;

            // Add to history
            commandHistory.push(command);
            historyIndex = commandHistory.length;

            // Display command
            addOutputLine(`skynet@command-center:~$ ${command}`, 'prompt');

            // Clear input
            input.value = '';

            // Execute command
            await executeCommand(command);
        }
        // Handle Up arrow (previous command)
        else if (e.key === 'ArrowUp') {
            e.preventDefault();

            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex];
            }
        }
        // Handle Down arrow (next command)
        else if (e.key === 'ArrowDown') {
            e.preventDefault();

            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                input.value = '';
            }
        }
    });
}

/**
 * Execute terminal command
 */
async function executeCommand(command) {
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
            clearTerminal();
        } else {
            // Display output
            const lines = result.output.split('\n');
            lines.forEach(line => {
                addOutputLine(line, result.success ? 'output' : 'error');
            });
        }
    } catch (error) {
        addOutputLine(`Error: ${error.message}`, 'error');
    }

    // Scroll to bottom
    scrollToBottom();
}

/**
 * Add output line to terminal
 */
function addOutputLine(text, type) {
    const output = document.getElementById('terminal-output-full');
    const line = document.createElement('div');
    line.className = 'terminal-line';

    if (type === 'prompt') {
        line.innerHTML = `<span class="terminal-text" style="color: var(--text-primary);">${text}</span>`;
    } else if (type === 'error') {
        line.innerHTML = `<span class="terminal-text" style="color: var(--error);">${text}</span>`;
    } else if (type === 'output') {
        line.innerHTML = `<span class="terminal-text">${text}</span>`;
    } else {
        line.textContent = text;
    }

    output.appendChild(line);
}

/**
 * Clear terminal
 */
function clearTerminal() {
    const output = document.getElementById('terminal-output-full');
    output.innerHTML = `
        <div class="terminal-line">
            <span class="terminal-text">╔═══════════════════════════════════════════════════════════╗</span>
        </div>
        <div class="terminal-line">
            <span class="terminal-text">║         SKYNET COMMAND CENTER - TERMINAL v1.0            ║</span>
        </div>
        <div class="terminal-line">
            <span class="terminal-text">║         Terminal cleared                                  ║</span>
        </div>
        <div class="terminal-line">
            <span class="terminal-text">╚═══════════════════════════════════════════════════════════╝</span>
        </div>
    `;
}

/**
 * Scroll terminal to bottom
 */
function scrollToBottom() {
    const output = document.getElementById('terminal-output-full');
    output.scrollTop = output.scrollHeight;
}

/**
 * Load command history from server
 */
async function loadHistory() {
    try {
        const response = await fetch('/api/terminal/history?limit=50');
        const data = await response.json();

        if (data.success && data.history) {
            // Populate command history (reversed to get chronological order)
            commandHistory = data.history
                .reverse()
                .map(entry => entry.command);

            historyIndex = commandHistory.length;

            console.log(`[TERMINAL] Loaded ${commandHistory.length} commands from history`);
        }
    } catch (error) {
        console.error('[TERMINAL] Error loading history:', error);
    }
}

// Auto-focus input when clicking anywhere in terminal
document.addEventListener('click', function(e) {
    const input = document.getElementById('terminal-input-full');
    if (input && !e.target.matches('a, button')) {
        input.focus();
    }
});
