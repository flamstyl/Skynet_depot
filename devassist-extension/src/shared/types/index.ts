/**
 * Shared TypeScript types for DevAssist Extension
 */

// ============================================================================
// MESSAGES (inter-component communication)
// ============================================================================

export type MessageType =
  // Chat & AI
  | 'SEND_TO_AI'
  | 'SWITCH_MODEL'
  // Agentic mode
  | 'START_AGENT'
  | 'STOP_AGENT'
  | 'GET_AGENT_STATUS'
  | 'AGENT_STATUS_UPDATE'
  // Context
  | 'DETECT_CONTEXT'
  // UI
  | 'TOGGLE_SIDEBAR'
  | 'QUICK_EXPLAIN'
  | 'EXPLAIN_SELECTION'
  // GitHub
  | 'ANALYZE_PR';

export interface Message {
  type: MessageType;
  payload?: any;
}

// ============================================================================
// CHAT
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface Conversation {
  id: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// AI MODELS
// ============================================================================

export type AIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-5-sonnet'
  | 'claude-3-7-sonnet'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro'
  | 'deepseek-coder'
  | 'deepseek-chat';

export interface ModelInfo {
  id: AIModel;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  description: string;
  contextWindow: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  bestFor: string[];
}

// ============================================================================
// CONTEXT
// ============================================================================

export interface UserContext {
  url?: string;
  platform?: 'github' | 'stackoverflow' | 'documentation' | 'other';
  repository?: string;
  prNumber?: number;
  issueNumber?: number;
  questionId?: number;
  selectedCode?: string;
  language?: string;
  framework?: string;
}

// ============================================================================
// AGENTS
// ============================================================================

export type AgentType =
  | 'pr_reviewer'
  | 'bug_investigator'
  | 'doc_navigator'
  | 'code_refactorer'
  | 'test_generator'
  | 'custom';

export type AgentStatus =
  | 'planning'
  | 'running'
  | 'completed'
  | 'failed'
  | 'stopped';

export interface AgentTask {
  id: string;
  type: AgentType;
  config: Record<string, any>;
  userId?: string;
}

export interface AgentState {
  id: string;
  taskId: string;
  status: AgentStatus;
  plan?: {
    steps: StepPlan[];
  };
  steps: Step[];
  data?: Record<string, any>;
  result?: any;
  error?: string;
  context: UserContext;
  startedAt: number;
  completedAt?: number;
  userId?: string;
}

export interface StepPlan {
  name: string;
  tool: string;
  params: Record<string, any>;
  reasoning: string;
  retryable: boolean;
}

export interface Step {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tool?: string;
  input?: any;
  output?: any;
  error?: string;
  reasoning?: string;
  startedAt?: number;
  completedAt?: number;
  retries?: number;
}

// ============================================================================
// TASK BUILDER
// ============================================================================

export type BlockType = 'trigger' | 'action' | 'condition' | 'transform' | 'output';

export interface Block {
  id: string;
  type: BlockType;
  config: Record<string, any>;
  next?: string; // ID of next block
}

export interface Task {
  id: string;
  name: string;
  blocks: Block[];
  startBlock: string;
  trigger: {
    type: 'manual' | 'schedule' | 'event' | 'url_pattern';
    config: Record<string, any>;
  };
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// USER & SETTINGS
// ============================================================================

export type UserTier = 'free' | 'pro' | 'unlimited' | 'team' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  tier: UserTier;
  githubConnected: boolean;
  tokensUsedThisMonth: number;
  createdAt: number;
}

export interface Settings {
  defaultModel: AIModel;
  theme: 'light' | 'dark' | 'auto';
  shortcutEnabled: boolean;
  privacyMode: 'strict' | 'balanced' | 'full';
  version: string;
}

// ============================================================================
// API
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatCompletionRequest {
  prompt: string;
  model: AIModel;
  context?: UserContext;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  content: string;
  model: AIModel;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'error';
}
