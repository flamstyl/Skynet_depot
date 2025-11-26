/**
 * AI Bridge - Interface with Claude CLI and Gemini CLI
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const PROMPTS_DIR = path.join(__dirname, '../../../ai_prompts');

/**
 * Load prompt template from file
 * @param {string} action - Action name (rewrite, translate, etc.)
 * @returns {string} Prompt template
 */
async function loadPrompt(action) {
  try {
    const promptPath = path.join(PROMPTS_DIR, `${action}.md`);
    const content = await fs.readFile(promptPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`[AI] Failed to load prompt for ${action}:`, error.message);
    return getDefaultPrompt(action);
  }
}

/**
 * Get default prompt if file doesn't exist
 * @param {string} action - Action name
 * @returns {string} Default prompt
 */
function getDefaultPrompt(action) {
  const defaults = {
    rewrite: 'Rewrite the following text in a professional style:\n\n{text}',
    translate: 'Translate the following text to {target_language}:\n\n{text}',
    summarize: 'Summarize the following text:\n\n{text}',
    clean: 'Clean and format the following text:\n\n{text}'
  };

  return defaults[action] || '{text}';
}

/**
 * Call Claude CLI
 * @param {string} prompt - Prompt to send
 * @param {string} text - Text to process
 * @returns {object} AI response
 */
async function callClaude(prompt, text) {
  console.log('[AI] Calling Claude CLI...');

  try {
    // Replace placeholder in prompt
    const fullPrompt = prompt.replace(/{text}/g, text);

    // TODO: Call actual Claude CLI
    // const { stdout } = await execAsync(`claude "${fullPrompt}"`);

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = getMockAIResponse('claude', fullPrompt, text);

    return {
      success: true,
      result,
      provider: 'claude',
      model: 'claude-sonnet-4.5',
      usage: {
        input_tokens: estimateTokens(fullPrompt),
        output_tokens: estimateTokens(result)
      }
    };
  } catch (error) {
    console.error('[AI] Claude CLI error:', error.message);
    throw error;
  }
}

/**
 * Call Gemini CLI
 * @param {string} prompt - Prompt to send
 * @param {string} text - Text to process
 * @returns {object} AI response
 */
async function callGemini(prompt, text) {
  console.log('[AI] Calling Gemini CLI...');

  try {
    const fullPrompt = prompt.replace(/{text}/g, text);

    // TODO: Call actual Gemini CLI
    // const { stdout } = await execAsync(`gemini "${fullPrompt}"`);

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 800));
    const result = getMockAIResponse('gemini', fullPrompt, text);

    return {
      success: true,
      result,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      usage: {
        input_tokens: estimateTokens(fullPrompt),
        output_tokens: estimateTokens(result)
      }
    };
  } catch (error) {
    console.error('[AI] Gemini CLI error:', error.message);
    throw error;
  }
}

/**
 * Rewrite text
 * @param {string} text - Text to rewrite
 * @param {string} style - Rewrite style
 * @returns {object} Rewritten text
 */
async function rewrite(text, style = 'professional') {
  const prompt = await loadPrompt('rewrite');
  const enhancedPrompt = prompt
    .replace(/{text}/g, text)
    .replace(/{style}/g, style);

  try {
    return await callClaude(enhancedPrompt, text);
  } catch (error) {
    console.log('[AI] Claude failed, trying Gemini fallback...');
    return await callGemini(enhancedPrompt, text);
  }
}

/**
 * Translate text
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language
 * @param {string} sourceLanguage - Source language (optional)
 * @returns {object} Translated text
 */
async function translate(text, targetLanguage, sourceLanguage = 'auto') {
  const prompt = await loadPrompt('translate');
  const enhancedPrompt = prompt
    .replace(/{text}/g, text)
    .replace(/{target_language}/g, targetLanguage)
    .replace(/{source_language}/g, sourceLanguage);

  try {
    return await callClaude(enhancedPrompt, text);
  } catch (error) {
    console.log('[AI] Claude failed, trying Gemini fallback...');
    return await callGemini(enhancedPrompt, text);
  }
}

/**
 * Summarize text
 * @param {string} text - Text to summarize
 * @param {string} length - Summary length
 * @returns {object} Summarized text
 */
async function summarize(text, length = 'medium') {
  const prompt = await loadPrompt('summarize');
  const enhancedPrompt = prompt
    .replace(/{text}/g, text)
    .replace(/{length}/g, length);

  try {
    return await callClaude(enhancedPrompt, text);
  } catch (error) {
    console.log('[AI] Claude failed, trying Gemini fallback...');
    return await callGemini(enhancedPrompt, text);
  }
}

/**
 * Clean text
 * @param {string} text - Text to clean
 * @param {object} options - Cleaning options
 * @returns {object} Cleaned text
 */
async function clean(text, options = {}) {
  const prompt = await loadPrompt('clean');
  const enhancedPrompt = prompt
    .replace(/{text}/g, text)
    .replace(/{options}/g, JSON.stringify(options));

  try {
    return await callClaude(enhancedPrompt, text);
  } catch (error) {
    console.log('[AI] Claude failed, trying Gemini fallback...');
    return await callGemini(enhancedPrompt, text);
  }
}

/**
 * Estimate tokens in text (rough approximation)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

/**
 * Get mock AI response for testing
 * @param {string} provider - AI provider
 * @param {string} prompt - Prompt sent
 * @param {string} text - Original text
 * @returns {string} Mock response
 */
function getMockAIResponse(provider, prompt, text) {
  // Simple mock based on prompt keywords
  if (prompt.toLowerCase().includes('rewrite')) {
    return `[${provider.toUpperCase()} MOCK] This is a professionally rewritten version of your text. ${text.substring(0, 50)}... has been enhanced with better clarity and structure.`;
  }

  if (prompt.toLowerCase().includes('translate')) {
    return `[${provider.toUpperCase()} MOCK] Ceci est une traduction simulée de votre texte. (This is a simulated translation of your text.)`;
  }

  if (prompt.toLowerCase().includes('summarize')) {
    const words = text.split(/\s+/);
    const summaryWords = Math.min(50, Math.floor(words.length / 3));
    return `[${provider.toUpperCase()} MOCK] Summary: ${words.slice(0, summaryWords).join(' ')}...`;
  }

  if (prompt.toLowerCase().includes('clean')) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim();
  }

  return `[${provider.toUpperCase()} MOCK] Processed: ${text}`;
}

module.exports = {
  loadPrompt,
  callClaude,
  callGemini,
  rewrite,
  translate,
  summarize,
  clean
};
