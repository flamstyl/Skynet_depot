// Plugin Manager
const PluginManager = {
    plugins: [],
    loaded: false,

    async init() {
        try {
            const result = await window.electronAPI.loadPlugins();

            if (result.success) {
                this.plugins = result.data;
                this.loaded = true;
                console.log(`Loaded ${this.plugins.length} plugins`);
            } else {
                console.error('Failed to load plugins:', result.error);
            }
        } catch (error) {
            console.error('Plugin initialization error:', error);
        }
    },

    getPlugin(name) {
        return this.plugins.find(p => p.name === name);
    },

    searchPlugins(query) {
        if (!this.loaded) return [];

        return this.plugins.filter(plugin => {
            // Match against name, description, or keywords
            const searchStr = query.toLowerCase();
            return (
                plugin.name.toLowerCase().includes(searchStr) ||
                plugin.description.toLowerCase().includes(searchStr) ||
                (plugin.keywords && plugin.keywords.some(k => k.toLowerCase().includes(searchStr)))
            );
        });
    },

    async executePlugin(pluginName, input) {
        const plugin = this.getPlugin(pluginName);
        if (!plugin) {
            console.error(`Plugin not found: ${pluginName}`);
            return { success: false, error: 'Plugin not found' };
        }

        try {
            // Execute via backend
            const result = await window.electronAPI.executeAction({
                type: 'plugin',
                target: pluginName,
                input: input
            });

            return result;
        } catch (error) {
            console.error(`Plugin execution error (${pluginName}):`, error);
            return { success: false, error: error.message };
        }
    },

    // Register a plugin (for custom plugins loaded from frontend)
    registerPlugin(plugin) {
        if (!plugin.name || !plugin.execute) {
            console.error('Invalid plugin: missing name or execute function');
            return false;
        }

        // Check if plugin already exists
        const existingIndex = this.plugins.findIndex(p => p.name === plugin.name);
        if (existingIndex >= 0) {
            this.plugins[existingIndex] = plugin;
        } else {
            this.plugins.push(plugin);
        }

        console.log(`Registered plugin: ${plugin.name}`);
        return true;
    },

    // Unregister a plugin
    unregisterPlugin(name) {
        const index = this.plugins.findIndex(p => p.name === name);
        if (index >= 0) {
            this.plugins.splice(index, 1);
            console.log(`Unregistered plugin: ${name}`);
            return true;
        }
        return false;
    },

    // Get all plugin names
    getPluginNames() {
        return this.plugins.map(p => p.name);
    },

    // Reload plugins from backend
    async reload() {
        this.plugins = [];
        this.loaded = false;
        await this.init();
    }
};

// Example: Custom Frontend Plugin
// Users can add custom plugins directly in the frontend for quick actions

/*
Example usage:

PluginManager.registerPlugin({
    name: 'quick_note',
    description: 'Create a quick note',
    version: '1.0.0',
    keywords: ['note', 'memo', 'write'],

    execute: async (input) => {
        // Custom logic
        const timestamp = new Date().toISOString();
        const note = `[${timestamp}] ${input}`;

        // Could save to file, send to backend, etc.
        console.log('Note created:', note);

        return {
            success: true,
            message: 'Note created!'
        };
    },

    search: async (query) => {
        if (query.toLowerCase().includes('note')) {
            return [{
                title: 'Create Quick Note',
                subtitle: 'Type your note...',
                action: { type: 'plugin', target: 'quick_note' }
            }];
        }
        return [];
    }
});
*/
