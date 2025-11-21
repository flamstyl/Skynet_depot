/**
 * 🔥 PhoenixTerm MCP Tool: validate_command
 * Valide une commande avant exécution (dry-run)
 */

export const validateCommand = {
  name: 'validate_command',
  description: 'Validate a command before execution, checking for security risks and potential impact',

  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The command to validate',
      },
      dry_run: {
        type: 'boolean',
        description: 'Perform a dry-run analysis without executing',
        default: true,
      },
      detailed: {
        type: 'boolean',
        description: 'Include detailed security analysis',
        default: true,
      },
    },
    required: ['command'],
  },

  async execute(params, context) {
    const {
      command,
      dry_run = true,
      detailed = true,
    } = params;

    const { securityManager } = context;

    try {
      // Générer le rapport de sécurité complet
      const report = securityManager.generateSecurityReport(command);

      // Analyse d'impact
      const impact = securityManager.analyzeImpact(command);

      // Résultat de base
      const result = {
        success: true,
        command: report.command.original,
        sanitized: report.command.sanitized,
        safe: report.safe,
        validation: {
          valid: report.validation.valid,
          blocked: report.validation.blocked,
          severity: report.validation.severity,
          requiresConfirmation: report.validation.requiresConfirmation,
        },
        recommendation: report.recommendation,
        timestamp: Date.now(),
      };

      // Ajouter les détails si demandé
      if (detailed) {
        result.warnings = report.validation.warnings || [];
        result.impact = impact;

        // Suggestions de sécurisation
        result.suggestions = [];

        if (impact.privilegeEscalation && !command.includes('sudo')) {
          result.suggestions.push({
            type: 'security',
            message: 'Command may require elevated privileges. Consider using sudo.',
          });
        }

        if (impact.networkActivity) {
          result.suggestions.push({
            type: 'info',
            message: 'Command will perform network activity. Ensure network connectivity.',
          });
        }

        if (impact.filesystemChanges) {
          result.suggestions.push({
            type: 'caution',
            message: 'Command will modify the filesystem. Consider backing up important data.',
          });
        }

        // Estimation du niveau de risque
        result.riskLevel = this.calculateRiskLevel(report, impact);

        // Score de sécurité (0-100, 100 = très sûr)
        result.securityScore = this.calculateSecurityScore(report, impact);
      }

      return result;

    } catch (error) {
      console.error('[ValidateCommand] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Calcule le niveau de risque global
   */
  calculateRiskLevel(report, impact) {
    if (report.validation.blocked || report.validation.severity === 'critical') {
      return 'CRITICAL';
    }

    if (report.validation.severity === 'high' || impact.estimatedRisk === 'high') {
      return 'HIGH';
    }

    if (report.validation.severity === 'medium' || impact.estimatedRisk === 'medium') {
      return 'MEDIUM';
    }

    if (report.validation.warnings?.length > 0) {
      return 'LOW';
    }

    return 'SAFE';
  },

  /**
   * Calcule un score de sécurité (0-100)
   */
  calculateSecurityScore(report, impact) {
    let score = 100;

    // Pénalités
    if (report.validation.blocked) score -= 100;
    if (report.validation.severity === 'critical') score -= 80;
    if (report.validation.severity === 'high') score -= 50;
    if (report.validation.severity === 'medium') score -= 30;
    if (report.validation.severity === 'low') score -= 10;

    if (impact.estimatedRisk === 'high') score -= 30;
    if (impact.estimatedRisk === 'medium') score -= 15;

    if (impact.filesystemChanges) score -= 10;
    if (impact.networkActivity) score -= 5;
    if (impact.privilegeEscalation) score -= 20;
    if (impact.systemModification) score -= 25;

    const warningCount = report.validation.warnings?.length || 0;
    score -= warningCount * 5;

    return Math.max(0, Math.min(100, score));
  },
};

export default validateCommand;
