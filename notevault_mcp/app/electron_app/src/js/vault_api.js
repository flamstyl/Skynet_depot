/**
 * NoteVault — Vault API Client
 * Helper functions for backend communication
 */

// Base URLs
const BACKEND_URL = 'http://localhost:5050';
const MCP_URL = 'http://localhost:3000';

// Vault API
const VaultAPI = {
  // Check backend health
  async checkHealth() {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Backend health check failed:', error);
      return { status: 'offline' };
    }
  },

  // Format date
  formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format tags
  formatTags(tags) {
    return tags.map(tag => `#${tag}`).join(' ');
  },

  // Truncate text
  truncate(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Extract preview from markdown
  extractPreview(markdown, maxLength = 200) {
    // Remove headings
    let text = markdown.replace(/^#+\s+/gm, '');
    // Remove emphasis
    text = text.replace(/[*_]/g, '');
    // Remove links
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // Truncate
    return this.truncate(text.trim(), maxLength);
  }
};

// Make available globally (for inline scripts)
window.VaultAPI = VaultAPI;
