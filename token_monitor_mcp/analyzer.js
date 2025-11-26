/**
 * Token Analyzer - Waste detection and optimization suggestions
 */

const fs = require('fs');
const path = require('path');

class TokenAnalyzer {
  constructor(monitor, config) {
    this.monitor = monitor;
    this.config = config;
  }

  analyzeWaste(period = 'current_session') {
    let logs = [];

    if (period === 'current_session') {
      logs = this.monitor.currentSession.logs;
    } else {
      // Query database for specified period
      const dateFilter = this.getPeriodDateFilter(period);
      logs = this.monitor.db.prepare(`
        SELECT * FROM token_logs
        WHERE timestamp >= ?
        ORDER BY timestamp DESC
      `).all(dateFilter);
    }

    const wasteEvents = logs.filter(log => log.waste_detected || log.waste);
    const totalWaste = wasteEvents.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.cost_usd || 0), 0);
    const wasteCost = wasteEvents.reduce((sum, log) => sum + (log.cost_usd || 0), 0);

    // Group by waste type
    const wasteByType = {};
    wasteEvents.forEach(event => {
      const reason = event.waste?.reason || event.waste_reason || 'Unknown';
      if (!wasteByType[reason]) {
        wasteByType[reason] = { count: 0, tokens: 0, cost: 0 };
      }
      wasteByType[reason].count++;
      wasteByType[reason].tokens += event.total_tokens || 0;
      wasteByType[reason].cost += event.cost_usd || 0;
    });

    // Top wasteful tools
    const toolStats = {};
    logs.forEach(log => {
      const tool = log.tool_name || 'unknown';
      if (!toolStats[tool]) {
        toolStats[tool] = { count: 0, tokens: 0, cost: 0, waste_count: 0 };
      }
      toolStats[tool].count++;
      toolStats[tool].tokens += log.total_tokens || 0;
      toolStats[tool].cost += log.cost_usd || 0;
      if (log.waste_detected || log.waste) {
        toolStats[tool].waste_count++;
      }
    });

    const topWastefulTools = Object.entries(toolStats)
      .sort((a, b) => b[1].waste_count - a[1].waste_count)
      .slice(0, 5)
      .map(([tool, stats]) => ({
        tool,
        ...stats,
        waste_rate: ((stats.waste_count / stats.count) * 100).toFixed(1) + '%',
      }));

    return {
      period,
      summary: {
        total_requests: logs.length,
        waste_events: wasteEvents.length,
        waste_rate: ((wasteEvents.length / logs.length) * 100).toFixed(1) + '%',
        total_tokens: logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0),
        wasted_tokens: totalWaste,
        waste_percent: ((totalWaste / logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0)) * 100).toFixed(1) + '%',
        total_cost: parseFloat(totalCost.toFixed(4)),
        wasted_cost: parseFloat(wasteCost.toFixed(4)),
      },
      waste_by_type: Object.entries(wasteByType).map(([type, stats]) => ({
        type,
        ...stats,
        cost: parseFloat(stats.cost.toFixed(4)),
      })),
      top_wasteful_tools: topWastefulTools,
      recent_waste_events: wasteEvents.slice(0, 10).map(event => ({
        timestamp: event.timestamp,
        tool: event.tool_name,
        tokens: event.total_tokens,
        reason: event.waste?.reason || event.waste_reason,
        severity: event.waste?.severity || event.waste_severity,
      })),
    };
  }

  getDailyReport(date) {
    const stats = this.monitor.getDailyStats(date);
    
    // Get tool breakdown
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const toolBreakdown = this.monitor.db.prepare(`
      SELECT 
        tool_name,
        COUNT(*) as count,
        SUM(total_tokens) as tokens,
        SUM(cost_usd) as cost
      FROM token_logs
      WHERE timestamp >= ? AND timestamp <= ?
      GROUP BY tool_name
      ORDER BY tokens DESC
    `).all(startOfDay, endOfDay);

    // Get hourly distribution
    const hourlyDist = this.monitor.db.prepare(`
      SELECT 
        strftime('%H', timestamp) as hour,
        SUM(total_tokens) as tokens,
        COUNT(*) as requests
      FROM token_logs
      WHERE timestamp >= ? AND timestamp <= ?
      GROUP BY hour
      ORDER BY hour
    `).all(startOfDay, endOfDay);

    return {
      date,
      summary: stats,
      breakdown_by_tool: toolBreakdown.map(t => ({
        tool: t.tool_name || 'unknown',
        requests: t.count,
        tokens: t.tokens,
        cost: parseFloat((t.cost || 0).toFixed(4)),
        percent: ((t.tokens / stats.total_tokens) * 100).toFixed(1) + '%',
      })),
      hourly_distribution: hourlyDist.map(h => ({
        hour: h.hour + ':00',
        tokens: h.tokens,
        requests: h.requests,
      })),
    };
  }

  getOptimizationTips() {
    const sessionLogs = this.monitor.currentSession.logs;
    const tips = {
      critical: [],
      warnings: [],
      suggestions: [],
    };

    // Analyze patterns
    const toolCounts = {};
    const largOutputs = [];
    const recentDuplicates = new Map();

    sessionLogs.forEach(log => {
      const tool = log.tool_name || 'unknown';
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;

      if (log.output_tokens > 8000) {
        largeOutputs.push({ tool, tokens: log.output_tokens, timestamp: log.timestamp });
      }

      // Check for duplicates
      const key = `${tool}:${log.context}`;
      const lastSeen = recentDuplicates.get(key);
      if (lastSeen) {
        const timeDiff = new Date(log.timestamp) - new Date(lastSeen);
        if (timeDiff < 300000) { // 5 minutes
          tips.warnings.push(`Duplicate ${tool} call within 5 minutes`);
        }
      }
      recentDuplicates.set(key, log.timestamp);
    });

    // Critical: read_file in loops
    if (toolCounts['read_file'] > 5) {
      tips.critical.push(
        `⛔ read_file called ${toolCounts['read_file']} times. Consider using file_search first, then batch reads.`
      );
    }

    // Critical: Large outputs
    if (largeOutputs.length > 0) {
      tips.critical.push(
        `⛔ ${largeOutputs.length} requests with output > 8K tokens. Likely truncated. Use limit parameters.`
      );
    }

    // Warnings: semantic_search without constraints
    if (toolCounts['semantic_search'] > 3) {
      tips.warnings.push(
        `⚠️ semantic_search called ${toolCounts['semantic_search']} times. Use maxResults to limit output.`
      );
    }

    // Warnings: No file_search before read_file
    const hasFileSearch = toolCounts['file_search'] > 0;
    const hasReadFile = toolCounts['read_file'] > 0;
    if (hasReadFile && !hasFileSearch) {
      tips.warnings.push(
        `⚠️ Using read_file without file_search. Search first to locate files efficiently.`
      );
    }

    // Suggestions
    tips.suggestions = [
      `💡 Batch independent tool calls in parallel to reduce total time`,
      `💡 Use grep_search for quick file overviews instead of full read_file`,
      `💡 Set maxResults on search operations to limit output tokens`,
      `💡 Cache frequently accessed data to avoid repeated queries`,
      `💡 Use offset/limit for large files instead of reading entire content`,
    ];

    // Calculate potential savings
    const wasteAnalysis = this.analyzeWaste('current_session');
    const potentialSavings = {
      tokens: wasteAnalysis.summary.wasted_tokens,
      cost: wasteAnalysis.summary.wasted_cost,
      percent: wasteAnalysis.summary.waste_percent,
    };

    return {
      tips,
      potential_savings: potentialSavings,
      analyzed_requests: sessionLogs.length,
      timestamp: new Date().toISOString(),
    };
  }

  exportAnalysis(format, period) {
    const analysis = {
      generated_at: new Date().toISOString(),
      period,
      waste_analysis: this.analyzeWaste(period),
      optimization_tips: this.getOptimizationTips(),
    };

    const filename = `analysis_${period}_${Date.now()}.${format}`;
    const filepath = path.join(__dirname, 'analysis', filename);

    if (format === 'json') {
      fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));
    } else if (format === 'csv') {
      // Simple CSV export
      const csv = this.convertToCSV(analysis);
      fs.writeFileSync(filepath, csv);
    } else if (format === 'html') {
      const html = this.convertToHTML(analysis);
      fs.writeFileSync(filepath, html);
    }

    return filepath;
  }

  convertToCSV(analysis) {
    const headers = 'Timestamp,Tool,Input Tokens,Output Tokens,Total,Cost,Waste,Reason\n';
    const rows = this.monitor.currentSession.logs.map(log => {
      return [
        log.timestamp,
        log.tool_name,
        log.input_tokens,
        log.output_tokens,
        log.total_tokens,
        log.cost_usd,
        log.waste ? 'Yes' : 'No',
        log.waste?.reason || '',
      ].join(',');
    }).join('\n');

    return headers + rows;
  }

  convertToHTML(analysis) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Token Analysis Report</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
    .critical { color: #d32f2f; }
    .warning { color: #f57c00; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #2196F3; color: white; }
  </style>
</head>
<body>
  <h1>🔍 Token Consumption Analysis</h1>
  <p>Generated: ${analysis.generated_at}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Requests: ${analysis.waste_analysis.summary.total_requests}</p>
    <p>Waste Events: ${analysis.waste_analysis.summary.waste_events}</p>
    <p>Wasted Tokens: ${analysis.waste_analysis.summary.wasted_tokens}</p>
    <p>Wasted Cost: $${analysis.waste_analysis.summary.wasted_cost}</p>
  </div>

  <h2>Optimization Tips</h2>
  <div class="critical">
    ${analysis.optimization_tips.tips.critical.map(tip => `<p>${tip}</p>`).join('')}
  </div>
  <div class="warning">
    ${analysis.optimization_tips.tips.warnings.map(tip => `<p>${tip}</p>`).join('')}
  </div>

  <h2>Top Wasteful Tools</h2>
  <table>
    <tr>
      <th>Tool</th>
      <th>Requests</th>
      <th>Waste Events</th>
      <th>Waste Rate</th>
      <th>Tokens</th>
      <th>Cost</th>
    </tr>
    ${analysis.waste_analysis.top_wasteful_tools.map(tool => `
      <tr>
        <td>${tool.tool}</td>
        <td>${tool.count}</td>
        <td>${tool.waste_count}</td>
        <td>${tool.waste_rate}</td>
        <td>${tool.tokens}</td>
        <td>$${tool.cost.toFixed(4)}</td>
      </tr>
    `).join('')}
  </table>
</body>
</html>
    `.trim();
  }

  getPeriodDateFilter(period) {
    const now = new Date();
    
    if (period === 'today') {
      return now.toISOString().split('T')[0] + 'T00:00:00';
    } else if (period === 'last_7_days') {
      const date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date.toISOString();
    } else if (period === 'last_30_days') {
      const date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date.toISOString();
    }
    
    return '1970-01-01T00:00:00';
  }
}

module.exports = { TokenAnalyzer };
