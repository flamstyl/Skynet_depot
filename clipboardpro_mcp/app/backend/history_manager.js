/**
 * History Manager - CRUD operations for clipboard history
 */

const db = require('./database');

/**
 * Add new clipboard entry
 * @param {string} type - Entry type (text, image, file)
 * @param {string} content - Entry content
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Created entry
 */
async function addEntry(type, content, metadata = {}) {
  const metadataJson = JSON.stringify(metadata);

  const result = await db.run(
    `INSERT INTO clipboard_history (type, content, metadata, device_id)
     VALUES (?, ?, ?, ?)`,
    [type, content, metadataJson, metadata.device_id || 'local']
  );

  console.log(`[HISTORY] Added entry #${result.lastID} (${type})`);

  return {
    id: result.lastID,
    type,
    content,
    metadata,
    created_at: new Date().toISOString()
  };
}

/**
 * Get clipboard history
 * @param {number} limit - Number of entries to retrieve
 * @param {number} offset - Offset for pagination
 * @param {object} filter - Filter options
 * @returns {Promise<Array>} History entries
 */
async function getHistory(limit = 100, offset = 0, filter = {}) {
  let sql = 'SELECT * FROM clipboard_history';
  const params = [];
  const conditions = [];

  // Apply filters
  if (filter.type) {
    conditions.push('type = ?');
    params.push(filter.type);
  }

  if (filter.device_id) {
    conditions.push('device_id = ?');
    params.push(filter.device_id);
  }

  if (filter.synced !== undefined) {
    conditions.push('synced = ?');
    params.push(filter.synced ? 1 : 0);
  }

  if (filter.since) {
    conditions.push('created_at >= ?');
    params.push(filter.since);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = await db.all(sql, params);

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {}
  }));
}

/**
 * Get single entry by ID
 * @param {number} id - Entry ID
 * @returns {Promise<object>} Entry
 */
async function getEntry(id) {
  const row = await db.get(
    'SELECT * FROM clipboard_history WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {}
  };
}

/**
 * Search clipboard history
 * @param {string} query - Search query
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Matching entries
 */
async function searchHistory(query, limit = 50) {
  const searchPattern = `%${query}%`;

  const rows = await db.all(
    `SELECT * FROM clipboard_history
     WHERE content LIKE ? OR ocr_text LIKE ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [searchPattern, searchPattern, limit]
  );

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {}
  }));
}

/**
 * Update entry (e.g., add OCR text)
 * @param {number} id - Entry ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated entry
 */
async function updateEntry(id, updates) {
  const fields = [];
  const params = [];

  if (updates.ocr_text !== undefined) {
    fields.push('ocr_text = ?');
    params.push(updates.ocr_text);
  }

  if (updates.synced !== undefined) {
    fields.push('synced = ?');
    params.push(updates.synced ? 1 : 0);
  }

  if (updates.metadata !== undefined) {
    fields.push('metadata = ?');
    params.push(JSON.stringify(updates.metadata));
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  params.push(id);

  await db.run(
    `UPDATE clipboard_history SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  console.log(`[HISTORY] Updated entry #${id}`);

  return getEntry(id);
}

/**
 * Delete entry
 * @param {number} id - Entry ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteEntry(id) {
  const result = await db.run(
    'DELETE FROM clipboard_history WHERE id = ?',
    [id]
  );

  console.log(`[HISTORY] Deleted entry #${id}`);

  return result.changes > 0;
}

/**
 * Clear all history
 * @param {object} options - Clear options
 * @returns {Promise<number>} Number of deleted entries
 */
async function clearHistory(options = {}) {
  let sql = 'DELETE FROM clipboard_history';
  const params = [];

  if (options.before) {
    sql += ' WHERE created_at < ?';
    params.push(options.before);
  }

  const result = await db.run(sql, params);

  console.log(`[HISTORY] Cleared ${result.changes} entries`);

  return result.changes;
}

/**
 * Get history statistics
 * @returns {Promise<object>} Statistics
 */
async function getStats() {
  const total = await db.get('SELECT COUNT(*) as count FROM clipboard_history');
  const byType = await db.all(
    'SELECT type, COUNT(*) as count FROM clipboard_history GROUP BY type'
  );
  const synced = await db.get(
    'SELECT COUNT(*) as count FROM clipboard_history WHERE synced = 1'
  );
  const latest = await db.get(
    'SELECT created_at FROM clipboard_history ORDER BY created_at DESC LIMIT 1'
  );

  return {
    total: total.count,
    by_type: byType.reduce((acc, row) => {
      acc[row.type] = row.count;
      return acc;
    }, {}),
    synced: synced.count,
    latest_entry: latest ? latest.created_at : null
  };
}

module.exports = {
  addEntry,
  getHistory,
  getEntry,
  searchHistory,
  updateEntry,
  deleteEntry,
  clearHistory,
  getStats
};
