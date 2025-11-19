/**
 * Plugins Manager
 * Handles plugin distribution, updates, and management across devices
 */

import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PLUGINS_DIR = join(__dirname, '../../../launcher/plugins');
const PLUGINS_CACHE_DIR = join(__dirname, '../../../data/plugins_cache');

// Ensure directories exist
await fs.mkdir(PLUGINS_DIR, { recursive: true });
await fs.mkdir(PLUGINS_CACHE_DIR, { recursive: true });

class PluginsManager {
    constructor() {
        this.plugins = new Map(); // plugin_id -> plugin_info
    }

    /**
     * List all available plugins
     */
    async list() {
        await this._loadPlugins();

        return Array.from(this.plugins.values());
    }

    /**
     * Install a plugin
     */
    async install(pluginId, source = null) {
        console.log(`Installing plugin: ${pluginId}`);

        // TODO: Implement actual plugin installation
        // - Download from registry
        // - Validate plugin
        // - Install to plugins directory
        // - Register plugin

        // For now, return mock data
        const plugin = {
            name: pluginId,
            description: `Plugin: ${pluginId}`,
            version: '1.0.0',
            installed: true,
            source: source || 'registry'
        };

        this.plugins.set(pluginId, plugin);

        return plugin;
    }

    /**
     * Update a plugin
     */
    async update(pluginId) {
        console.log(`Updating plugin: ${pluginId}`);

        if (!this.plugins.has(pluginId)) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        // TODO: Implement actual plugin update
        // - Check for updates
        // - Download new version
        // - Backup old version
        // - Install new version
        // - Rollback if fails

        const plugin = this.plugins.get(pluginId);
        plugin.version = '1.1.0'; // Mock version bump

        return plugin;
    }

    /**
     * Uninstall a plugin
     */
    async uninstall(pluginId) {
        console.log(`Uninstalling plugin: ${pluginId}`);

        if (!this.plugins.has(pluginId)) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        // TODO: Implement actual plugin uninstallation
        // - Remove plugin files
        // - Clean up cache
        // - Unregister plugin

        this.plugins.delete(pluginId);

        return {
            success: true,
            message: `Plugin ${pluginId} uninstalled`
        };
    }

    /**
     * Load plugins from directory
     */
    async _loadPlugins() {
        try {
            // Load default plugins
            const defaultPlugins = [
                {
                    name: 'open_app',
                    description: 'Open applications',
                    version: '1.0.0',
                    keywords: ['open', 'launch', 'app'],
                    enabled: true,
                    type: 'default'
                },
                {
                    name: 'search_web',
                    description: 'Search the web',
                    version: '1.0.0',
                    keywords: ['search', 'google', 'web'],
                    enabled: true,
                    type: 'default'
                },
                {
                    name: 'system_actions',
                    description: 'System commands',
                    version: '1.0.0',
                    keywords: ['shutdown', 'restart', 'sleep'],
                    enabled: true,
                    type: 'default'
                }
            ];

            for (const plugin of defaultPlugins) {
                this.plugins.set(plugin.name, plugin);
            }

            // Load custom plugins from directory
            // TODO: Implement actual plugin file loading
            // - Read plugin files
            // - Parse plugin metadata
            // - Validate plugins
            // - Register plugins

            console.log(`Loaded ${this.plugins.size} plugins`);

        } catch (error) {
            console.error('Error loading plugins:', error);
        }
    }

    /**
     * Get plugin info
     */
    async getInfo(pluginId) {
        await this._loadPlugins();

        if (!this.plugins.has(pluginId)) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        return this.plugins.get(pluginId);
    }

    /**
     * Enable a plugin
     */
    async enable(pluginId) {
        if (!this.plugins.has(pluginId)) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        const plugin = this.plugins.get(pluginId);
        plugin.enabled = true;

        return plugin;
    }

    /**
     * Disable a plugin
     */
    async disable(pluginId) {
        if (!this.plugins.has(pluginId)) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }

        const plugin = this.plugins.get(pluginId);
        plugin.enabled = false;

        return plugin;
    }

    /**
     * Search plugins by keyword
     */
    async search(query) {
        await this._loadPlugins();

        const results = [];
        const queryLower = query.toLowerCase();

        for (const plugin of this.plugins.values()) {
            if (
                plugin.name.toLowerCase().includes(queryLower) ||
                plugin.description.toLowerCase().includes(queryLower) ||
                (plugin.keywords && plugin.keywords.some(k => k.toLowerCase().includes(queryLower)))
            ) {
                results.push(plugin);
            }
        }

        return results;
    }
}

// Export singleton instance
export const pluginsManager = new PluginsManager();
