import logger from '../utils/logger.js';
import { runCode } from './docker_runner.js';

const MAX_FIX_ATTEMPTS = 5;

/**
 * Auto-fix code using Claude
 * @param {Object} options - Fix options
 * @param {string} options.code - Original code
 * @param {string} options.stderr - Error output
 * @param {string} options.language - Programming language
 * @param {number} options.maxAttempts - Maximum fix attempts
 * @returns {string} Fixed code
 */
export async function autoFixCode(options) {
  const {
    code,
    stderr,
    language,
    maxAttempts = MAX_FIX_ATTEMPTS
  } = options;

  logger.info('Starting auto-fix loop');

  let currentCode = code;
  let currentStderr = stderr;
  let attempts = 0;

  const fixHistory = [];

  while (attempts < maxAttempts) {
    attempts++;
    logger.info(`Auto-fix attempt ${attempts}/${maxAttempts}`);

    try {
      // Request fix from Claude via MCP
      const fixedCode = await requestClaudeFix({
        code: currentCode,
        error: currentStderr,
        language,
        attempt: attempts
      });

      if (!fixedCode || fixedCode === currentCode) {
        logger.warn('Claude returned no fix or same code');
        break;
      }

      fixHistory.push({
        attempt: attempts,
        code: fixedCode,
        timestamp: new Date().toISOString()
      });

      // Test the fixed code
      logger.info('Testing fixed code...');
      const result = await runCode({
        code: fixedCode,
        language,
        autoFix: false // Disable auto-fix during testing
      });

      if (result.success) {
        logger.info(`✓ Auto-fix succeeded after ${attempts} attempts`);
        return {
          success: true,
          fixedCode,
          attempts,
          history: fixHistory
        };
      }

      // Still has errors, prepare for next iteration
      currentCode = fixedCode;
      currentStderr = result.stderr;
      logger.info(`Attempt ${attempts} failed, trying again...`);

    } catch (error) {
      logger.error(`Auto-fix attempt ${attempts} failed:`, error);
      fixHistory.push({
        attempt: attempts,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  logger.warn(`Auto-fix failed after ${attempts} attempts`);
  return {
    success: false,
    fixedCode: currentCode,
    attempts,
    history: fixHistory,
    error: 'Max attempts reached'
  };
}

/**
 * Request fix from Claude via MCP
 * This is a stub - needs to be implemented with actual Claude API/MCP integration
 */
async function requestClaudeFix(options) {
  const { code, error, language, attempt } = options;

  // TODO: Implement actual Claude API call via MCP
  // For now, this is a placeholder that would need to:
  // 1. Connect to Claude via MCP server
  // 2. Send prompt with code and error
  // 3. Parse and return the fixed code

  const prompt = buildFixPrompt(code, error, language, attempt);

  logger.info('Sending fix request to Claude (MCP)');
  logger.debug('Prompt:', prompt);

  // PLACEHOLDER: In real implementation, this would call Claude API
  // Example:
  // const response = await mcpBridge.sendToClaude(prompt);
  // return extractCode(response);

  // For now, return null to indicate not implemented
  logger.warn('Claude MCP integration not yet implemented');
  return null;
}

/**
 * Build prompt for Claude to fix the code
 */
function buildFixPrompt(code, error, language, attempt) {
  return `You are an expert ${language} developer. I have code that is producing an error.

**Original Code:**
\`\`\`${language}
${code}
\`\`\`

**Error Output:**
\`\`\`
${error}
\`\`\`

**Fix Attempt:** ${attempt}

Please analyze the error and provide a corrected version of the code that fixes the issue.

**Requirements:**
1. Fix the specific error mentioned in the error output
2. Maintain the original functionality and intent
3. Add comments explaining what was wrong and how you fixed it
4. Ensure the code follows best practices for ${language}
5. Return ONLY the corrected code, no additional explanation outside of comments

**Corrected Code:**`;
}

/**
 * Run auto-fix loop until success or max attempts
 * This is the main entry point for autonomous fixing
 */
export async function autoFixLoop(options) {
  const {
    code,
    language,
    filename,
    maxAttempts = MAX_FIX_ATTEMPTS
  } = options;

  logger.info('Starting autonomous auto-fix loop');

  let attempts = 0;
  let currentCode = code;

  while (attempts < maxAttempts) {
    attempts++;
    logger.info(`=== Auto-fix loop iteration ${attempts}/${maxAttempts} ===`);

    // Run code
    const result = await runCode({
      code: currentCode,
      language,
      filename,
      autoFix: false
    });

    // Check if successful
    if (result.success) {
      logger.info(`✓ Code succeeded after ${attempts} iterations`);
      return {
        success: true,
        code: currentCode,
        iterations: attempts,
        finalResult: result
      };
    }

    // Has errors, request fix
    logger.info('Code has errors, requesting fix from Claude...');

    const fixResult = await autoFixCode({
      code: currentCode,
      stderr: result.stderr,
      language,
      maxAttempts: 1 // Only one fix attempt per loop iteration
    });

    if (!fixResult.success || !fixResult.fixedCode) {
      logger.error('Failed to get fix from Claude');
      return {
        success: false,
        code: currentCode,
        iterations: attempts,
        error: 'Claude fix failed',
        finalResult: result
      };
    }

    currentCode = fixResult.fixedCode;
    logger.info('Received fix from Claude, testing...');
  }

  logger.warn(`Auto-fix loop failed after ${attempts} iterations`);
  return {
    success: false,
    code: currentCode,
    iterations: attempts,
    error: 'Max iterations reached'
  };
}
