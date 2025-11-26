const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const iaBridge = require('./ia_bridge');

const MEMORY_SHORT_PATH = path.join(__dirname, '..', '..', 'data', 'memory_short.json');
const MEMORY_LONG_PATH = path.join(__dirname, '..', '..', 'data', 'memory_long.json');

let sessionMemory = null;
let longtermMemory = null;

/**
 * Initialize session memory
 */
async function initSession() {
  sessionMemory = {
    sessionId: uuidv4(),
    startedAt: new Date().toISOString(),
    commands: [],
    objectives: [],
    errors: [],
    summary: ''
  };

  await saveSessionMemory();
}

/**
 * Load session memory
 * @returns {Promise<object>} - Session memory
 */
async function getSessionMemory() {
  if (sessionMemory) return sessionMemory;

  try {
    const data = await fs.readFile(MEMORY_SHORT_PATH, 'utf8');
    sessionMemory = JSON.parse(data);
    return sessionMemory;
  } catch (error) {
    // File doesn't exist, create new session
    await initSession();
    return sessionMemory;
  }
}

/**
 * Save session memory to file
 */
async function saveSessionMemory() {
  try {
    // Ensure directory exists
    const dir = path.dirname(MEMORY_SHORT_PATH);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(
      MEMORY_SHORT_PATH,
      JSON.stringify(sessionMemory, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('[MEMORY] Failed to save session:', error);
  }
}

/**
 * Add a command to session memory
 * @param {string} command - Executed command
 * @param {object} result - Execution result
 */
async function addCommand(command, result) {
  const memory = await getSessionMemory();

  memory.commands.push({
    command,
    timestamp: new Date().toISOString(),
    exitCode: result.exitCode,
    duration: result.duration
  });

  // Keep only last 50 commands in memory
  if (memory.commands.length > 50) {
    memory.commands = memory.commands.slice(-50);
  }

  // Track errors
  if (result.exitCode !== 0) {
    memory.errors.push({
      command,
      stderr: result.stderr,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 errors
    if (memory.errors.length > 20) {
      memory.errors = memory.errors.slice(-20);
    }
  }

  await saveSessionMemory();
}

/**
 * Add objective to session
 * @param {string} objective - User objective
 */
async function addObjective(objective) {
  const memory = await getSessionMemory();

  if (!memory.objectives.includes(objective)) {
    memory.objectives.push(objective);
  }

  await saveSessionMemory();
}

/**
 * Generate session summary using IA
 * @returns {Promise<string>} - Summary text
 */
async function generateSessionSummary() {
  const memory = await getSessionMemory();

  // Prepare session data
  const sessionData = {
    duration: calculateSessionDuration(memory.startedAt),
    commandCount: memory.commands.length,
    errorCount: memory.errors.length,
    commands: memory.commands.slice(-20), // Last 20 commands
    errors: memory.errors,
    objectives: memory.objectives
  };

  // Call IA to generate summary
  const summary = await iaBridge.generateSessionSummary(sessionData);

  // Save summary to memory
  memory.summary = summary;
  await saveSessionMemory();

  return summary;
}

/**
 * Calculate session duration
 * @param {string} startTime - ISO timestamp
 * @returns {string} - Human-readable duration
 */
function calculateSessionDuration(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Load long-term memory
 * @returns {Promise<object>} - Long-term memory
 */
async function getLongtermMemory() {
  if (longtermMemory) return longtermMemory;

  try {
    const data = await fs.readFile(MEMORY_LONG_PATH, 'utf8');
    longtermMemory = JSON.parse(data);
    return longtermMemory;
  } catch (error) {
    // File doesn't exist, create default
    longtermMemory = {
      userId: 'user',
      patterns: {
        mostUsedCommands: [],
        frequentErrors: [],
        workingHours: 'N/A',
        preferredShell: 'powershell'
      },
      preferences: {
        aiProvider: 'claude',
        suggestionMode: 'auto'
      }
    };

    await saveLongtermMemory();
    return longtermMemory;
  }
}

/**
 * Save long-term memory to file
 */
async function saveLongtermMemory() {
  try {
    // Ensure directory exists
    const dir = path.dirname(MEMORY_LONG_PATH);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(
      MEMORY_LONG_PATH,
      JSON.stringify(longtermMemory, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('[MEMORY] Failed to save longterm:', error);
  }
}

/**
 * Update memory (session or longterm)
 * @param {object} data - Data to update
 */
async function updateMemory(data) {
  if (data.type === 'session') {
    const memory = await getSessionMemory();
    Object.assign(memory, data.updates);
    await saveSessionMemory();
  } else if (data.type === 'longterm') {
    const memory = await getLongtermMemory();
    Object.assign(memory, data.updates);
    await saveLongtermMemory();
  }
}

/**
 * Merge session data into long-term memory
 */
async function mergeSessionToLongterm() {
  const session = await getSessionMemory();
  const longterm = await getLongtermMemory();

  // Update most used commands
  const commandCounts = {};

  session.commands.forEach(cmd => {
    const command = cmd.command;
    commandCounts[command] = (commandCounts[command] || 0) + 1;
  });

  // Merge with existing
  longterm.patterns.mostUsedCommands.forEach(cmd => {
    commandCounts[cmd] = (commandCounts[cmd] || 0) + 5; // Boost existing
  });

  // Sort and take top 10
  const sorted = Object.entries(commandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cmd]) => cmd);

  longterm.patterns.mostUsedCommands = sorted;

  // Update working hours (simple heuristic)
  const sessionHour = new Date(session.startedAt).getHours();
  longterm.patterns.workingHours = `${sessionHour}:00 - ${(sessionHour + 8) % 24}:00`;

  await saveLongtermMemory();
}

/**
 * Save and merge session on shutdown
 */
async function saveSession() {
  await saveSessionMemory();
  await mergeSessionToLongterm();
  console.log('[MEMORY] Session saved and merged to long-term');
}

// Initialize on module load
(async () => {
  await getSessionMemory();
  await getLongtermMemory();
})();

module.exports = {
  getSessionMemory,
  getLongtermMemory,
  addCommand,
  addObjective,
  generateSessionSummary,
  updateMemory,
  saveSession
};
