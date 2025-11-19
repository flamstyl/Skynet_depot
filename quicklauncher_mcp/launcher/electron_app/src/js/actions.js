// Actions Manager - Frontend side
const ActionsManager = {
    // Execute action
    async execute(action) {
        try {
            const result = await window.electronAPI.executeAction(action);
            return result;
        } catch (error) {
            console.error('Action execution error:', error);
            return { success: false, error: error.message };
        }
    },

    // Common action builders
    openApp(appPath) {
        return {
            type: 'open',
            target: appPath
        };
    },

    openFile(filePath) {
        return {
            type: 'open',
            target: filePath
        };
    },

    openFolder(folderPath) {
        return {
            type: 'open',
            target: folderPath
        };
    },

    runCommand(command) {
        return {
            type: 'run',
            target: command
        };
    },

    searchWeb(query, engine = 'google') {
        const engines = {
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`
        };

        return {
            type: 'open',
            target: engines[engine] || engines.google
        };
    },

    // System actions
    systemAction(actionType) {
        return {
            type: 'system',
            target: actionType
        };
    },

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+R - Rebuild index
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.rebuildIndex();
            }

            // Ctrl+, - Open settings (TODO)
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                console.log('Settings - TODO');
            }

            // Ctrl+P - Plugin manager (TODO)
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                console.log('Plugin manager - TODO');
            }
        });
    },

    async rebuildIndex() {
        console.log('Rebuilding index...');

        try {
            const result = await window.electronAPI.rebuildIndex();

            if (result.success) {
                console.log('Index rebuilt:', result.data);
                alert(`Index rebuilt: ${result.data.indexed} items indexed in ${result.data.duration}`);
            } else {
                console.error('Index rebuild failed:', result.error);
                alert('Failed to rebuild index');
            }
        } catch (error) {
            console.error('Rebuild error:', error);
            alert('Failed to rebuild index');
        }
    }
};

// Initialize keyboard shortcuts
ActionsManager.setupKeyboardShortcuts();

// Example actions for testing
const ExampleActions = {
    // Open common apps
    openNotepad() {
        return ActionsManager.execute(
            ActionsManager.openApp('notepad.exe')
        );
    },

    openCalculator() {
        return ActionsManager.execute(
            ActionsManager.openApp('calc.exe')
        );
    },

    // Search actions
    googleSearch(query) {
        return ActionsManager.execute(
            ActionsManager.searchWeb(query, 'google')
        );
    },

    // System actions
    shutdown() {
        if (confirm('Are you sure you want to shutdown?')) {
            return ActionsManager.execute(
                ActionsManager.systemAction('shutdown')
            );
        }
    },

    restart() {
        if (confirm('Are you sure you want to restart?')) {
            return ActionsManager.execute(
                ActionsManager.systemAction('restart')
            );
        }
    },

    sleep() {
        return ActionsManager.execute(
            ActionsManager.systemAction('sleep')
        );
    },

    lockScreen() {
        return ActionsManager.execute(
            ActionsManager.systemAction('lock')
        );
    }
};
