/**
 * System Actions Plugin
 * Perform system actions like shutdown, restart, lock, etc.
 */

module.exports = {
    name: 'system_actions',
    description: 'Execute system commands (shutdown, restart, lock, etc.)',
    version: '1.0.0',
    keywords: ['system', 'shutdown', 'restart', 'sleep', 'lock', 'logout'],
    enabled: true,

    /**
     * Execute the plugin
     */
    execute: async (input, context) => {
        if (!input) {
            return {
                type: 'error',
                message: 'No system action specified'
            };
        }

        const action = input.toLowerCase();

        // Validate action
        const validActions = ['shutdown', 'restart', 'sleep', 'lock', 'logout'];
        if (!validActions.includes(action)) {
            return {
                type: 'error',
                message: `Invalid system action: ${action}`
            };
        }

        return {
            type: 'action',
            data: {
                type: 'system',
                target: action
            }
        };
    },

    /**
     * Search integration
     */
    search: async (query) => {
        const results = [];
        const queryLower = query.toLowerCase();

        // System actions
        const actions = [
            {
                name: 'Shutdown',
                action: 'shutdown',
                icon: '🔴',
                keywords: ['shutdown', 'turn off', 'power off'],
                description: 'Shutdown the computer',
                confirmRequired: true
            },
            {
                name: 'Restart',
                action: 'restart',
                icon: '🔄',
                keywords: ['restart', 'reboot'],
                description: 'Restart the computer',
                confirmRequired: true
            },
            {
                name: 'Sleep',
                action: 'sleep',
                icon: '😴',
                keywords: ['sleep', 'suspend'],
                description: 'Put the computer to sleep',
                confirmRequired: false
            },
            {
                name: 'Lock',
                action: 'lock',
                icon: '🔒',
                keywords: ['lock', 'lock screen'],
                description: 'Lock the screen',
                confirmRequired: false
            },
            {
                name: 'Logout',
                action: 'logout',
                icon: '🚪',
                keywords: ['logout', 'sign out'],
                description: 'Log out of current user',
                confirmRequired: true
            },
            {
                name: 'Task Manager',
                action: 'taskmgr',
                icon: '📊',
                keywords: ['task manager', 'processes'],
                description: 'Open Task Manager',
                confirmRequired: false,
                type: 'open',
                target: 'taskmgr.exe'
            },
            {
                name: 'System Information',
                action: 'sysinfo',
                icon: 'ℹ️',
                keywords: ['system info', 'specs', 'information'],
                description: 'Show system information',
                confirmRequired: false,
                type: 'open',
                target: 'msinfo32.exe'
            },
            {
                name: 'Disk Cleanup',
                action: 'diskcleanup',
                icon: '🧹',
                keywords: ['disk cleanup', 'clean', 'space'],
                description: 'Free up disk space',
                confirmRequired: false,
                type: 'open',
                target: 'cleanmgr.exe'
            },
            {
                name: 'Device Manager',
                action: 'devmgmt',
                icon: '⚙️',
                keywords: ['device manager', 'devices', 'hardware'],
                description: 'Manage devices',
                confirmRequired: false,
                type: 'open',
                target: 'devmgmt.msc'
            },
            {
                name: 'Services',
                action: 'services',
                icon: '🔧',
                keywords: ['services', 'service manager'],
                description: 'Manage Windows services',
                confirmRequired: false,
                type: 'open',
                target: 'services.msc'
            },
            {
                name: 'Empty Recycle Bin',
                action: 'emptybin',
                icon: '🗑️',
                keywords: ['recycle bin', 'trash', 'empty'],
                description: 'Empty the Recycle Bin',
                confirmRequired: true,
                type: 'run',
                target: 'rd /s /q %systemdrive%\\$Recycle.bin'
            }
        ];

        for (const item of actions) {
            const nameMatch = item.name.toLowerCase().includes(queryLower);
            const keywordMatch = item.keywords.some(k => k.includes(queryLower));

            if (nameMatch || keywordMatch) {
                results.push({
                    title: `${item.icon} ${item.name}`,
                    subtitle: item.description + (item.confirmRequired ? ' (confirmation required)' : ''),
                    action: {
                        type: item.type || 'system',
                        target: item.target || item.action
                    },
                    score: nameMatch ? 100 : 90,
                    metadata: {
                        confirmRequired: item.confirmRequired
                    }
                });
            }
        }

        return results;
    },

    /**
     * Network actions
     */
    networkActions: {
        showIP: async () => {
            // TODO: Get and display IP address
            return {
                type: 'result',
                data: {
                    title: 'IP Address',
                    content: 'TODO: Implement IP address retrieval'
                }
            };
        },

        showWiFi: async () => {
            // TODO: Show WiFi networks
            return {
                type: 'result',
                data: {
                    title: 'WiFi Networks',
                    content: 'TODO: Implement WiFi network listing'
                }
            };
        }
    },

    /**
     * Settings/configuration
     */
    settings: {
        requireConfirmation: true,
        enabledActions: ['shutdown', 'restart', 'sleep', 'lock', 'logout']
    }
};
