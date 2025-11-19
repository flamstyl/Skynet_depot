/**
 * PasswordVault MCP — Sync Tools
 * Skynet Secure Vault v1.0
 *
 * Gestion de la synchronisation des vaults chiffrés
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SyncManager {
    constructor() {
        this.syncCachePath = path.join(__dirname, '../../../data/sync_cache');
        this.initialized = false;
    }

    async init() {
        // Créer répertoire cache si inexistant
        try {
            await fs.mkdir(this.syncCachePath, { recursive: true });
            console.log('✓ Sync cache initialized');
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize sync cache:', error);
            throw error;
        }
    }

    async pushVault(deviceId, vaultData, timestamp = null) {
        /**
         * Upload vault chiffré
         *
         * @param {string} deviceId - ID du device
         * @param {object} vaultData - Vault complet chiffré
         * @param {string|null} timestamp - Timestamp optionnel
         * @returns {Promise<object>} - Résultat du push
         */
        if (!this.initialized) {
            throw new Error('SyncManager not initialized');
        }

        const syncId = uuidv4();
        const syncTimestamp = timestamp || new Date().toISOString();

        const syncEntry = {
            sync_id: syncId,
            device_id: deviceId,
            vault: vaultData,
            timestamp: syncTimestamp,
            pushed_at: new Date().toISOString()
        };

        // Sauvegarder dans le cache
        const cachePath = path.join(this.syncCachePath, `${deviceId}.json`);
        await fs.writeFile(cachePath, JSON.stringify(syncEntry, null, 2), 'utf-8');

        console.log(`✓ Vault pushed from device: ${deviceId}`);

        return {
            sync_id: syncId,
            timestamp: syncTimestamp
        };
    }

    async pullVault(deviceId) {
        /**
         * Récupère vault chiffré
         *
         * @param {string} deviceId - ID du device
         * @returns {Promise<object|null>} - Vault ou null
         */
        if (!this.initialized) {
            throw new Error('SyncManager not initialized');
        }

        const cachePath = path.join(this.syncCachePath, `${deviceId}.json`);

        try {
            const data = await fs.readFile(cachePath, 'utf-8');
            const syncEntry = JSON.parse(data);

            console.log(`✓ Vault pulled for device: ${deviceId}`);

            return {
                sync_id: syncEntry.sync_id,
                data: syncEntry.vault,
                timestamp: syncEntry.timestamp
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async getSyncStatus(deviceId) {
        /**
         * Statut de sync pour un device
         *
         * @param {string} deviceId - ID du device
         * @returns {Promise<object>} - Statut
         */
        const cachePath = path.join(this.syncCachePath, `${deviceId}.json`);

        try {
            const data = await fs.readFile(cachePath, 'utf-8');
            const syncEntry = JSON.parse(data);

            return {
                synced: true,
                last_sync: syncEntry.timestamp,
                sync_id: syncEntry.sync_id,
                entry_count: syncEntry.vault.entries?.length || 0
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                return {
                    synced: false,
                    last_sync: null,
                    sync_id: null,
                    entry_count: 0
                };
            }
            throw error;
        }
    }

    async resolveConflict(vault1, vault2) {
        /**
         * Résout un conflit entre deux vaults
         *
         * Stratégie: Last-write-wins avec merge des entrées
         *
         * @param {object} vault1 - Premier vault
         * @param {object} vault2 - Deuxième vault
         * @returns {Promise<object>} - Vault fusionné
         */

        // Comparer les timestamps
        const time1 = new Date(vault1.metadata.last_modified);
        const time2 = new Date(vault2.metadata.last_modified);

        let base, incoming;

        if (time1 > time2) {
            base = vault1;
            incoming = vault2;
        } else {
            base = vault2;
            incoming = vault1;
        }

        // Merger les entrées (par ID)
        const mergedEntries = [...base.entries];
        const existingIds = new Set(base.entries.map(e => e.id));

        for (const entry of incoming.entries) {
            if (!existingIds.has(entry.id)) {
                // Nouvelle entrée à ajouter
                mergedEntries.push(entry);
            } else {
                // Vérifier si l'entrée incoming est plus récente
                const baseEntry = mergedEntries.find(e => e.id === entry.id);
                const baseTime = new Date(baseEntry.updated_at);
                const incomingTime = new Date(entry.updated_at);

                if (incomingTime > baseTime) {
                    // Remplacer par la version plus récente
                    const index = mergedEntries.findIndex(e => e.id === entry.id);
                    mergedEntries[index] = entry;
                }
            }
        }

        // Créer vault fusionné
        const merged = {
            metadata: {
                ...base.metadata,
                last_modified: new Date().toISOString(),
                entry_count: mergedEntries.length
            },
            entries: mergedEntries
        };

        console.log(`✓ Conflict resolved: ${merged.entries.length} entries`);

        return merged;
    }

    async listDevices() {
        /**
         * Liste tous les devices synchronisés
         *
         * @returns {Promise<Array>} - Liste des devices
         */
        try {
            const files = await fs.readdir(this.syncCachePath);
            const devices = files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''));

            return devices;

        } catch (error) {
            return [];
        }
    }
}

// Instance globale
const syncManager = new SyncManager();

module.exports = {
    init: () => syncManager.init(),
    pushVault: (deviceId, vaultData, timestamp) =>
        syncManager.pushVault(deviceId, vaultData, timestamp),
    pullVault: (deviceId) =>
        syncManager.pullVault(deviceId),
    getSyncStatus: (deviceId) =>
        syncManager.getSyncStatus(deviceId),
    resolveConflict: (vault1, vault2) =>
        syncManager.resolveConflict(vault1, vault2),
    listDevices: () =>
        syncManager.listDevices()
};
