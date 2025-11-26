/**
 * NoteVault MCP — RAG Backup Tool
 * Backup and restore RAG index
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Backup RAG index
 */
export async function ragBackup(index_blob, config) {
  console.log(`💾 RAG Backup`);

  // Ensure backup directory exists
  const backupDir = path.join(config.storage.path, 'rag_backups');
  await fs.mkdir(backupDir, { recursive: true });

  // Generate backup ID
  const backupId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // Create backup data
  const backupData = {
    backup_id: backupId,
    timestamp: timestamp,
    index_blob: index_blob
  };

  // Save backup
  const backupPath = path.join(backupDir, `backup_${backupId}.json`);
  await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

  // Update latest backup pointer
  const latestPath = path.join(backupDir, 'latest_backup.json');
  await fs.writeFile(latestPath, JSON.stringify({
    backup_id: backupId,
    timestamp: timestamp
  }, null, 2));

  console.log(`✅ RAG backup created: ${backupId}`);

  return {
    status: 'backed_up',
    backup_id: backupId,
    timestamp: timestamp
  };
}

/**
 * Restore RAG index from backup
 */
export async function ragRestore(backup_id, config) {
  console.log(`💾 RAG Restore: ${backup_id}`);

  const backupDir = path.join(config.storage.path, 'rag_backups');

  try {
    let backupPath;

    if (backup_id === 'latest') {
      // Restore latest backup
      const latestPath = path.join(backupDir, 'latest_backup.json');
      const latestData = JSON.parse(await fs.readFile(latestPath, 'utf-8'));
      backup_id = latestData.backup_id;
    }

    backupPath = path.join(backupDir, `backup_${backup_id}.json`);

    // Read backup
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf-8'));

    console.log(`✅ RAG restored from backup: ${backup_id}`);

    return {
      status: 'restored',
      backup_id: backup_id,
      timestamp: backupData.timestamp,
      index_blob: backupData.index_blob
    };

  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Backup not found: ${backup_id}`);
    }
    throw err;
  }
}

export default { ragBackup, ragRestore };
