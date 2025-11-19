/**
 * DevAssist AI - Background Service Worker
 *
 * This is the orchestration center of the extension.
 * Handles:
 * - Message routing between components
 * - AI API calls
 * - Agent execution management
 * - Authentication & session management
 * - Task scheduling
 */

import type { Message, UserContext } from '@types/index';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';

// ============================================================================
// INITIALIZATION
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[DevAssist] Extension installed', details.reason);

  if (details.reason === 'install') {
    // First install
    await handleFirstInstall();
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('[DevAssist] Extension updated to', chrome.runtime.getManifest().version);
  }

  // Setup side panel behavior
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Create context menu
  chrome.contextMenus.create({
    id: 'devassist-explain',
    title: 'Explain with DevAssist',
    contexts: ['selection']
  });
});

async function handleFirstInstall() {
  // Initialize default settings
  await chrome.storage.sync.set({
    defaultModel: 'gpt-4o',
    theme: 'auto',
    shortcutEnabled: true,
    privacyMode: 'balanced',
    version: '1.0.0'
  });

  // Open welcome page
  chrome.tabs.create({
    url: 'https://devassist.ai/welcome'
  });

  console.log('[DevAssist] First install setup complete');
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('[DevAssist] Message received:', message.type);

  // Handle message asynchronously
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('[DevAssist] Message handler error:', error);
      sendResponse({ error: error.message });
    });

  // Return true to indicate async response
  return true;
});

async function handleMessage(message: Message, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    // ────────────────────────────────────────────────────────────
    // CHAT & AI
    // ────────────────────────────────────────────────────────────

    case 'SEND_TO_AI':
      return await handleAIRequest(message.payload);

    case 'SWITCH_MODEL':
      return await switchModel(message.payload.model);

    // ────────────────────────────────────────────────────────────
    // AGENTIC MODE
    // ────────────────────────────────────────────────────────────

    case 'START_AGENT':
      // TODO: Implement agent execution
      return { agentId: 'agent-' + Date.now(), status: 'started' };

    case 'STOP_AGENT':
      // TODO: Implement agent stopping
      return { success: true };

    case 'GET_AGENT_STATUS':
      // TODO: Implement agent status retrieval
      return { status: 'running', progress: 50 };

    // ────────────────────────────────────────────────────────────
    // CONTEXT DETECTION
    // ────────────────────────────────────────────────────────────

    case 'DETECT_CONTEXT':
      return await detectContext(sender.tab);

    // ────────────────────────────────────────────────────────────
    // GITHUB
    // ────────────────────────────────────────────────────────────

    case 'ANALYZE_PR':
      // TODO: Implement PR analysis
      return { success: true, agentId: 'agent-pr-' + Date.now() };

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// ============================================================================
// AI REQUEST HANDLING
// ============================================================================

async function handleAIRequest(payload: {
  prompt: string;
  context?: UserContext;
  model?: string;
  stream?: boolean;
}) {
  const { prompt, context, model = 'gpt-4o', stream = false } = payload;

  // Get auth token
  const { authToken } = await chrome.storage.local.get('authToken');

  if (!authToken) {
    throw new Error('Not authenticated. Please login first.');
  }

  // Build request
  const requestBody = {
    prompt,
    model,
    context,
    stream
  };

  // Call backend API
  const response = await fetch(`${API_BASE_URL}/api/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  if (stream) {
    // TODO: Implement streaming response handling
    // For now, return as regular response
  }

  const data = await response.json();
  return {
    content: data.content,
    model: data.model,
    usage: data.usage
  };
}

async function switchModel(model: string) {
  await chrome.storage.sync.set({ defaultModel: model });
  return { success: true, model };
}

// ============================================================================
// CONTEXT DETECTION
// ============================================================================

async function detectContext(tab?: chrome.tabs.Tab): Promise<UserContext> {
  if (!tab || !tab.url) {
    return {};
  }

  const url = tab.url;
  const context: UserContext = { url };

  // Detect GitHub
  const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (githubMatch) {
    context.platform = 'github';
    context.repository = `${githubMatch[1]}/${githubMatch[2]}`;

    // Detect PR
    const prMatch = url.match(/pull\/(\d+)/);
    if (prMatch) {
      context.prNumber = parseInt(prMatch[1]);
    }

    // Detect Issue
    const issueMatch = url.match(/issues\/(\d+)/);
    if (issueMatch) {
      context.issueNumber = parseInt(issueMatch[1]);
    }
  }

  // Detect StackOverflow
  if (url.includes('stackoverflow.com')) {
    context.platform = 'stackoverflow';

    const questionMatch = url.match(/questions\/(\d+)/);
    if (questionMatch) {
      context.questionId = parseInt(questionMatch[1]);
    }
  }

  // Detect documentation sites
  const docSites = [
    'react.dev',
    'docs.python.org',
    'doc.rust-lang.org',
    'docs.aws.amazon.com',
    'developer.mozilla.org'
  ];

  if (docSites.some(site => url.includes(site))) {
    context.platform = 'documentation';
  }

  return context;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

chrome.commands.onCommand.addListener(async (command) => {
  console.log('[DevAssist] Command triggered:', command);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  switch (command) {
    case 'toggle-sidebar':
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
      break;

    case 'quick-explain':
      chrome.tabs.sendMessage(tab.id, { type: 'QUICK_EXPLAIN' });
      break;
  }
});

// ============================================================================
// CONTEXT MENU
// ============================================================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'devassist-explain' && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'EXPLAIN_SELECTION',
      payload: { text: info.selectionText }
    });
  }
});

// ============================================================================
// LIFECYCLE
// ============================================================================

chrome.runtime.onSuspend.addListener(() => {
  console.log('[DevAssist] Service worker suspending...');
  // TODO: Cleanup any pending operations
});

// Global error handler
self.addEventListener('error', (event) => {
  console.error('[DevAssist] Service worker error:', event.error);
  // TODO: Send to error tracking (Sentry)
});

console.log('[DevAssist] Service worker initialized');
