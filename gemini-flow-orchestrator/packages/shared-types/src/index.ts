/**
 * Gemini Flow Orchestrator - Shared Types
 * Based on n8n architecture with Gemini AI integration
 */

// ============================================================================
// Core Workflow Types
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  settings: WorkflowSettings;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
  credentials?: Record<string, string>;
  disabled?: boolean;
  notes?: string;
}

export interface NodeConnection {
  source: string;
  sourceOutput: string;
  target: string;
  targetInput: string;
}

export interface WorkflowSettings {
  errorWorkflow?: string;
  timezone?: string;
  saveExecutionProgress?: boolean;
  saveManualExecutions?: boolean;
  saveDataSuccessExecution?: 'all' | 'none';
  saveDataErrorExecution?: 'all' | 'none';
  executionTimeout?: number;
  maxExecutionTimeout?: number;
}

// ============================================================================
// Execution Types
// ============================================================================

export type ExecutionStatus = 'running' | 'success' | 'error' | 'waiting' | 'cancelled';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry';
  startedAt: Date;
  stoppedAt?: Date;
  error?: ExecutionError;
  data: ExecutionData;
}

export interface ExecutionData {
  resultData: {
    runData: Record<string, NodeRunData[]>;
    lastNodeExecuted?: string;
  };
  executionData?: {
    contextData: Record<string, any>;
    nodeExecutionStack: any[];
    waitingExecution: Record<string, any>;
  };
}

export interface NodeRunData {
  startTime: number;
  executionTime: number;
  source: any[];
  data?: {
    main?: any[][];
  };
  error?: ExecutionError;
}

export interface ExecutionError {
  message: string;
  stack?: string;
  node?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// ============================================================================
// Node Registry Types
// ============================================================================

export interface NodeType {
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  group: NodeGroup[];
  version: number;
  defaults: {
    name: string;
    color: string;
  };
  inputs: NodeInput[];
  outputs: NodeOutput[];
  credentials?: CredentialType[];
  properties: NodeProperty[];
  webhooks?: WebhookDescription[];
}

export type NodeGroup =
  | 'trigger'
  | 'action'
  | 'transform'
  | 'core'
  | 'ai'
  | 'communication'
  | 'database'
  | 'file'
  | 'productivity'
  | 'custom';

export interface NodeInput {
  type: 'main';
  displayName: string;
  required?: boolean;
}

export interface NodeOutput {
  type: 'main';
  displayName: string;
}

export interface NodeProperty {
  displayName: string;
  name: string;
  type: PropertyType;
  default: any;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: any }>;
  placeholder?: string;
  typeOptions?: Record<string, any>;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
}

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'collection'
  | 'fixedCollection'
  | 'options'
  | 'multiOptions'
  | 'json'
  | 'dateTime'
  | 'color'
  | 'hidden';

export interface CredentialType {
  name: string;
  required?: boolean;
}

export interface WebhookDescription {
  name: string;
  httpMethod: string;
  path: string;
  responseMode: 'onReceived' | 'lastNode';
}

// ============================================================================
// Credentials Types
// ============================================================================

export interface Credential {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>; // Encrypted
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialTypeDefinition {
  name: string;
  displayName: string;
  properties: NodeProperty[];
  documentationUrl?: string;
  authenticate?: {
    type: 'generic';
    properties: Record<string, any>;
  };
  test?: {
    request: {
      method: string;
      url: string;
    };
  };
}

// ============================================================================
// Gemini AI Integration Types
// ============================================================================

export interface GeminiWorkflowPlan {
  description: string;
  nodes: GeminiNodePlan[];
  connections: GeminiConnectionPlan[];
  reasoning: string;
  confidence: number;
}

export interface GeminiNodePlan {
  nodeType: string;
  name: string;
  parameters: Record<string, any>;
  position?: { x: number; y: number };
  credentials?: string[];
  notes?: string;
}

export interface GeminiConnectionPlan {
  from: string; // node name
  to: string;   // node name
  output?: string;
  input?: string;
}

export interface GeminiAnalysisResult {
  success: boolean;
  issues?: GeminiIssue[];
  suggestions?: GeminiSuggestion[];
  autoFixAvailable?: boolean;
  reasoning: string;
}

export interface GeminiIssue {
  severity: 'critical' | 'warning' | 'info';
  node?: string;
  message: string;
  suggestedFix?: any;
}

export interface GeminiSuggestion {
  type: 'optimization' | 'security' | 'best-practice';
  description: string;
  implementation?: any;
}

export interface GeminiPatch {
  nodes?: {
    add?: WorkflowNode[];
    update?: Partial<WorkflowNode>[];
    remove?: string[];
  };
  connections?: {
    add?: NodeConnection[];
    remove?: NodeConnection[];
  };
  reasoning: string;
}

// ============================================================================
// MCP Protocol Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// ============================================================================
// Internet Tools Types
// ============================================================================

export interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  followRedirects?: boolean;
  validateSSL?: boolean;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'apiKey';
    credentials?: any;
  };
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  executionTime: number;
}

export interface ScrapeConfig {
  url: string;
  selector?: string;
  extractionRules?: Record<string, string>;
  waitForSelector?: string;
  timeout?: number;
  javascript?: boolean;
}

export interface ScrapeResult {
  data: any;
  metadata: {
    url: string;
    timestamp: Date;
    duration: number;
  };
}

// ============================================================================
// Security Types
// ============================================================================

export interface EncryptedData {
  iv: string;
  encryptedData: string;
  authTag: string;
  salt: string;
}

export interface SSRFValidationResult {
  allowed: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

export interface SecurityConfig {
  allowedDomains?: string[];
  blockedDomains?: string[];
  allowPrivateIPs?: boolean;
  allowLoopback?: boolean;
  maxRedirects?: number;
  timeout?: number;
}

// ============================================================================
// API Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Event Types
// ============================================================================

export type EventType =
  | 'workflow.created'
  | 'workflow.updated'
  | 'workflow.deleted'
  | 'workflow.activated'
  | 'workflow.deactivated'
  | 'execution.started'
  | 'execution.finished'
  | 'execution.error'
  | 'node.executed';

export interface WorkflowEvent {
  type: EventType;
  timestamp: Date;
  workflowId: string;
  executionId?: string;
  nodeId?: string;
  data?: any;
}
