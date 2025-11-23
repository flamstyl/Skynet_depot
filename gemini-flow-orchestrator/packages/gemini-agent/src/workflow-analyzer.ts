/**
 * Workflow Analyzer
 * Uses Gemini to analyze workflow execution logs and identify issues
 */

import type {
  Workflow,
  WorkflowExecution,
  GeminiAnalysisResult,
  GeminiIssue,
  GeminiSuggestion,
} from '@gemini-flow/shared-types';
import { GeminiClient } from './gemini-client';

export class WorkflowAnalyzer {
  private gemini: GeminiClient;

  constructor(apiKey: string) {
    this.gemini = new GeminiClient({ apiKey });
  }

  /**
   * Analyze a failed workflow execution
   */
  async analyzeFailure(
    workflow: Workflow,
    execution: WorkflowExecution
  ): Promise<GeminiAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(workflow, execution);

    const schema = {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              node: { type: 'string' },
              message: { type: 'string' },
              suggestedFix: { type: 'object' },
            },
          },
        },
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['optimization', 'security', 'best-practice'] },
              description: { type: 'string' },
              implementation: { type: 'object' },
            },
          },
        },
        autoFixAvailable: { type: 'boolean' },
        reasoning: { type: 'string' },
      },
      required: ['success', 'reasoning'],
    };

    try {
      return await this.gemini.generateJSON<GeminiAnalysisResult>(prompt, schema);
    } catch (error) {
      throw new Error(
        `Workflow analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(workflow: Workflow, execution: WorkflowExecution): string {
    return `You are an expert workflow debugger. Analyze this failed workflow execution and identify the issues.

WORKFLOW CONFIGURATION:
${JSON.stringify(workflow, null, 2)}

EXECUTION DETAILS:
Status: ${execution.status}
Mode: ${execution.mode}
Started: ${execution.startedAt}
${execution.stoppedAt ? `Stopped: ${execution.stoppedAt}` : ''}
${execution.error ? `Error: ${JSON.stringify(execution.error, null, 2)}` : ''}

EXECUTION DATA:
${JSON.stringify(execution.data, null, 2)}

INSTRUCTIONS:
1. Identify what went wrong
2. Determine which node(s) caused the failure
3. Classify issues by severity (critical, warning, info)
4. Suggest specific fixes for each issue
5. Provide optimization suggestions if applicable
6. Indicate if the issue can be auto-fixed

ANALYSIS CATEGORIES:
- Configuration errors (missing parameters, wrong types)
- Authentication/credential issues
- Network/connectivity problems
- Data format mismatches
- Logic errors
- Timeout issues
- Rate limiting
- Permission errors

For each issue provide:
- severity: critical (blocks execution), warning (may cause problems), or info (minor)
- node: The node name where the issue occurred
- message: Clear description of the issue
- suggestedFix: Specific configuration changes to fix it

Also provide:
- suggestions: General improvements (optimization, security, best practices)
- autoFixAvailable: true if you can automatically fix all critical issues
- reasoning: Your analysis methodology`;
  }

  /**
   * Analyze workflow performance
   */
  async analyzePerformance(
    workflow: Workflow,
    executions: WorkflowExecution[]
  ): Promise<{
    averageExecutionTime: number;
    slowestNodes: Array<{ node: string; avgTime: number }>;
    suggestions: GeminiSuggestion[];
    reasoning: string;
  }> {
    const stats = this.calculateExecutionStats(executions);

    const prompt = `Analyze this workflow's performance and suggest optimizations.

WORKFLOW:
${JSON.stringify(workflow, null, 2)}

PERFORMANCE STATISTICS:
${JSON.stringify(stats, null, 2)}

Provide performance optimization suggestions focusing on:
1. Slow nodes that could be optimized
2. Parallel execution opportunities
3. Unnecessary data transformations
4. Caching opportunities
5. API call optimizations

Return JSON with:
- suggestions: Array of optimization suggestions
- reasoning: Your analysis`;

    const result = await this.gemini.generateJSON<any>(prompt);

    return {
      averageExecutionTime: stats.averageExecutionTime,
      slowestNodes: stats.slowestNodes,
      ...result,
    };
  }

  /**
   * Calculate execution statistics
   */
  private calculateExecutionStats(executions: WorkflowExecution[]): any {
    const successfulExecutions = executions.filter(e => e.status === 'success');

    if (successfulExecutions.length === 0) {
      return {
        averageExecutionTime: 0,
        slowestNodes: [],
      };
    }

    // Calculate average execution time
    const totalTime = successfulExecutions.reduce((sum, exec) => {
      const duration =
        exec.stoppedAt && exec.startedAt
          ? new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime()
          : 0;
      return sum + duration;
    }, 0);

    const averageExecutionTime = totalTime / successfulExecutions.length;

    // Calculate average time per node
    const nodeStats: Record<string, { total: number; count: number }> = {};

    for (const exec of successfulExecutions) {
      const runData = exec.data.resultData.runData;

      for (const [nodeName, runs] of Object.entries(runData)) {
        if (!nodeStats[nodeName]) {
          nodeStats[nodeName] = { total: 0, count: 0 };
        }

        for (const run of runs) {
          nodeStats[nodeName].total += run.executionTime || 0;
          nodeStats[nodeName].count += 1;
        }
      }
    }

    // Get slowest nodes
    const slowestNodes = Object.entries(nodeStats)
      .map(([node, stats]) => ({
        node,
        avgTime: stats.total / stats.count,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    return {
      averageExecutionTime,
      slowestNodes,
      totalExecutions: executions.length,
      successfulExecutions: successfulExecutions.length,
      failedExecutions: executions.filter(e => e.status === 'error').length,
    };
  }

  /**
   * Validate workflow configuration
   */
  async validateWorkflow(workflow: Workflow): Promise<GeminiAnalysisResult> {
    const prompt = `Validate this workflow configuration and identify potential issues.

WORKFLOW:
${JSON.stringify(workflow, null, 2)}

Check for:
1. Missing required node parameters
2. Invalid connections
3. Circular dependencies
4. Missing credentials
5. Security issues (hardcoded secrets, unsafe URLs)
6. Best practice violations
7. Orphaned nodes (not connected)

Return a detailed analysis with issues and suggestions.`;

    const schema = {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        issues: { type: 'array' },
        suggestions: { type: 'array' },
        reasoning: { type: 'string' },
      },
      required: ['success', 'reasoning'],
    };

    return await this.gemini.generateJSON<GeminiAnalysisResult>(prompt, schema);
  }
}
