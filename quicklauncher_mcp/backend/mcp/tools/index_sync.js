/**
 * Index Sync Tool
 * Handles synchronization of search indexes across multiple devices
 */

import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SYNC_DIR = join(__dirname, '../../../data/sync');

// Ensure sync directory exists
await fs.mkdir(SYNC_DIR, { recursive: true });

class IndexSync {
    constructor() {
        this.devices = new Map(); // device_id -> index_data
    }

    /**
     * Push index data from a device
     */
    async push(deviceId, indexData) {
        console.log(`Pushing index from device: ${deviceId}`);

        // Store device index
        this.devices.set(deviceId, {
            data: indexData,
            timestamp: Date.now(),
            device_id: deviceId
        });

        // Persist to file
        await this._persistDeviceIndex(deviceId, indexData);

        // Merge all indexes
        const mergedIndex = await this._mergeIndexes();

        return {
            merged_count: mergedIndex.length,
            device_count: this.devices.size
        };
    }

    /**
     * Pull merged index for a device
     */
    async pull(deviceId) {
        console.log(`Pulling index for device: ${deviceId}`);

        // Load all device indexes
        await this._loadAllDeviceIndexes();

        // Return merged index
        return await this._mergeIndexes();
    }

    /**
     * Get sync status
     */
    async getStatus() {
        await this._loadAllDeviceIndexes();

        const devices = [];
        for (const [deviceId, data] of this.devices.entries()) {
            devices.push({
                device_id: deviceId,
                item_count: data.data.length,
                last_sync: new Date(data.timestamp).toISOString()
            });
        }

        return {
            total_devices: this.devices.size,
            devices,
            last_merge: new Date().toISOString()
        };
    }

    /**
     * Merge indexes from all devices
     */
    async _mergeIndexes() {
        const merged = new Map(); // path -> item

        // Iterate through all devices
        for (const [deviceId, deviceData] of this.devices.entries()) {
            for (const item of deviceData.data) {
                const key = item.path || item.name;

                if (merged.has(key)) {
                    // Item exists, merge with conflict resolution
                    const existing = merged.get(key);

                    // Use higher frequency
                    if (item.frequency > existing.frequency) {
                        existing.frequency = item.frequency;
                    }

                    // Use most recent last_used
                    if (item.last_used && (!existing.last_used || item.last_used > existing.last_used)) {
                        existing.last_used = item.last_used;
                    }
                } else {
                    // New item, add to merged index
                    merged.set(key, { ...item });
                }
            }
        }

        // Convert to array
        return Array.from(merged.values());
    }

    /**
     * Persist device index to file
     */
    async _persistDeviceIndex(deviceId, indexData) {
        const filePath = join(SYNC_DIR, `${deviceId}.json`);

        await fs.writeFile(
            filePath,
            JSON.stringify({
                device_id: deviceId,
                timestamp: Date.now(),
                data: indexData
            }, null, 2)
        );

        console.log(`Device index persisted: ${filePath}`);
    }

    /**
     * Load all device indexes from files
     */
    async _loadAllDeviceIndexes() {
        try {
            const files = await fs.readdir(SYNC_DIR);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = join(SYNC_DIR, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const deviceData = JSON.parse(content);

                    this.devices.set(deviceData.device_id, deviceData);
                }
            }

            console.log(`Loaded ${this.devices.size} device indexes`);
        } catch (error) {
            console.error('Error loading device indexes:', error);
        }
    }
}

// Export singleton instance
export const indexSync = new IndexSync();
