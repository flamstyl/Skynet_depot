const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { createReadStream, createWriteStream } = require('fs');

const HISTORY_PATH = path.join(__dirname, '..', '..', 'data', 'history', 'echoterm_history.jsonl');

/**
 * Add an entry to history
 * @param {object} entry - History entry
 */
async function addEntry(entry) {
  try {
    // Ensure directory exists
    const dir = path.dirname(HISTORY_PATH);
    await fs.mkdir(dir, { recursive: true });

    // Append to JSONL file
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(HISTORY_PATH, line, 'utf8');

  } catch (error) {
    console.error('[HISTORY] Failed to add entry:', error);
  }
}

/**
 * Get history entries
 * @param {object} options - Query options
 * @returns {Promise<array>} - History entries
 */
async function getHistory(options = {}) {
  const {
    limit = 100,
    offset = 0,
    filter = null
  } = options;

  try {
    // Check if file exists
    try {
      await fs.access(HISTORY_PATH);
    } catch {
      return []; // File doesn't exist yet
    }

    const entries = [];

    // Read JSONL file line by line
    const fileStream = createReadStream(HISTORY_PATH);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const entry = JSON.parse(line);

          // Apply filter if provided
          if (filter) {
            const lowerFilter = filter.toLowerCase();
            if (
              !entry.command.toLowerCase().includes(lowerFilter) &&
              !(entry.stdout && entry.stdout.toLowerCase().includes(lowerFilter))
            ) {
              continue;
            }
          }

          entries.push(entry);
        } catch (parseError) {
          console.error('[HISTORY] Failed to parse line:', parseError);
        }
      }
    }

    // Reverse to get most recent first
    entries.reverse();

    // Apply offset and limit
    const sliced = entries.slice(offset, offset + limit);

    return sliced;

  } catch (error) {
    console.error('[HISTORY] Failed to get history:', error);
    return [];
  }
}

/**
 * Search history
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<array>} - Matching entries
 */
async function searchHistory(query, limit = 50) {
  return await getHistory({
    limit,
    offset: 0,
    filter: query
  });
}

/**
 * Clear history
 * @param {boolean} confirm - Confirmation flag
 */
async function clearHistory(confirm = false) {
  if (!confirm) {
    throw new Error('Confirmation required to clear history');
  }

  try {
    await fs.unlink(HISTORY_PATH);
    console.log('[HISTORY] History cleared');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, nothing to do
      return;
    }
    throw error;
  }
}

/**
 * Export history to CSV
 * @param {string} outputPath - Output file path
 * @returns {Promise<string>} - Output path
 */
async function exportToCSV(outputPath) {
  const entries = await getHistory({ limit: 10000 });

  const csv = [
    'timestamp,command,exitCode,duration,stdout,stderr',
    ...entries.map(entry => {
      const timestamp = entry.timestamp || '';
      const command = escapeCSV(entry.command || '');
      const exitCode = entry.exitCode || 0;
      const duration = entry.duration || 0;
      const stdout = escapeCSV((entry.stdout || '').substring(0, 200));
      const stderr = escapeCSV((entry.stderr || '').substring(0, 200));

      return `${timestamp},"${command}",${exitCode},${duration},"${stdout}","${stderr}"`;
    })
  ].join('\n');

  await fs.writeFile(outputPath, csv, 'utf8');

  return outputPath;
}

/**
 * Escape CSV field
 */
function escapeCSV(str) {
  return str.replace(/"/g, '""');
}

/**
 * Get statistics
 * @returns {Promise<object>} - Statistics
 */
async function getStatistics() {
  const entries = await getHistory({ limit: 10000 });

  const totalCommands = entries.length;
  const successCount = entries.filter(e => e.exitCode === 0).length;
  const errorCount = entries.filter(e => e.exitCode !== 0).length;

  const commandCounts = {};
  entries.forEach(entry => {
    const cmd = entry.command.split(' ')[0]; // First word
    commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
  });

  const topCommands = Object.entries(commandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cmd, count]) => ({ command: cmd, count }));

  return {
    totalCommands,
    successCount,
    errorCount,
    successRate: totalCommands > 0 ? (successCount / totalCommands * 100).toFixed(2) + '%' : '0%',
    topCommands
  };
}

module.exports = {
  addEntry,
  getHistory,
  searchHistory,
  clearHistory,
  exportToCSV,
  getStatistics
};
