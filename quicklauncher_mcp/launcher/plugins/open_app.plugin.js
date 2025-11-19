/**
 * Open App Plugin
 * Quickly open applications by name
 */

module.exports = {
    name: 'open_app',
    description: 'Open applications quickly',
    version: '1.0.0',
    keywords: ['open', 'launch', 'app', 'application', 'start'],
    enabled: true,

    /**
     * Execute the plugin
     */
    execute: async (input, context) => {
        // Input is the app name or path
        if (!input) {
            return {
                type: 'error',
                message: 'No application specified'
            };
        }

        return {
            type: 'action',
            data: {
                type: 'open',
                target: input
            }
        };
    },

    /**
     * Search integration
     */
    search: async (query) => {
        const results = [];
        const queryLower = query.toLowerCase();

        // Common applications
        const apps = [
            { name: 'Notepad', path: 'notepad.exe', keywords: ['text', 'edit', 'note'] },
            { name: 'Calculator', path: 'calc.exe', keywords: ['calc', 'math'] },
            { name: 'Paint', path: 'mspaint.exe', keywords: ['draw', 'image'] },
            { name: 'Command Prompt', path: 'cmd.exe', keywords: ['cmd', 'terminal', 'console'] },
            { name: 'PowerShell', path: 'powershell.exe', keywords: ['ps', 'terminal', 'console'] },
            { name: 'Task Manager', path: 'taskmgr.exe', keywords: ['task', 'process', 'manager'] },
            { name: 'File Explorer', path: 'explorer.exe', keywords: ['files', 'folders', 'browse'] },
            { name: 'Control Panel', path: 'control.exe', keywords: ['settings', 'control'] },
            { name: 'Settings', path: 'ms-settings:', keywords: ['config', 'preferences'] },
            { name: 'Registry Editor', path: 'regedit.exe', keywords: ['registry', 'regedit'] },
            { name: 'Windows Terminal', path: 'wt.exe', keywords: ['terminal', 'console', 'wt'] },
            { name: 'VS Code', path: 'code', keywords: ['vscode', 'editor', 'ide'] },
        ];

        for (const app of apps) {
            const nameMatch = app.name.toLowerCase().includes(queryLower);
            const keywordMatch = app.keywords.some(k => k.includes(queryLower));

            if (nameMatch || keywordMatch) {
                results.push({
                    title: app.name,
                    subtitle: `Open ${app.name}`,
                    action: {
                        type: 'open',
                        target: app.path
                    },
                    score: nameMatch ? 100 : 80
                });
            }
        }

        return results;
    },

    /**
     * Settings/configuration
     */
    settings: {
        // User can configure favorite apps here
        favoriteApps: []
    }
};
