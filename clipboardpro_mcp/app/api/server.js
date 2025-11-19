#!/usr/bin/env node

/**
 * Local API Server - ClipboardPro REST API
 *
 * Provides local HTTP API for the WinUI desktop app
 * to interact with clipboard history, OCR, and AI features
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const db = require('../backend/database');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: '*', // Allow all origins (localhost only in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('dev'));

// Request timestamp
app.use((req, res, next) => {
  req.timestamp = Date.now();
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'clipboardpro-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', routes);

// Root redirect
app.get('/', (req, res) => {
  res.json({
    name: 'ClipboardPro Local API',
    version: '1.0.0',
    description: 'Skynet Clipboard Intelligence - Local REST API',
    endpoints: {
      health: '/health',
      history: '/api/history',
      ocr: '/api/ocr',
      ai: '/api/ai/*',
      settings: '/api/settings',
      stats: '/api/stats'
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[API] Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// STARTUP
// ============================================

async function startServer() {
  try {
    // Initialize database
    console.log('[API] Initializing database...');
    await db.initialize();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('ClipboardPro Local API Server');
      console.log('='.repeat(50));
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${require('path').join(__dirname, '../../data/history.db')}`);
      console.log('='.repeat(50));
      console.log('');
      console.log('Available endpoints:');
      console.log(`  GET    http://localhost:${PORT}/health`);
      console.log(`  GET    http://localhost:${PORT}/api/history`);
      console.log(`  POST   http://localhost:${PORT}/api/history`);
      console.log(`  POST   http://localhost:${PORT}/api/ocr`);
      console.log(`  POST   http://localhost:${PORT}/api/ai/rewrite`);
      console.log(`  POST   http://localhost:${PORT}/api/ai/translate`);
      console.log(`  POST   http://localhost:${PORT}/api/ai/summarize`);
      console.log(`  POST   http://localhost:${PORT}/api/ai/clean`);
      console.log(`  GET    http://localhost:${PORT}/api/settings`);
      console.log(`  GET    http://localhost:${PORT}/api/stats`);
      console.log('');
      console.log('Press Ctrl+C to stop');
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('[API] Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', async () => {
  console.log('\n[API] Shutting down gracefully...');

  try {
    await db.close();
    console.log('[API] Database closed');
    process.exit(0);
  } catch (error) {
    console.error('[API] Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('[API] Received SIGTERM, shutting down...');

  try {
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('[API] Error during shutdown:', error);
    process.exit(1);
  }
});

// ============================================
// START
// ============================================

if (require.main === module) {
  startServer();
}

module.exports = app;
