/**
 * Sync Tools - Multi-device clipboard synchronization
 */

const crypto = require('crypto');

/**
 * Push clipboard entry to sync storage
 * @param {string} deviceId - Device identifier
 * @param {object} entry - Clipboard entry
 * @param {Map} storage - In-memory storage
 * @returns {object} Sync result
 */
async function pushClipboard(deviceId, entry, storage) {
  const syncId = crypto.randomUUID();
  const timestamp = Date.now();

  const syncEntry = {
    sync_id: syncId,
    device_id: deviceId,
    timestamp,
    entry: {
      ...entry,
      synced_at: timestamp
    }
  };

  // Store in device-specific bucket
  if (!storage.has(deviceId)) {
    storage.set(deviceId, []);
  }

  const deviceEntries = storage.get(deviceId);
  deviceEntries.push(syncEntry);

  // Keep only last 1000 entries per device
  if (deviceEntries.length > 1000) {
    deviceEntries.shift();
  }

  // Also store in global sync list for cross-device access
  if (!storage.has('__global__')) {
    storage.set('__global__', []);
  }

  const globalEntries = storage.get('__global__');
  globalEntries.push(syncEntry);

  if (globalEntries.length > 5000) {
    globalEntries.shift();
  }

  console.log(`[SYNC] Pushed entry from device ${deviceId}: ${syncId}`);

  return {
    success: true,
    sync_id: syncId,
    timestamp,
    message: 'Entry synced successfully'
  };
}

/**
 * Pull clipboard entries from sync storage
 * @param {string} deviceId - Device identifier
 * @param {string} since - Timestamp to fetch entries since
 * @param {Map} storage - In-memory storage
 * @returns {object} Sync entries
 */
async function pullClipboard(deviceId, since, storage) {
  const sinceTimestamp = since ? parseInt(since) : 0;
  const globalEntries = storage.get('__global__') || [];

  // Filter entries:
  // 1. Not from this device (avoid echo)
  // 2. Newer than 'since' timestamp
  const relevantEntries = globalEntries.filter(syncEntry => {
    return syncEntry.device_id !== deviceId &&
           syncEntry.timestamp > sinceTimestamp;
  });

  // Sort by timestamp (newest first)
  relevantEntries.sort((a, b) => b.timestamp - a.timestamp);

  console.log(`[SYNC] Pulled ${relevantEntries.length} entries for device ${deviceId}`);

  return {
    success: true,
    count: relevantEntries.length,
    entries: relevantEntries.map(se => ({
      sync_id: se.sync_id,
      device_id: se.device_id,
      timestamp: se.timestamp,
      entry: se.entry
    })),
    last_sync: Date.now()
  };
}

/**
 * Sync all devices - broadcast latest entry
 * @param {Map} storage - In-memory storage
 * @returns {object} Sync status
 */
async function syncDevices(storage) {
  const devices = Array.from(storage.keys()).filter(key => key !== '__global__');
  const globalEntries = storage.get('__global__') || [];

  return {
    success: true,
    devices_count: devices.length,
    total_entries: globalEntries.length,
    last_entry: globalEntries[globalEntries.length - 1] || null
  };
}

/**
 * Clear old sync data (cleanup)
 * @param {Map} storage - In-memory storage
 * @param {number} maxAge - Maximum age in milliseconds
 */
async function cleanupOldEntries(storage, maxAge = 86400000) {
  const now = Date.now();
  const globalEntries = storage.get('__global__') || [];

  const filtered = globalEntries.filter(entry => {
    return (now - entry.timestamp) < maxAge;
  });

  storage.set('__global__', filtered);

  console.log(`[SYNC] Cleaned up ${globalEntries.length - filtered.length} old entries`);

  return {
    success: true,
    removed: globalEntries.length - filtered.length,
    remaining: filtered.length
  };
}

module.exports = {
  pushClipboard,
  pullClipboard,
  syncDevices,
  cleanupOldEntries
};
