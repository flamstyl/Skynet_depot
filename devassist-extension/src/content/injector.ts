/**
 * DevAssist Content Script Injector
 *
 * This script is injected into all web pages.
 * Responsibilities:
 * - Inject sidebar component
 * - Inject code toolbar
 * - Listen for messages from background script
 */

import { createRoot } from 'react-dom/client';
import { Sidebar } from './sidebar/Sidebar';
import './sidebar/styles.css';

console.log('[DevAssist] Content script injected');

// ============================================================================
// SIDEBAR INJECTION
// ============================================================================

function injectSidebar() {
  // Check if already injected
  if (document.getElementById('devassist-sidebar-root')) {
    console.log('[DevAssist] Sidebar already injected');
    return;
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'devassist-sidebar-root';

  // Use Shadow DOM to isolate styles from host page
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Create React root inside shadow DOM
  const reactRoot = document.createElement('div');
  shadowRoot.appendChild(reactRoot);

  // Inject styles into shadow DOM
  const styleSheet = document.createElement('link');
  styleSheet.rel = 'stylesheet';
  styleSheet.href = chrome.runtime.getURL('dist/content/sidebar/styles.css');
  shadowRoot.appendChild(styleSheet);

  // Append to body
  document.body.appendChild(container);

  // Render React component
  const root = createRoot(reactRoot);
  root.render(<Sidebar />);

  console.log('[DevAssist] Sidebar injected successfully');
}

// ============================================================================
// CODE TOOLBAR INJECTION
// ============================================================================

function injectCodeToolbar() {
  // TODO: Implement code toolbar injection
  // This should show a floating toolbar when user selects code
  console.log('[DevAssist] Code toolbar injection pending');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initialize() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectSidebar();
      injectCodeToolbar();
    });
  } else {
    injectSidebar();
    injectCodeToolbar();
  }
}

// ============================================================================
// MESSAGE LISTENERS
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[DevAssist] Content script received message:', message.type);

  // Messages are handled by the Sidebar component
  // This listener is just for logging and debugging

  sendResponse({ received: true });
  return true;
});

// ============================================================================
// START
// ============================================================================

initialize();
