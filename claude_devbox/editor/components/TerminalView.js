/**
 * Terminal View Component
 * Wraps xterm.js for Docker container terminal access
 */

class TerminalView {
    constructor(containerId, wsClient, options = {}) {
        this.containerId = containerId;
        this.wsClient = wsClient;
        this.terminal = null;
        this.fitAddon = null;
        this.containerId_docker = options.containerId || null;
        this.connected = false;
    }

    async init() {
        const container = document.getElementById(this.containerId);

        // Create terminal
        this.terminal = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.2,
            theme: {
                background: '#1e1e1e',
                foreground: '#cccccc',
                cursor: '#ffffff',
                black: '#000000',
                red: '#cd3131',
                green: '#0dbc79',
                yellow: '#e5e510',
                blue: '#2472c8',
                magenta: '#bc3fbc',
                cyan: '#11a8cd',
                white: '#e5e5e5',
                brightBlack: '#666666',
                brightRed: '#f14c4c',
                brightGreen: '#23d18b',
                brightYellow: '#f5f543',
                brightBlue: '#3b8eea',
                brightMagenta: '#d670d6',
                brightCyan: '#29b8db',
                brightWhite: '#ffffff'
            },
            allowTransparency: false,
            scrollback: 10000
        });

        // Fit addon for responsive sizing
        this.fitAddon = new FitAddon.FitAddon();
        this.terminal.loadAddon(this.fitAddon);

        // Open terminal
        this.terminal.open(container);
        this.fitAddon.fit();

        // Welcome message
        this.write('\r\n');
        this.write('Welcome to Claude DevBox Terminal\r\n');
        this.write('═══════════════════════════════════════════════\r\n');
        this.write('Connected to Docker sandbox environment\r\n');
        this.write('Type commands to interact with the container\r\n');
        this.write('\r\n');
        this.write('$ ');

        // Handle user input
        this.terminal.onData(data => {
            this.handleInput(data);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.fit();
        });

        // Set up WebSocket listeners
        this.setupWebSocketListeners();

        this.connected = true;
    }

    setupWebSocketListeners() {
        // Listen for stdout from terminal commands
        this.wsClient.on('terminal_output', (data) => {
            this.write(data.output);
        });

        // Listen for terminal connection status
        this.wsClient.on('terminal_connected', () => {
            this.write('\r\n✓ Terminal connected\r\n$ ');
            this.connected = true;
        });

        this.wsClient.on('terminal_disconnected', () => {
            this.write('\r\n✗ Terminal disconnected\r\n');
            this.connected = false;
        });
    }

    handleInput(data) {
        // Handle special keys
        if (data === '\r') {
            // Enter key
            this.write('\r\n');
            const command = this.currentCommand || '';
            this.executeCommand(command);
            this.currentCommand = '';
        } else if (data === '\u007F') {
            // Backspace
            if (this.currentCommand && this.currentCommand.length > 0) {
                this.currentCommand = this.currentCommand.slice(0, -1);
                this.write('\b \b');
            }
        } else if (data === '\u0003') {
            // Ctrl+C
            this.write('^C\r\n$ ');
            this.currentCommand = '';
        } else if (data === '\u0004') {
            // Ctrl+D
            this.write('\r\nlogout\r\n');
        } else {
            // Regular character
            this.currentCommand = (this.currentCommand || '') + data;
            this.write(data);
        }
    }

    executeCommand(command) {
        if (!command.trim()) {
            this.write('$ ');
            return;
        }

        // Send command to backend via WebSocket
        if (this.wsClient && this.wsClient.isConnected()) {
            this.wsClient.terminal(command + '\n', this.containerId_docker);
        } else {
            this.write('Error: Not connected to terminal\r\n$ ');
        }
    }

    write(data) {
        if (this.terminal) {
            this.terminal.write(data);
        }
    }

    writeln(data) {
        if (this.terminal) {
            this.terminal.writeln(data);
        }
    }

    clear() {
        if (this.terminal) {
            this.terminal.clear();
            this.write('$ ');
        }
    }

    fit() {
        if (this.fitAddon) {
            setTimeout(() => {
                this.fitAddon.fit();
            }, 0);
        }
    }

    setContainerId(containerId) {
        this.containerId_docker = containerId;
        this.write(`\r\n✓ Connected to container: ${containerId}\r\n$ `);
    }

    dispose() {
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = null;
        }
        this.connected = false;
    }

    restart() {
        this.clear();
        this.write('\r\n');
        this.write('Terminal restarted\r\n');
        this.write('═══════════════════════════════════════════════\r\n');
        this.write('$ ');
        this.currentCommand = '';
    }

    // Utility methods
    prompt() {
        this.write('$ ');
    }

    success(message) {
        this.write(`\r\n✓ ${message}\r\n$ `);
    }

    error(message) {
        this.write(`\r\n✗ ${message}\r\n$ `);
    }

    info(message) {
        this.write(`\r\nℹ ${message}\r\n$ `);
    }
}

export default TerminalView;
