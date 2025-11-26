/**
 * Token Monitor - Core tracking logic
 */

const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class TokenMonitor {
  constructor(config) {
    this.config = config;
    this.currentSession = {
      id: uuidv4(),
      start_time: new Date().toISOString(),
      logs: [],
      total_tokens: 0,
      total_input: 0,
      total_output: 0,
      total_cost: 0,
      request_count: 0,
    };

    // Initialize database
    this.initDatabase();
  }

  initDatabase() {
    const dbPath = path.resolve(this.config.database);
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS token_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        session_id TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        model TEXT NOT NULL,
        tool_name TEXT,
        context TEXT,
        cost_usd REAL NOT NULL,
        waste_detected BOOLEAN DEFAULT 0,
        waste_reason TEXT,
        waste_severity TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT,
        total_tokens INTEGER DEFAULT 0,
        total_cost REAL DEFAULT 0,
        request_count INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON token_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_session ON token_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_tool ON token_logs(tool_name);
    `);

    // Insert current session
    this.db.prepare(`
      INSERT OR IGNORE INTO sessions (id, start_time)
      VALUES (?, ?)
    `).run(this.currentSession.id, this.currentSession.start_time);
  }

  calculateCost(inputTokens, outputTokens, model) {
    const pricing = this.config.pricing[model] || this.config.pricing['claude-sonnet-4.5'];
    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;
    return inputCost + outputCost;
  }

  detectWaste(inputTokens, outputTokens, toolName, context) {
    const waste = {
      detected: false,
      reason: null,
      severity: null,
    };

    const totalTokens = inputTokens + outputTokens;

    // Critical: Single request > 50K tokens
    if (totalTokens > this.config.waste_detection.large_request_threshold) {
      waste.detected = true;
      waste.reason = `Large request: ${totalTokens} tokens in single call`;
      waste.severity = 'critical';
    }

    // Critical: Output > 10K tokens (often truncated)
    else if (outputTokens > this.config.waste_detection.large_output_threshold) {
      waste.detected = true;
      waste.reason = `Large output: ${outputTokens} tokens (likely truncated)`;
      waste.severity = 'critical';
    }

    // Warning: read_file in quick succession
    else if (toolName === 'read_file') {
      const recentReadFiles = this.currentSession.logs
        .filter(log => log.tool_name === 'read_file')
        .filter(log => {
          const logTime = new Date(log.timestamp);
          const now = new Date();
          return (now - logTime) < 60000; // Last minute
        });

      if (recentReadFiles.length >= 5) {
        waste.detected = true;
        waste.reason = `read_file called ${recentReadFiles.length} times in 1 minute`;
        waste.severity = 'warning';
      }
    }

    // Warning: Repeated semantic_search with large results
    else if (toolName === 'semantic_search' && outputTokens > 5000) {
      waste.detected = true;
      waste.reason = `semantic_search returned ${outputTokens} output tokens`;
      waste.severity = 'warning';
    }

    return waste;
  }

  logUsage(inputTokens, outputTokens, model, toolName, context) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const totalTokens = inputTokens + outputTokens;
    const cost = this.calculateCost(inputTokens, outputTokens, model);
    const waste = this.detectWaste(inputTokens, outputTokens, toolName, context);

    // Insert into database
    this.db.prepare(`
      INSERT INTO token_logs (
        id, timestamp, session_id, input_tokens, output_tokens, 
        total_tokens, model, tool_name, context, cost_usd,
        waste_detected, waste_reason, waste_severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, timestamp, this.currentSession.id, inputTokens, outputTokens,
      totalTokens, model, toolName, context, cost,
      waste.detected ? 1 : 0, waste.reason, waste.severity
    );

    // Update session totals
    this.currentSession.total_tokens += totalTokens;
    this.currentSession.total_input += inputTokens;
    this.currentSession.total_output += outputTokens;
    this.currentSession.total_cost += cost;
    this.currentSession.request_count++;

    this.db.prepare(`
      UPDATE sessions 
      SET total_tokens = ?, total_cost = ?, request_count = ?
      WHERE id = ?
    `).run(
      this.currentSession.total_tokens,
      this.currentSession.total_cost,
      this.currentSession.request_count,
      this.currentSession.id
    );

    // Add to in-memory logs
    const logEntry = {
      id,
      timestamp,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      model,
      tool_name: toolName,
      context,
      cost_usd: cost,
      waste: waste.detected ? waste : null,
    };

    this.currentSession.logs.push(logEntry);

    // Export to JSON log file
    this.exportToJsonLog(logEntry);

    // Check budget alerts
    this.checkBudgetAlerts();

    return {
      logged: true,
      log_id: id,
      tokens: totalTokens,
      cost: cost.toFixed(6),
      waste_detected: waste.detected,
      waste_severity: waste.severity,
      session_total: this.currentSession.total_tokens,
      session_cost: this.currentSession.total_cost.toFixed(4),
    };
  }

  exportToJsonLog(logEntry) {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.config.auto_logging.log_directory, `tokens_${date}.json`);
    
    let logs = [];
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  }

  checkBudgetAlerts() {
    const { daily_limit_tokens, daily_limit_usd, alert_threshold_percent } = this.config.budgets;
    
    const today = new Date().toISOString().split('T')[0];
    const todayStats = this.getDailyStats(today);

    const tokenPercent = (todayStats.total_tokens / daily_limit_tokens) * 100;
    const costPercent = (todayStats.total_cost / daily_limit_usd) * 100;

    if (tokenPercent >= alert_threshold_percent || costPercent >= alert_threshold_percent) {
      const alert = {
        type: 'budget_alert',
        timestamp: new Date().toISOString(),
        token_usage: `${tokenPercent.toFixed(1)}%`,
        cost_usage: `${costPercent.toFixed(1)}%`,
        message: `⚠️ Budget Alert: ${Math.max(tokenPercent, costPercent).toFixed(1)}% of daily limit reached`,
      };

      console.warn(JSON.stringify(alert, null, 2));
      
      // Log alert
      const alertFile = path.join(this.config.auto_logging.log_directory, 'alerts.json');
      let alerts = [];
      if (fs.existsSync(alertFile)) {
        alerts = JSON.parse(fs.readFileSync(alertFile, 'utf-8'));
      }
      alerts.push(alert);
      fs.writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
    }
  }

  getSessionStats() {
    const avgTokens = this.currentSession.request_count > 0
      ? Math.round(this.currentSession.total_tokens / this.currentSession.request_count)
      : 0;

    const wasteCount = this.currentSession.logs.filter(log => log.waste).length;

    return {
      session_id: this.currentSession.id,
      start_time: this.currentSession.start_time,
      duration_minutes: Math.round((new Date() - new Date(this.currentSession.start_time)) / 60000),
      total_tokens: this.currentSession.total_tokens,
      total_input: this.currentSession.total_input,
      total_output: this.currentSession.total_output,
      total_cost: parseFloat(this.currentSession.total_cost.toFixed(4)),
      request_count: this.currentSession.request_count,
      avg_tokens_per_request: avgTokens,
      waste_events: wasteCount,
    };
  }

  getDailyStats(date) {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const result = this.db.prepare(`
      SELECT 
        COUNT(*) as request_count,
        SUM(total_tokens) as total_tokens,
        SUM(input_tokens) as total_input,
        SUM(output_tokens) as total_output,
        SUM(cost_usd) as total_cost,
        SUM(CASE WHEN waste_detected = 1 THEN 1 ELSE 0 END) as waste_count
      FROM token_logs
      WHERE timestamp >= ? AND timestamp <= ?
    `).get(startOfDay, endOfDay);

    return {
      date,
      request_count: result.request_count || 0,
      total_tokens: result.total_tokens || 0,
      total_input: result.total_input || 0,
      total_output: result.total_output || 0,
      total_cost: parseFloat((result.total_cost || 0).toFixed(4)),
      waste_count: result.waste_count || 0,
    };
  }

  resetSession() {
    // End current session
    this.db.prepare(`
      UPDATE sessions SET end_time = ? WHERE id = ?
    `).run(new Date().toISOString(), this.currentSession.id);

    // Start new session
    this.currentSession = {
      id: uuidv4(),
      start_time: new Date().toISOString(),
      logs: [],
      total_tokens: 0,
      total_input: 0,
      total_output: 0,
      total_cost: 0,
      request_count: 0,
    };

    this.db.prepare(`
      INSERT INTO sessions (id, start_time)
      VALUES (?, ?)
    `).run(this.currentSession.id, this.currentSession.start_time);
  }
}

module.exports = { TokenMonitor };
