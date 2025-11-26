/**
 * Token Monitor MCP Server
 * Real-time token consumption tracking with waste detection
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const express = require('express');
const path = require('path');
const fs = require('fs');
const { TokenMonitor } = require('./monitor');
const { TokenAnalyzer } = require('./analyzer');
const config = require('./config.json');

// Initialize Express for HTTP API + Dashboard
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dashboard')));

// Initialize monitor and analyzer
const monitor = new TokenMonitor(config);
const analyzer = new TokenAnalyzer(monitor, config);

// Create MCP Server
const server = new Server(
  {
    name: 'token-monitor-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// MCP TOOLS
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'log_token_usage',
        description: 'Log a token consumption event with automatic waste detection',
        inputSchema: {
          type: 'object',
          properties: {
            input_tokens: {
              type: 'number',
              description: 'Number of input tokens consumed',
            },
            output_tokens: {
              type: 'number',
              description: 'Number of output tokens consumed',
            },
            model: {
              type: 'string',
              description: 'Model used (e.g., claude-sonnet-4.5)',
              default: 'claude-sonnet-4.5',
            },
            tool_name: {
              type: 'string',
              description: 'Name of the tool that consumed tokens',
            },
            context: {
              type: 'string',
              description: 'Context or description of the operation',
            },
          },
          required: ['input_tokens', 'output_tokens'],
        },
      },
      {
        name: 'get_current_session_stats',
        description: 'Get token consumption stats for the current session',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_waste_analysis',
        description: 'Analyze token waste and get optimization recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              description: 'Analysis period: current_session, today, last_7_days',
              default: 'current_session',
            },
          },
        },
      },
      {
        name: 'get_daily_report',
        description: 'Get daily consumption report',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format (default: today)',
            },
          },
        },
      },
      {
        name: 'get_optimization_tips',
        description: 'Get AI-powered optimization suggestions based on usage patterns',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'set_budget_alert',
        description: 'Configure budget alert thresholds',
        inputSchema: {
          type: 'object',
          properties: {
            daily_limit_tokens: {
              type: 'number',
              description: 'Daily token limit',
            },
            daily_limit_usd: {
              type: 'number',
              description: 'Daily cost limit in USD',
            },
            alert_threshold_percent: {
              type: 'number',
              description: 'Alert at X% of budget',
              default: 80,
            },
          },
        },
      },
      {
        name: 'export_analysis',
        description: 'Export detailed analysis report',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['json', 'csv', 'html'],
              default: 'json',
            },
            period: {
              type: 'string',
              enum: ['today', 'last_7_days', 'last_30_days', 'all'],
              default: 'today',
            },
          },
        },
      },
      {
        name: 'reset_session',
        description: 'Reset current session and start fresh tracking',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'log_token_usage': {
        const result = monitor.logUsage(
          args.input_tokens,
          args.output_tokens,
          args.model || 'claude-sonnet-4.5',
          args.tool_name || 'unknown',
          args.context || ''
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_current_session_stats': {
        const stats = monitor.getSessionStats();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case 'get_waste_analysis': {
        const period = args.period || 'current_session';
        const analysis = analyzer.analyzeWaste(period);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      case 'get_daily_report': {
        const date = args.date || new Date().toISOString().split('T')[0];
        const report = analyzer.getDailyReport(date);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      }

      case 'get_optimization_tips': {
        const tips = analyzer.getOptimizationTips();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tips, null, 2),
            },
          ],
        };
      }

      case 'set_budget_alert': {
        config.budgets = {
          ...config.budgets,
          ...args,
        };
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        return {
          content: [
            {
              type: 'text',
              text: `Budget alerts updated: ${JSON.stringify(config.budgets, null, 2)}`,
            },
          ],
        };
      }

      case 'export_analysis': {
        const format = args.format || 'json';
        const period = args.period || 'today';
        const exportPath = analyzer.exportAnalysis(format, period);
        return {
          content: [
            {
              type: 'text',
              text: `Analysis exported to: ${exportPath}`,
            },
          ],
        };
      }

      case 'reset_session': {
        monitor.resetSession();
        return {
          content: [
            {
              type: 'text',
              text: 'Session reset. Fresh tracking started.',
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// HTTP API ENDPOINTS
// ============================================================================

app.get('/api/stats', (req, res) => {
  res.json(monitor.getSessionStats());
});

app.get('/api/waste', (req, res) => {
  const period = req.query.period || 'current_session';
  res.json(analyzer.analyzeWaste(period));
});

app.get('/api/report/:date', (req, res) => {
  res.json(analyzer.getDailyReport(req.params.date));
});

app.get('/api/tips', (req, res) => {
  res.json(analyzer.getOptimizationTips());
});

app.post('/api/log', (req, res) => {
  const { input_tokens, output_tokens, model, tool_name, context } = req.body;
  const result = monitor.logUsage(
    input_tokens,
    output_tokens,
    model || 'claude-sonnet-4.5',
    tool_name || 'unknown',
    context || ''
  );
  res.json(result);
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// ============================================================================
// START SERVERS
// ============================================================================

async function main() {
  // Start HTTP server
  const httpPort = config.port || 3003;
  app.listen(httpPort, () => {
    console.log(`✅ Token Monitor HTTP API running on http://localhost:${httpPort}`);
    console.log(`📊 Dashboard: http://localhost:${httpPort}/dashboard`);
  });

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('✅ Token Monitor MCP Server running (stdio mode)');
  console.log('📝 Ready to track token consumption');
}

main().catch(console.error);
