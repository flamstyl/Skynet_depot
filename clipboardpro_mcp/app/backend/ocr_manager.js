/**
 * OCR Manager - Interface with MCP OCR service
 */

const axios = require('axios');
const historyManager = require('./history_manager');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3002';
const API_KEY = process.env.MCP_API_KEY || 'dev-key';

/**
 * Process clipboard image with OCR
 * @param {string} imageData - Base64 image data
 * @param {number} historyId - Associated history entry ID
 * @param {object} options - OCR options
 * @returns {Promise<object>} OCR result
 */
async function processClipboardImage(imageData, historyId, options = {}) {
  try {
    console.log(`[OCR] Processing image for history entry #${historyId}`);

    const response = await axios.post(
      `${MCP_SERVER_URL}/ocr`,
      {
        image: imageData,
        language: options.language || 'eng'
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const { text, confidence } = response.data;

    // Update history entry with OCR text
    if (historyId) {
      await historyManager.updateEntry(historyId, {
        ocr_text: text
      });
    }

    console.log(`[OCR] Extracted ${text.length} characters with confidence ${confidence}`);

    return {
      success: true,
      text,
      confidence,
      words_count: text.split(/\s+/).length,
      history_id: historyId
    };
  } catch (error) {
    console.error('[OCR] Processing failed:', error.message);

    return {
      success: false,
      error: error.message,
      text: '',
      confidence: 0
    };
  }
}

/**
 * Extract text from image buffer
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} language - OCR language
 * @returns {Promise<object>} OCR result
 */
async function extractTextFromBuffer(imageBuffer, language = 'eng') {
  const imageBase64 = imageBuffer.toString('base64');
  return processClipboardImage(imageBase64, null, { language });
}

/**
 * Get OCR text for history entry
 * @param {number} historyId - History entry ID
 * @returns {Promise<string>} OCR text
 */
async function getOCRText(historyId) {
  const entry = await historyManager.getEntry(historyId);

  if (!entry) {
    throw new Error(`History entry #${historyId} not found`);
  }

  if (entry.type !== 'image') {
    throw new Error('Entry is not an image');
  }

  return entry.ocr_text || '';
}

/**
 * Reprocess OCR for existing entry
 * @param {number} historyId - History entry ID
 * @param {object} options - OCR options
 * @returns {Promise<object>} OCR result
 */
async function reprocessOCR(historyId, options = {}) {
  const entry = await historyManager.getEntry(historyId);

  if (!entry) {
    throw new Error(`History entry #${historyId} not found`);
  }

  if (entry.type !== 'image') {
    throw new Error('Entry is not an image');
  }

  // Re-run OCR on the image content
  return processClipboardImage(entry.content, historyId, options);
}

/**
 * Detect if image contains text
 * @param {string} imageData - Base64 image data
 * @returns {Promise<boolean>} True if text detected
 */
async function detectText(imageData) {
  try {
    const result = await processClipboardImage(imageData, null);
    return result.success && result.text.length > 0;
  } catch (error) {
    return false;
  }
}

module.exports = {
  processClipboardImage,
  extractTextFromBuffer,
  getOCRText,
  reprocessOCR,
  detectText
};
