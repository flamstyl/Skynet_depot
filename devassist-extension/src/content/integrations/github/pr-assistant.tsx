/**
 * GitHub PR Assistant
 *
 * Injects "Analyze with DevAssist" button on GitHub PR pages
 * Provides one-click PR analysis with autonomous agents
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// ============================================================================
// HELPERS
// ============================================================================

interface PRInfo {
  owner: string;
  repo: string;
  prNumber: number;
}

function extractPRInfo(): PRInfo | null {
  const match = window.location.pathname.match(/\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
    prNumber: parseInt(match[3]),
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

const PRAnalyzeButton: React.FC<{ prInfo: PRInfo }> = ({ prInfo }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    try {
      // Start agent
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_PR',
        payload: {
          owner: prInfo.owner,
          repo: prInfo.repo,
          prNumber: prInfo.prNumber,
          tasks: ['security', 'quality', 'performance'],
        },
      });

      console.log('[DevAssist] PR analysis started:', response.agentId);

      // Open sidebar to show progress
      chrome.runtime.sendMessage({ type: 'TOGGLE_SIDEBAR' });

      // Show success notification
      // TODO: Implement notification UI
      alert('PR analysis started! Check the DevAssist sidebar for progress.');
    } catch (error) {
      console.error('[DevAssist] PR analysis failed:', error);
      alert('Failed to start PR analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <button
      className="btn btn-sm devassist-pr-button"
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: '#0ea5e9',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
        opacity: isAnalyzing ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isAnalyzing) {
          e.currentTarget.style.background = '#0284c7';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#0ea5e9';
      }}
    >
      <span style={{ fontSize: '16px' }}>🤖</span>
      {isAnalyzing ? 'Analyzing...' : 'Analyze with DevAssist'}
    </button>
  );
};

// ============================================================================
// INJECTION
// ============================================================================

function injectPRButton() {
  const prInfo = extractPRInfo();
  if (!prInfo) {
    console.log('[DevAssist] Not on a PR page');
    return;
  }

  // Find GitHub PR header actions area
  // GitHub's DOM structure: .gh-header-actions
  const actionsBar = document.querySelector('.gh-header-actions');
  if (!actionsBar) {
    console.log('[DevAssist] PR actions bar not found yet');
    return;
  }

  // Check if button already injected
  if (actionsBar.querySelector('.devassist-pr-button')) {
    console.log('[DevAssist] PR button already injected');
    return;
  }

  // Create container
  const container = document.createElement('div');
  container.className = 'devassist-pr-button-container';
  container.style.display = 'inline-block';
  container.style.marginRight = '8px';

  // Insert at beginning of actions bar
  actionsBar.prepend(container);

  // Render button
  const root = createRoot(container);
  root.render(<PRAnalyzeButton prInfo={prInfo} />);

  console.log('[DevAssist] PR button injected successfully');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initialize() {
  // Check if we're on a GitHub PR page
  if (!window.location.pathname.includes('/pull/')) {
    return;
  }

  // Initial injection (with retry)
  const tryInject = () => {
    injectPRButton();

    // If injection failed, retry after 1 second
    if (!document.querySelector('.devassist-pr-button')) {
      setTimeout(tryInject, 1000);
    }
  };

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }

  // Re-inject on GitHub SPA navigation
  // GitHub uses pushState for navigation, so we need to watch for URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (url.includes('/pull/')) {
        setTimeout(injectPRButton, 500); // Give GitHub time to render
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

// ============================================================================
// START
// ============================================================================

initialize();

export {};
