/**
 * Core Nodes
 * Essential workflow building blocks
 */

import type { NodeType } from '@gemini-flow/shared-types';

export const coreNodes: NodeType[] = [
  // HTTP Request Node
  {
    name: 'httpRequest',
    displayName: 'HTTP Request',
    description: 'Make HTTP requests to any URL with full control over headers, body, and authentication',
    icon: '🌐',
    group: ['core', 'action'],
    version: 1,
    defaults: {
      name: 'HTTP Request',
      color: '#0088cc',
    },
    inputs: [{ type: 'main', displayName: 'Input' }],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'PATCH', value: 'PATCH' },
          { name: 'DELETE', value: 'DELETE' },
        ],
        default: 'GET',
        required: true,
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'https://api.example.com/endpoint',
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'json',
        default: '{}',
        description: 'Request headers as JSON object',
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'json',
        default: '',
        description: 'Request body (for POST, PUT, PATCH)',
        displayOptions: {
          show: {
            method: ['POST', 'PUT', 'PATCH'],
          },
        },
      },
      {
        displayName: 'Timeout',
        name: 'timeout',
        type: 'number',
        default: 30000,
        description: 'Request timeout in milliseconds',
      },
    ],
  },

  // Code Node
  {
    name: 'code',
    displayName: 'Code',
    description: 'Execute custom JavaScript code to transform or process data',
    icon: '💻',
    group: ['core', 'transform'],
    version: 1,
    defaults: {
      name: 'Code',
      color: '#ff6600',
    },
    inputs: [{ type: 'main', displayName: 'Input' }],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [
      {
        displayName: 'JavaScript Code',
        name: 'code',
        type: 'string',
        default: '// Process items\nreturn items.map(item => ({\n  ...item,\n  processed: true\n}));',
        required: true,
        description: 'JavaScript code to execute. Return the modified items.',
      },
    ],
  },

  // Set Node
  {
    name: 'set',
    displayName: 'Set',
    description: 'Manually set data values',
    icon: '📝',
    group: ['core', 'transform'],
    version: 1,
    defaults: {
      name: 'Set',
      color: '#00bb88',
    },
    inputs: [{ type: 'main', displayName: 'Input', required: false }],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [
      {
        displayName: 'Values',
        name: 'values',
        type: 'json',
        default: '{"key": "value"}',
        required: true,
        description: 'Key-value pairs to set',
      },
    ],
  },

  // IF Node
  {
    name: 'if',
    displayName: 'IF',
    description: 'Conditional branching based on data values',
    icon: '🔀',
    group: ['core', 'transform'],
    version: 1,
    defaults: {
      name: 'IF',
      color: '#aa00aa',
    },
    inputs: [{ type: 'main', displayName: 'Input' }],
    outputs: [
      { type: 'main', displayName: 'True' },
      { type: 'main', displayName: 'False' },
    ],
    properties: [
      {
        displayName: 'Condition',
        name: 'condition',
        type: 'string',
        default: '',
        required: true,
        description: 'Condition to evaluate (JavaScript expression)',
        placeholder: 'item.value > 100',
      },
    ],
  },

  // Merge Node
  {
    name: 'merge',
    displayName: 'Merge',
    description: 'Combine data from multiple input streams',
    icon: '🔗',
    group: ['core', 'transform'],
    version: 1,
    defaults: {
      name: 'Merge',
      color: '#00aaff',
    },
    inputs: [
      { type: 'main', displayName: 'Input 1' },
      { type: 'main', displayName: 'Input 2' },
    ],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        options: [
          { name: 'Append', value: 'append' },
          { name: 'Merge by Key', value: 'merge' },
        ],
        default: 'append',
      },
    ],
  },
];
