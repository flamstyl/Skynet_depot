/**
 * NoteVault MCP — Sync Tool
 * Handles vault synchronization across devices
 * Zero-knowledge: only encrypted vaults are synced
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Push encrypted vault to sync storage
 */
export async function syncPush(vault_blob, version, device_id, config) {
  console.log(`🔄 Sync push from device ${device_id}, version ${version}`);

  // Ensure storage directory exists
  const storageDir = config.storage.path;
  await fs.mkdir(storageDir, { recursive: true });

  // Generate sync ID
  const syncId = crypto.randomUUID();

  // Create sync metadata
  const syncData = {
    sync_id: syncId,
    device_id: device_id,
    version: version,
    timestamp: new Date().toISOString(),
    vault_blob: vault_blob
  };

  // Save to storage
  const syncPath = path.join(storageDir, `sync_${version}.json`);
  await fs.writeFile(syncPath, JSON.stringify(syncData, null, 2));

  // Update latest version pointer
  const latestPath = path.join(storageDir, 'latest.json');
  await fs.writeFile(latestPath, JSON.stringify({
    version: version,
    sync_id: syncId,
    device_id: device_id,
    timestamp: syncData.timestamp
  }, null, 2));

  console.log(`✅ Sync pushed: ${syncId}`);

  return {
    status: 'pushed',
    sync_id: syncId,
    version: version
  };
}

/**
 * Pull encrypted vault from sync storage
 */
export async function syncPull(device_id, last_version, config) {
  console.log(`🔄 Sync pull for device ${device_id}, last_version ${last_version || 'none'}`);

  const storageDir = config.storage.path;
  const latestPath = path.join(storageDir, 'latest.json');

  try {
    // Read latest version
    const latestData = await fs.readFile(latestPath, 'utf-8');
    const latest = JSON.parse(latestData);

    // Check if update needed
    if (last_version && last_version >= latest.version) {
      return {
        status: 'up_to_date',
        version: last_version
      };
    }

    // Read sync data
    const syncPath = path.join(storageDir, `sync_${latest.version}.json`);
    const syncData = JSON.parse(await fs.readFile(syncPath, 'utf-8'));

    console.log(`✅ Sync pulled: version ${latest.version}`);

    return {
      status: 'pulled',
      version: latest.version,
      vault_blob: syncData.vault_blob,
      synced_at: latest.timestamp
    };

  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        status: 'no_data',
        message: 'No sync data available'
      };
    }
    throw err;
  }
}

/**
 * Resolve sync conflicts
 */
export async function syncResolve(local_version, remote_version, strategy, config) {
  console.log(`🔄 Sync resolve: local=${local_version.version}, remote=${remote_version.version}, strategy=${strategy}`);

  let resolved_version;

  switch (strategy) {
    case 'local':
      // Keep local version
      resolved_version = local_version;
      console.log('  → Keeping local version');
      break;

    case 'remote':
      // Keep remote version
      resolved_version = remote_version;
      console.log('  → Keeping remote version');
      break;

    case 'merge':
      // Merge based on timestamp (most recent wins)
      const localTime = new Date(local_version.timestamp || 0).getTime();
      const remoteTime = new Date(remote_version.timestamp || 0).getTime();

      if (localTime >= remoteTime) {
        resolved_version = local_version;
        console.log('  → Local version is newer (merge)');
      } else {
        resolved_version = remote_version;
        console.log('  → Remote version is newer (merge)');
      }
      break;

    default:
      throw new Error(`Unknown strategy: ${strategy}`);
  }

  // TODO: For true merge, decrypt both vaults, merge notes, re-encrypt
  // This requires master key, which violates zero-knowledge
  // Solution: Return both versions to client for user resolution

  return {
    status: 'resolved',
    strategy: strategy,
    resolved_version: resolved_version,
    note: strategy === 'merge'
      ? 'Timestamp-based merge. For manual merge, use local or remote strategy.'
      : null
  };
}

export default { syncPush, syncPull, syncResolve };
