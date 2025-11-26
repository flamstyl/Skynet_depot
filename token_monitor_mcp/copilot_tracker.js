/**
 * Copilot Premium Request Tracker
 * Intégration avec Token Monitor MCP pour tracker les premium requests
 */

const EventEmitter = require('events');

class CopilotRequestTracker extends EventEmitter {
  constructor(monitor, config = {}) {
    super();
    this.monitor = monitor;
    this.config = {
      monthlyLimit: config.monthlyLimit || 300, // Copilot Pro default
      plan: config.plan || 'pro', // 'free', 'pro', 'pro+', 'business', 'enterprise'
      extraCostPerRequest: 0.04,
      resetDay: 1, // 1st of each month
      ...config
    };

    this.premiumRequestCount = 0;
    this.requestsByType = {
      chat: 0,
      agent_mode: 0,
      code_review: 0,
      model_selection: 0,
      web_search: 0
    };

    this.loadMonthlyData();
  }

  /**
   * Charge les données du mois en cours depuis la DB
   */
  async loadMonthlyData() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const requests = await this.monitor.db.getRequestsSince(monthStart);
    this.premiumRequestCount = requests.filter(r => r.is_premium).length;
    
    // Reconstruit breakdown par type
    requests.forEach(req => {
      if (req.request_type && this.requestsByType.hasOwnProperty(req.request_type)) {
        this.requestsByType[req.request_type]++;
      }
    });
  }

  /**
   * Détecte si une opération est une premium request
   */
  detectPremiumRequest(operation) {
    const premiumPatterns = [
      // Copilot Chat
      { pattern: /vscode\.lm\.sendRequest/i, type: 'chat' },
      { pattern: /copilot.*chat/i, type: 'chat' },
      
      // Agent Mode
      { pattern: /agent.*mode/i, type: 'agent_mode' },
      { pattern: /autonomous.*coding/i, type: 'agent_mode' },
      
      // Code Review
      { pattern: /code.*review/i, type: 'code_review' },
      { pattern: /pull.*request.*summary/i, type: 'code_review' },
      
      // Model Selection (premium feature)
      { pattern: /model.*selection/i, type: 'model_selection' },
      { pattern: /(opus|sonnet|claude-4)/i, type: 'model_selection' },
      
      // Web Search
      { pattern: /web.*search/i, type: 'web_search' },
      { pattern: /vscode-websearchforcopilot/i, type: 'web_search' }
    ];

    for (const { pattern, type } of premiumPatterns) {
      if (pattern.test(operation.tool_name || operation.context || '')) {
        return { isPremium: true, type };
      }
    }

    return { isPremium: false, type: null };
  }

  /**
   * Log une premium request
   */
  async trackRequest(operation) {
    const { isPremium, type } = this.detectPremiumRequest(operation);
    
    if (!isPremium) {
      return { tracked: false, reason: 'Not a premium request' };
    }

    this.premiumRequestCount++;
    if (type && this.requestsByType.hasOwnProperty(type)) {
      this.requestsByType[type]++;
    }

    // Log dans Token Monitor
    await this.monitor.logUsage(
      operation.input_tokens || 0,
      operation.output_tokens || 0,
      operation.model || 'copilot-default',
      operation.tool_name || 'copilot_operation',
      `Premium Request ${this.premiumRequestCount}/${this.config.monthlyLimit} (${type})`,
      {
        is_premium: true,
        request_type: type,
        premium_request_number: this.premiumRequestCount
      }
    );

    // Calcul coût projeté
    const projection = this.calculateCostProjection();

    // Alertes
    const alerts = this.checkAlerts(projection);

    // Emit event pour dashboard
    this.emit('premium_request_logged', {
      type,
      count: this.premiumRequestCount,
      limit: this.config.monthlyLimit,
      breakdown: this.requestsByType,
      projection,
      alerts
    });

    return {
      tracked: true,
      type,
      current_count: this.premiumRequestCount,
      remaining: Math.max(0, this.config.monthlyLimit - this.premiumRequestCount),
      projection,
      alerts
    };
  }

  /**
   * Calcule le coût projeté pour le mois
   */
  calculateCostProjection() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const daysInMonth = monthEnd.getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    
    const dailyAverage = this.premiumRequestCount / daysPassed;
    const projectedTotal = Math.ceil(dailyAverage * daysInMonth);
    
    const willExceed = projectedTotal > this.config.monthlyLimit;
    const extraRequests = Math.max(0, projectedTotal - this.config.monthlyLimit);
    const extraCost = extraRequests * this.config.extraCostPerRequest;
    
    return {
      current_count: this.premiumRequestCount,
      days_passed: daysPassed,
      days_remaining: daysRemaining,
      daily_average: dailyAverage.toFixed(2),
      projected_total: projectedTotal,
      monthly_limit: this.config.monthlyLimit,
      will_exceed: willExceed,
      extra_requests: extraRequests,
      extra_cost: extraCost.toFixed(2),
      extra_cost_usd: extraCost
    };
  }

  /**
   * Vérifie les seuils d'alerte
   */
  checkAlerts(projection) {
    const alerts = [];
    const percentUsed = (this.premiumRequestCount / this.config.monthlyLimit) * 100;

    if (percentUsed >= 90) {
      alerts.push({
        level: 'critical',
        message: `🚨 CRITICAL: ${percentUsed.toFixed(1)}% of premium requests used (${this.premiumRequestCount}/${this.config.monthlyLimit})`,
        recommendation: 'Reduce premium request usage immediately or upgrade plan'
      });
    } else if (percentUsed >= 80) {
      alerts.push({
        level: 'warning',
        message: `⚠️ WARNING: ${percentUsed.toFixed(1)}% of premium requests used (${this.premiumRequestCount}/${this.config.monthlyLimit})`,
        recommendation: 'Monitor usage closely or consider upgrading to Pro+ (1,500 requests/month)'
      });
    } else if (percentUsed >= 50) {
      alerts.push({
        level: 'info',
        message: `ℹ️ INFO: ${percentUsed.toFixed(1)}% of premium requests used (${this.premiumRequestCount}/${this.config.monthlyLimit})`,
        recommendation: 'On track for normal usage'
      });
    }

    if (projection.will_exceed) {
      alerts.push({
        level: 'warning',
        message: `💰 Projected to exceed limit by ${projection.extra_requests} requests ($${projection.extra_cost} extra cost)`,
        recommendation: `Consider upgrading to ${this.suggestPlan(projection.projected_total)}`
      });
    }

    // Détection patterns problématiques
    const topType = Object.entries(this.requestsByType).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );

    if (topType[1] > this.premiumRequestCount * 0.6) {
      alerts.push({
        level: 'optimization',
        message: `🔧 ${topType[0]} represents ${((topType[1]/this.premiumRequestCount)*100).toFixed(1)}% of premium requests`,
        recommendation: this.getOptimizationTip(topType[0])
      });
    }

    return alerts;
  }

  /**
   * Suggère le plan optimal selon la consommation
   */
  suggestPlan(projectedRequests) {
    if (projectedRequests <= 50) return 'Free (50 requests/month)';
    if (projectedRequests <= 300) return 'Pro ($10/month, 300 requests)';
    if (projectedRequests <= 1500) return 'Pro+ ($39/month, 1,500 requests)';
    if (projectedRequests <= 300 * 5) return 'Business ($19/user, 300 per user)';
    return 'Enterprise ($39/user, 1,000 per user)';
  }

  /**
   * Tips d'optimisation par type de requête
   */
  getOptimizationTip(requestType) {
    const tips = {
      chat: 'Use inline completions instead of chat when possible. Batch multiple questions into one conversation.',
      agent_mode: 'Agent mode is expensive (5-10 requests per task). Use manual coding for simple tasks.',
      code_review: 'Disable auto-review on every commit. Review only before merging to main branch.',
      model_selection: 'Selecting specific models (Opus, Sonnet) counts as premium. Use default model when possible.',
      web_search: 'Web searches cost extra ($10/1000 searches + tokens). Use local docs or cached results.'
    };
    return tips[requestType] || 'No specific optimization available';
  }

  /**
   * Estime le nombre de premium requests pour une opération future
   */
  estimatePremiumRequests(operation) {
    const { isPremium, type } = this.detectPremiumRequest(operation);
    
    if (!isPremium) {
      return { requests: 0, cost: 0 };
    }

    let estimatedRequests = 1;

    // Agent mode consomme multiple requests
    if (type === 'agent_mode') {
      const taskComplexity = operation.context?.toLowerCase() || '';
      if (taskComplexity.includes('create') || taskComplexity.includes('generate')) {
        estimatedRequests = 5; // Création = ~5 iterations
      } else if (taskComplexity.includes('refactor') || taskComplexity.includes('optimize')) {
        estimatedRequests = 3; // Refactoring = ~3 iterations
      } else {
        estimatedRequests = 2; // Simple task
      }
    }

    const remaining = Math.max(0, this.config.monthlyLimit - this.premiumRequestCount);
    const willExceed = estimatedRequests > remaining;
    const extraRequests = willExceed ? estimatedRequests - remaining : 0;
    const extraCost = extraRequests * this.config.extraCostPerRequest;

    return {
      estimated_requests: estimatedRequests,
      current_count: this.premiumRequestCount,
      remaining,
      will_exceed: willExceed,
      extra_requests: extraRequests,
      extra_cost: extraCost.toFixed(2),
      warning: willExceed ? 
        `⚠️ This operation will use ${estimatedRequests} premium requests and exceed your limit by ${extraRequests} ($${extraCost.toFixed(2)} extra)` :
        `✅ This operation will use ${estimatedRequests} premium requests (${remaining - estimatedRequests} remaining)`
    };
  }

  /**
   * Reset mensuel automatique
   */
  shouldResetMonthly() {
    const now = new Date();
    return now.getDate() === this.config.resetDay;
  }

  async resetMonthly() {
    console.log(`📅 Monthly reset triggered (${new Date().toISOString()})`);
    
    // Archive données du mois précédent
    await this.monitor.db.archiveMonthlyData(new Date());
    
    // Reset counters
    this.premiumRequestCount = 0;
    this.requestsByType = {
      chat: 0,
      agent_mode: 0,
      code_review: 0,
      model_selection: 0,
      web_search: 0
    };

    this.emit('monthly_reset', {
      date: new Date(),
      message: 'Premium request counters reset for new month'
    });
  }

  /**
   * Retourne stats complètes
   */
  getStats() {
    const projection = this.calculateCostProjection();
    const alerts = this.checkAlerts(projection);

    return {
      plan: this.config.plan,
      monthly_limit: this.config.monthlyLimit,
      current_count: this.premiumRequestCount,
      remaining: Math.max(0, this.config.monthlyLimit - this.premiumRequestCount),
      percent_used: ((this.premiumRequestCount / this.config.monthlyLimit) * 100).toFixed(1),
      breakdown: this.requestsByType,
      projection,
      alerts,
      extra_cost_per_request: this.config.extraCostPerRequest,
      suggested_plan: this.suggestPlan(projection.projected_total)
    };
  }
}

module.exports = CopilotRequestTracker;
