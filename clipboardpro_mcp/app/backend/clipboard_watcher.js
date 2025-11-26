/**
 * Clipboard Watcher (Backend) - Alternative Node.js-based clipboard monitoring
 * Note: Primary clipboard watching is done in WinUI app
 * This provides backup/alternative monitoring if needed
 */

const { EventEmitter } = require('events');

// TODO: Install clipboard monitoring library
// Options:
// - clipboardy (cross-platform)
// - node-clipboard (Windows-specific)
// - electron-clipboard (if using Electron)

/**
 * Clipboard Watcher class
 * Monitors system clipboard for changes
 */
class ClipboardWatcher extends EventEmitter {
  constructor(options = {}) {
    super();

    this.interval = options.interval || 1000; // Check every second
    this.lastContent = '';
    this.isRunning = false;
    this.timer = null;
  }

  /**
   * Start watching clipboard
   */
  start() {
    if (this.isRunning) {
      console.warn('[CLIPBOARD] Watcher already running');
      return;
    }

    console.log('[CLIPBOARD] Starting watcher...');
    this.isRunning = true;

    this.timer = setInterval(() => {
      this.checkClipboard();
    }, this.interval);

    this.emit('started');
  }

  /**
   * Stop watching clipboard
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[CLIPBOARD] Stopping watcher...');
    this.isRunning = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.emit('stopped');
  }

  /**
   * Check clipboard for changes
   */
  async checkClipboard() {
    try {
      // TODO: Implement actual clipboard reading
      // const content = await clipboard.read();

      // Mock implementation
      const content = this.getMockClipboardContent();

      if (content !== this.lastContent) {
        const type = this.detectContentType(content);

        this.emit('change', {
          type,
          content,
          timestamp: Date.now()
        });

        this.lastContent = content;
        console.log(`[CLIPBOARD] Detected ${type} change`);
      }
    } catch (error) {
      console.error('[CLIPBOARD] Error checking clipboard:', error.message);
      this.emit('error', error);
    }
  }

  /**
   * Detect content type
   * @param {string} content - Clipboard content
   * @returns {string} Content type
   */
  detectContentType(content) {
    // Simple heuristics
    if (content.startsWith('data:image/')) {
      return 'image';
    }

    if (content.startsWith('file:///') || content.includes('\\')) {
      return 'file';
    }

    return 'text';
  }

  /**
   * Get mock clipboard content for testing
   * @returns {string} Mock content
   */
  getMockClipboardContent() {
    // In production, this would read actual clipboard
    // For now, return constant to avoid infinite loop
    return this.lastContent;
  }

  /**
   * Get current status
   * @returns {object} Status
   */
  getStatus() {
    return {
      running: this.isRunning,
      interval: this.interval,
      last_content_length: this.lastContent.length
    };
  }
}

/**
 * Create clipboard watcher instance
 * @param {object} options - Watcher options
 * @returns {ClipboardWatcher} Watcher instance
 */
function createWatcher(options = {}) {
  return new ClipboardWatcher(options);
}

module.exports = {
  ClipboardWatcher,
  createWatcher
};
