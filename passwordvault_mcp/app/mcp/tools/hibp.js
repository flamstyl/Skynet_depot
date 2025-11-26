/**
 * PasswordVault MCP — HIBP Proxy
 * Skynet Secure Vault v1.0
 *
 * Proxy pour HaveIBeenPwned avec cache
 */

const axios = require('axios');

class HIBPProxy {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24h en millisecondes
        this.apiUrl = 'https://api.pwnedpasswords.com/range/';
        this.initialized = false;
    }

    async init() {
        console.log('✓ HIBP Proxy initialized');
        this.initialized = true;

        // Nettoyer le cache périodiquement
        setInterval(() => this.cleanCache(), 60 * 60 * 1000); // Chaque heure
    }

    async checkHash(sha1Hash) {
        /**
         * Vérifie un hash SHA-1 via HIBP
         *
         * @param {string} sha1Hash - Hash SHA-1 complet ou prefix
         * @returns {Promise<object>} - Résultat
         */
        if (!this.initialized) {
            throw new Error('HIBP Proxy not initialized');
        }

        // Normaliser le hash
        const hash = sha1Hash.toUpperCase();
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5);

        // Vérifier le cache
        const cached = this.getFromCache(prefix);
        if (cached) {
            console.log(`✓ HIBP cache hit for ${prefix}`);
            return this.checkSuffix(cached, suffix);
        }

        try {
            // Appeler l'API HIBP
            const response = await axios.get(`${this.apiUrl}${prefix}`, {
                headers: {
                    'User-Agent': 'PasswordVault-MCP-Skynet/1.0',
                    'Add-Padding': 'true'
                },
                timeout: 10000
            });

            if (response.status === 200) {
                // Mettre en cache
                this.addToCache(prefix, response.data);

                // Vérifier le suffix
                return this.checkSuffix(response.data, suffix);
            }

            return {
                breached: false,
                count: 0,
                checked_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('HIBP API error:', error.message);

            return {
                breached: false,
                count: 0,
                error: error.message,
                checked_at: new Date().toISOString()
            };
        }
    }

    checkSuffix(hibpData, suffix) {
        /**
         * Cherche le suffix dans les données HIBP
         *
         * @param {string} hibpData - Réponse HIBP brute
         * @param {string} suffix - Suffix du hash à chercher
         * @returns {object} - Résultat
         */
        const lines = hibpData.split('\r\n');

        for (const line of lines) {
            if (!line) continue;

            const [hashSuffix, countStr] = line.split(':');

            if (hashSuffix === suffix) {
                const count = parseInt(countStr, 10);

                return {
                    breached: true,
                    count: count,
                    checked_at: new Date().toISOString()
                };
            }
        }

        return {
            breached: false,
            count: 0,
            checked_at: new Date().toISOString()
        };
    }

    addToCache(prefix, data) {
        /**
         * Ajoute au cache
         */
        this.cache.set(prefix, {
            data: data,
            timestamp: Date.now()
        });
    }

    getFromCache(prefix) {
        /**
         * Récupère depuis le cache
         */
        const cached = this.cache.get(prefix);

        if (!cached) {
            return null;
        }

        // Vérifier expiration
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(prefix);
            return null;
        }

        return cached.data;
    }

    cleanCache() {
        /**
         * Nettoie les entrées expirées du cache
         */
        const now = Date.now();
        let cleaned = 0;

        for (const [prefix, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.cacheTimeout) {
                this.cache.delete(prefix);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 HIBP cache cleaned: ${cleaned} entries removed`);
        }
    }

    getCacheStats() {
        /**
         * Statistiques du cache
         */
        return {
            entries: this.cache.size,
            timeout_hours: this.cacheTimeout / (60 * 60 * 1000)
        };
    }
}

// Instance globale
const hibpProxy = new HIBPProxy();

module.exports = {
    init: () => hibpProxy.init(),
    checkHash: (sha1Hash) => hibpProxy.checkHash(sha1Hash),
    getCacheStats: () => hibpProxy.getCacheStats()
};
