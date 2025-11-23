/**
 * Action Nodes
 * External service integrations
 */

import type { NodeType } from '@gemini-flow/shared-types';

export const actionNodes: NodeType[] = [
  // Email Node
  {
    name: 'email',
    displayName: 'Send Email',
    description: 'Send emails via SMTP',
    icon: '📧',
    group: ['action', 'communication'],
    version: 1,
    defaults: {
      name: 'Send Email',
      color: '#dd4444',
    },
    inputs: [{ type: 'main', displayName: 'Input' }],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'user@example.com',
      },
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        default: '',
        required: true,
      },
    ],
  },

  // Slack Node
  {
    name: 'slack',
    displayName: 'Slack',
    description: 'Send messages to Slack channels',
    icon: '💬',
    group: ['action', 'communication'],
    version: 1,
    defaults: {
      name: 'Slack',
      color: '#4a154b',
    },
    inputs: [{ type: 'main', displayName: 'Input' }],
    outputs: [{ type: 'main', displayName: 'Output' }],
    credentials: [{ name: 'slackApi', required: true }],
    properties: [
      {
        displayName: 'Channel',
        name: 'channel',
        type: 'string',
        default: '',
        required: true,
        placeholder: '#general',
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: '',
        required: true,
      },
    ],
  },

  // Discord Node
  {
    name: 'discord',
    displayName: 'Discord',
    description: 'Send messages to Discord channels',
    icon: '🎮',
    group: ['action', 'communication'],
    version: 1,
    defaults: {
      name: 'Discord',
      color: '#5865f2',
    },
    inputs: [{ type: 'main', displayName: 'Input' }],
    outputs: [{ type: 'main', displayName: 'Output' }],
    properties: [
      {
        displayName: 'Webhook URL',
        name: 'webhookUrl',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: '',
        required: true,
      },
    ],
  },

  // GitHub Node
  {
    name: 'github',
    displayName: 'GitHub',
    description: 'Interact with GitHub repositories',
    icon: '🐙',
    group: ['action', 'productivity'],
    version: 1,
    defaults: {
      name: 'GitHub',
      color: '#000000',
    },
    inputs: [{ type: 'main', displayName: 'Input' }],
    outputs: [{ type: 'main', displayName: 'Output' }],
    credentials: [{ name: 'githubApi', required: true }],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Create Issue', value: 'createIssue' },
          { name: 'Create PR', value: 'createPR' },
          { name: 'Get Repository', value: 'getRepo' },
        ],
        default: 'createIssue',
      },
      {
        displayName: 'Repository',
        name: 'repository',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'owner/repo',
      },
    ],
  },
];
