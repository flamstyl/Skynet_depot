/**
 * Trigger Nodes
 * Workflow activation triggers
 */

import type { NodeType } from '@gemini-flow/shared-types';

export const triggerNodes: NodeType[] = [
  // Webhook Trigger
  {
    name: 'webhook',
    displayName: 'Webhook',
    description: 'Receive HTTP requests via a unique webhook URL',
    icon: '📨',
    group: ['trigger'],
    version: 1,
    defaults: {
      name: 'Webhook',
      color: '#00cc00',
    },
    inputs: [],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'my-webhook',
        description: 'Webhook path (appended to base URL)',
      },
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
        default: 'POST',
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        path: '={{$parameter["path"]}}',
        responseMode: 'lastNode',
      },
    ],
  },

  // Schedule Trigger
  {
    name: 'schedule',
    displayName: 'Schedule',
    description: 'Run workflows on a schedule (cron-based)',
    icon: '⏰',
    group: ['trigger'],
    version: 1,
    defaults: {
      name: 'Schedule',
      color: '#ff9900',
    },
    inputs: [],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [
      {
        displayName: 'Trigger Interval',
        name: 'interval',
        type: 'options',
        options: [
          { name: 'Every Minute', value: '* * * * *' },
          { name: 'Every 5 Minutes', value: '*/5 * * * *' },
          { name: 'Every Hour', value: '0 * * * *' },
          { name: 'Every Day', value: '0 0 * * *' },
          { name: 'Custom (Cron)', value: 'custom' },
        ],
        default: '0 * * * *',
      },
      {
        displayName: 'Cron Expression',
        name: 'cronExpression',
        type: 'string',
        default: '0 * * * *',
        displayOptions: {
          show: {
            interval: ['custom'],
          },
        },
        placeholder: '0 9 * * 1-5',
        description: 'Custom cron expression',
      },
    ],
  },

  // Manual Trigger
  {
    name: 'manual',
    displayName: 'Manual Trigger',
    description: 'Manually start workflow execution',
    icon: '▶️',
    group: ['trigger'],
    version: 1,
    defaults: {
      name: 'Manual Trigger',
      color: '#666666',
    },
    inputs: [],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [],
  },
];
