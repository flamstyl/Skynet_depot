/**
 * API Routes - Local REST API for ClipboardPro
 */

const express = require('express');
const router = express.Router();

const historyManager = require('../backend/history_manager');
const ocrManager = require('../backend/ocr_manager');
const aiManager = require('../backend/ai_manager');
const db = require('../backend/database');

// ============================================
// HISTORY ROUTES
// ============================================

/**
 * GET /history - Get clipboard history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const filter = {};

    if (req.query.type) filter.type = req.query.type;
    if (req.query.device_id) filter.device_id = req.query.device_id;
    if (req.query.synced !== undefined) filter.synced = req.query.synced === 'true';
    if (req.query.since) filter.since = req.query.since;

    const entries = await historyManager.getHistory(limit, offset, filter);
    const stats = await historyManager.getStats();

    res.json({
      success: true,
      entries,
      count: entries.length,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /history/:id - Get single history entry
 */
router.get('/history/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const entry = await historyManager.getEntry(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    // Include AI transformations if any
    const transformations = await aiManager.getTransformations(id);

    res.json({
      success: true,
      entry,
      transformations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /history - Add new history entry
 */
router.post('/history', async (req, res) => {
  try {
    const { type, content, metadata } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Type and content are required'
      });
    }

    const entry = await historyManager.addEntry(type, content, metadata || {});

    // If image, trigger OCR processing
    if (type === 'image') {
      // Process OCR asynchronously
      ocrManager.processClipboardImage(content, entry.id)
        .catch(err => console.error('[API] OCR processing failed:', err));
    }

    res.status(201).json({
      success: true,
      entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /history/:id - Delete history entry
 */
router.delete('/history/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await historyManager.deleteEntry(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Entry deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /history/search - Search history
 */
router.post('/history/search', async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const entries = await historyManager.searchHistory(query, limit);

    res.json({
      success: true,
      entries,
      count: entries.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /history - Clear all history
 */
router.delete('/history', async (req, res) => {
  try {
    const options = {};
    if (req.query.before) options.before = req.query.before;

    const count = await historyManager.clearHistory(options);

    res.json({
      success: true,
      deleted: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// OCR ROUTES
// ============================================

/**
 * POST /ocr - Process image with OCR
 */
router.post('/ocr', async (req, res) => {
  try {
    const { image, history_id, language } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    const result = await ocrManager.processClipboardImage(
      image,
      history_id || null,
      { language }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /ocr/reprocess/:id - Reprocess OCR for history entry
 */
router.post('/ocr/reprocess/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { language } = req.body;

    const result = await ocrManager.reprocessOCR(id, { language });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// AI ROUTES
// ============================================

/**
 * POST /ai/rewrite - Rewrite text
 */
router.post('/ai/rewrite', async (req, res) => {
  try {
    const { text, style, history_id } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await aiManager.rewrite(text, { style, history_id });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /ai/translate - Translate text
 */
router.post('/ai/translate', async (req, res) => {
  try {
    const { text, target_language, source_language, history_id } = req.body;

    if (!text || !target_language) {
      return res.status(400).json({
        success: false,
        error: 'Text and target_language are required'
      });
    }

    const result = await aiManager.translate(text, target_language, {
      source_language,
      history_id
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /ai/summarize - Summarize text
 */
router.post('/ai/summarize', async (req, res) => {
  try {
    const { text, length, history_id } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await aiManager.summarize(text, { length, history_id });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /ai/clean - Clean text
 */
router.post('/ai/clean', async (req, res) => {
  try {
    const { text, options, history_id } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await aiManager.clean(text, { ...options, history_id });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /ai/transformations/:history_id - Get transformations for entry
 */
router.get('/ai/transformations/:history_id', async (req, res) => {
  try {
    const historyId = parseInt(req.params.history_id);
    const transformations = await aiManager.getTransformations(historyId);

    res.json({
      success: true,
      transformations,
      count: transformations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// SETTINGS ROUTES
// ============================================

/**
 * GET /settings - Get all settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.all('SELECT * FROM settings');

    const settingsObj = settings.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    res.json({
      success: true,
      settings: settingsObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /settings - Update settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Settings object is required'
      });
    }

    for (const [key, value] of Object.entries(settings)) {
      await db.run(
        `INSERT OR REPLACE INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [key, value]
      );
    }

    res.json({
      success: true,
      message: 'Settings updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// STATS ROUTE
// ============================================

/**
 * GET /stats - Get system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const historyStats = await historyManager.getStats();

    const aiTransformationsCount = await db.get(
      'SELECT COUNT(*) as count FROM ai_transformations'
    );

    res.json({
      success: true,
      stats: {
        history: historyStats,
        ai_transformations: aiTransformationsCount.count,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
