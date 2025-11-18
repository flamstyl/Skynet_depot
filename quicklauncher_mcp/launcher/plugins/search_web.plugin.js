/**
 * Search Web Plugin
 * Search the web using different search engines
 */

module.exports = {
    name: 'search_web',
    description: 'Search the web with Google, DuckDuckGo, Bing, etc.',
    version: '1.0.0',
    keywords: ['search', 'google', 'web', 'internet', 'find', 'lookup'],
    enabled: true,

    /**
     * Execute the plugin
     */
    execute: async (input, context) => {
        if (!input) {
            return {
                type: 'error',
                message: 'No search query provided'
            };
        }

        // Default to Google
        const engine = context?.engine || 'google';
        const url = this._getSearchURL(engine, input);

        return {
            type: 'action',
            data: {
                type: 'open',
                target: url
            }
        };
    },

    /**
     * Search integration
     */
    search: async (query) => {
        const results = [];
        const queryLower = query.toLowerCase();

        // Trigger words for web search
        const triggers = ['search', 'google', 'find', 'lookup', 'web'];
        const shouldTrigger = triggers.some(t => queryLower.includes(t));

        if (shouldTrigger || query.length > 3) {
            // Extract search query (remove trigger words)
            let searchQuery = query;
            triggers.forEach(t => {
                searchQuery = searchQuery.replace(new RegExp(t, 'gi'), '').trim();
            });

            if (!searchQuery) {
                searchQuery = query;
            }

            // Add search engine options
            const engines = [
                { name: 'Google', id: 'google', icon: '🔍' },
                { name: 'DuckDuckGo', id: 'duckduckgo', icon: '🦆' },
                { name: 'Bing', id: 'bing', icon: '🅱️' },
                { name: 'YouTube', id: 'youtube', icon: '📺' },
                { name: 'Wikipedia', id: 'wikipedia', icon: '📖' },
                { name: 'GitHub', id: 'github', icon: '💻' },
            ];

            for (const engine of engines) {
                results.push({
                    title: `${engine.icon} ${engine.name}: ${searchQuery}`,
                    subtitle: `Search for "${searchQuery}" on ${engine.name}`,
                    action: {
                        type: 'open',
                        target: this._getSearchURL(engine.id, searchQuery)
                    },
                    score: engine.id === 'google' ? 95 : 85
                });
            }
        }

        return results;
    },

    /**
     * Get search URL for different engines
     */
    _getSearchURL: (engine, query) => {
        const encodedQuery = encodeURIComponent(query);

        const urls = {
            google: `https://www.google.com/search?q=${encodedQuery}`,
            duckduckgo: `https://duckduckgo.com/?q=${encodedQuery}`,
            bing: `https://www.bing.com/search?q=${encodedQuery}`,
            youtube: `https://www.youtube.com/results?search_query=${encodedQuery}`,
            wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`,
            github: `https://github.com/search?q=${encodedQuery}`,
            stackoverflow: `https://stackoverflow.com/search?q=${encodedQuery}`,
            reddit: `https://www.reddit.com/search?q=${encodedQuery}`,
            twitter: `https://twitter.com/search?q=${encodedQuery}`,
        };

        return urls[engine] || urls.google;
    },

    /**
     * Settings/configuration
     */
    settings: {
        defaultEngine: 'google',
        enabledEngines: ['google', 'duckduckgo', 'bing', 'youtube', 'wikipedia', 'github']
    }
};
