const fs = require('fs').promises;
const path = require('path');
const iaBridge = require('./ia_bridge');

const ALIASES_PATH = path.join(__dirname, '..', '..', 'data', 'aliases.json');

let aliasesCache = null;

/**
 * Load aliases from file
 * @returns {Promise<array>} - Array of aliases
 */
async function loadAliases() {
  if (aliasesCache) return aliasesCache;

  try {
    const data = await fs.readFile(ALIASES_PATH, 'utf8');
    aliasesCache = JSON.parse(data);
    return aliasesCache;
  } catch (error) {
    // File doesn't exist, create empty
    aliasesCache = [];
    await saveAliasesToFile(aliasesCache);
    return aliasesCache;
  }
}

/**
 * Save aliases to file
 * @param {array} aliases - Aliases to save
 */
async function saveAliasesToFile(aliases) {
  try {
    // Ensure directory exists
    const dir = path.dirname(ALIASES_PATH);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(ALIASES_PATH, JSON.stringify(aliases, null, 2), 'utf8');
    aliasesCache = aliases;
  } catch (error) {
    console.error('[ALIAS] Failed to save aliases:', error);
  }
}

/**
 * Resolve a natural phrase to a command
 * @param {string} text - Natural language phrase
 * @returns {Promise<object>} - Resolved command info
 */
async function resolve(text) {
  const aliases = await loadAliases();

  // Check if exact match exists
  const exactMatch = aliases.find(
    alias => alias.natural.toLowerCase() === text.toLowerCase()
  );

  if (exactMatch) {
    return {
      command: exactMatch.command,
      description: exactMatch.description,
      source: 'alias'
    };
  }

  // Check for partial match
  const partialMatch = aliases.find(
    alias => alias.natural.toLowerCase().includes(text.toLowerCase()) ||
             text.toLowerCase().includes(alias.natural.toLowerCase())
  );

  if (partialMatch) {
    return {
      command: partialMatch.command,
      description: partialMatch.description,
      source: 'alias_partial'
    };
  }

  // No match found - ask IA to resolve
  const iaResult = await iaBridge.resolveNaturalAlias(text);

  if (iaResult && iaResult.command) {
    // Optionally save as new alias
    // For now, just return without saving
    return {
      command: iaResult.command,
      description: iaResult.description || 'AI-resolved command',
      source: 'ia',
      suggestedAlias: iaResult.alias || text
    };
  }

  // No resolution possible
  return {
    command: null,
    description: 'Unable to resolve',
    source: 'none'
  };
}

/**
 * List all aliases
 * @returns {Promise<array>} - All aliases
 */
async function listAliases() {
  return await loadAliases();
}

/**
 * Save a new alias
 * @param {object} alias - Alias object
 */
async function saveAlias(alias) {
  const aliases = await loadAliases();

  // Check if already exists
  const existingIndex = aliases.findIndex(
    a => a.natural.toLowerCase() === alias.natural.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Update existing
    aliases[existingIndex] = {
      ...aliases[existingIndex],
      ...alias,
      updatedAt: new Date().toISOString()
    };
  } else {
    // Add new
    aliases.push({
      ...alias,
      createdAt: alias.createdAt || new Date().toISOString()
    });
  }

  await saveAliasesToFile(aliases);
}

/**
 * Delete an alias
 * @param {string} natural - Natural phrase to delete
 */
async function deleteAlias(natural) {
  const aliases = await loadAliases();

  const filtered = aliases.filter(
    alias => alias.natural.toLowerCase() !== natural.toLowerCase()
  );

  await saveAliasesToFile(filtered);
}

/**
 * Search aliases
 * @param {string} query - Search query
 * @returns {Promise<array>} - Matching aliases
 */
async function searchAliases(query) {
  const aliases = await loadAliases();

  const lowerQuery = query.toLowerCase();

  return aliases.filter(
    alias =>
      alias.natural.toLowerCase().includes(lowerQuery) ||
      alias.command.toLowerCase().includes(lowerQuery) ||
      (alias.description && alias.description.toLowerCase().includes(lowerQuery))
  );
}

module.exports = {
  resolve,
  listAliases,
  saveAlias,
  deleteAlias,
  searchAliases
};
