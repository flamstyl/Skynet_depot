/**
 * DevAssist AI Sidebar Component
 *
 * Main sidebar interface that shows:
 * - Chat with AI models
 * - Agent execution monitoring
 * - Model selector
 * - Settings
 */

import React, { useState, useEffect } from 'react';
import type { ChatMessage, AgentStatus, AIModel } from '@types/index';

interface SidebarProps {
  initialOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeTab, setActiveTab] = useState<'chat' | 'agent'>('chat');
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);

  // ──────────────────────────────────────────────────────────
  // MESSAGE LISTENERS
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (message: any) => {
      switch (message.type) {
        case 'TOGGLE_SIDEBAR':
          setIsOpen((prev) => !prev);
          break;

        case 'QUICK_EXPLAIN':
        case 'EXPLAIN_SELECTION':
          setIsOpen(true);
          setActiveTab('chat');
          if (message.payload?.text) {
            handleQuickAction('explain', message.payload.text);
          }
          break;

        case 'AGENT_STATUS_UPDATE':
          setAgentStatus(message.payload);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // ──────────────────────────────────────────────────────────
  // KEYBOARD SHORTCUTS
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + K
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [isOpen]);

  // ──────────────────────────────────────────────────────────
  // CHAT HANDLERS
  // ──────────────────────────────────────────────────────────

  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Detect context
      const context = await chrome.runtime.sendMessage({
        type: 'DETECT_CONTEXT',
      });

      // Get selected code if any
      const selection = window.getSelection()?.toString();
      if (selection) {
        context.selectedCode = selection;
      }

      // Send to AI
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_TO_AI',
        payload: {
          prompt,
          context,
          model: selectedModel,
        },
      });

      // Add AI message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        model: response.model,
        usage: response.usage,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string, text: string) => {
    const prompts: Record<string, string> = {
      explain: `Explain this code:\n\`\`\`\n${text}\n\`\`\``,
      optimize: `Optimize this code:\n\`\`\`\n${text}\n\`\`\``,
      debug: `Help me debug this code:\n\`\`\`\n${text}\n\`\`\``,
      refactor: `Refactor this code:\n\`\`\`\n${text}\n\`\`\``,
      test: `Generate unit tests for:\n\`\`\`\n${text}\n\`\`\``,
    };

    const prompt = prompts[action] || text;
    await handleSendMessage(prompt);
  };

  const handleModelChange = async (model: AIModel) => {
    setSelectedModel(model);
    await chrome.runtime.sendMessage({
      type: 'SWITCH_MODEL',
      payload: { model },
    });
  };

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div className="devassist-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="icon">🤖</span>
          <span className="title">DevAssist</span>
        </div>

        <div className="tabs">
          <button
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={activeTab === 'agent' ? 'active' : ''}
            onClick={() => setActiveTab('agent')}
          >
            Agent
            {agentStatus?.status === 'running' && (
              <span className="badge pulse">●</span>
            )}
          </button>
        </div>

        <button className="close-btn" onClick={() => setIsOpen(false)}>
          ✕
        </button>
      </div>

      {/* Model Selector */}
      <div className="model-selector">
        <label>Model:</label>
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value as AIModel)}
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          <option value="deepseek-coder">DeepSeek Coder</option>
        </select>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {activeTab === 'chat' ? (
          <div className="chat-container">
            {/* Messages */}
            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <p>👋 Hi! I'm DevAssist, your AI coding assistant.</p>
                  <p>Ask me anything about code, debugging, or development!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`message ${message.role}`}>
                    <div className="message-header">
                      <span className="role">
                        {message.role === 'user' ? '👤 You' : '🤖 DevAssist'}
                      </span>
                      {message.model && (
                        <span className="model">{message.model}</span>
                      )}
                    </div>
                    <div className="message-content">
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="message assistant">
                  <div className="message-header">
                    <span className="role">🤖 DevAssist</span>
                  </div>
                  <div className="message-content">
                    <span className="loading">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="input-container">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }
                }}
                placeholder="Ask me anything... (Shift+Enter for new line)"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="agent-container">
            {/* TODO: Implement Agent Monitor UI */}
            <div className="empty-state">
              <p>Agent monitoring coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
