#!/usr/bin/env node

/**
 * Effort Evaluator MCP Server
 * Permet à Claude/Copilot d'évaluer l'effort en tokens de différentes approches
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Estimation des coûts en tokens pour différentes opérations
const OPERATION_COSTS = {
  // Lecture de fichiers
  read_file_small: 100,      // < 100 lignes
  read_file_medium: 500,     // 100-500 lignes
  read_file_large: 2000,     // 500+ lignes

  // Écriture de fichiers
  write_file_small: 200,     // < 100 lignes
  write_file_medium: 800,    // 100-500 lignes
  write_file_large: 3000,    // 500+ lignes

  // Commandes
  execute_command: 150,
  execute_with_output: 500,

  // Recherche/analyse
  search_project: 300,
  analyze_codebase: 1500,

  // Génération de code
  generate_simple: 500,
  generate_complex: 2000,
  generate_full_feature: 5000,

  // Debugging/fixing
  fix_error: 800,
  refactor_code: 1200,

  // Communication/réponse
  simple_response: 50,
  detailed_response: 200,
  complex_explanation: 500,
};

const server = new Server(
  {
    name: "effort-evaluator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Liste des outils disponibles
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "evaluate_effort",
        description: "Évalue l'effort en tokens de plusieurs approches et recommande la meilleure",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Description de la tâche à accomplir",
            },
            approaches: {
              type: "array",
              description: "Liste des approches possibles",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Nom de l'approche",
                  },
                  steps: {
                    type: "array",
                    description: "Étapes de l'approche",
                    items: {
                      type: "object",
                      properties: {
                        operation: {
                          type: "string",
                          description: "Type d'opération (read_file, write_file, etc.)",
                        },
                        details: {
                          type: "string",
                          description: "Détails de l'opération",
                        },
                        size: {
                          type: "string",
                          enum: ["small", "medium", "large"],
                          description: "Taille estimée (small/medium/large)",
                        },
                      },
                      required: ["operation"],
                    },
                  },
                },
                required: ["name", "steps"],
              },
            },
          },
          required: ["task", "approaches"],
        },
      },
      {
        name: "estimate_operation",
        description: "Estime le coût en tokens d'une opération unique",
        inputSchema: {
          type: "object",
          properties: {
            operation: {
              type: "string",
              description: "Type d'opération",
            },
            size: {
              type: "string",
              enum: ["small", "medium", "large"],
              description: "Taille (small/medium/large)",
            },
            details: {
              type: "string",
              description: "Détails supplémentaires",
            },
          },
          required: ["operation"],
        },
      },
      {
        name: "suggest_optimization",
        description: "Suggère des optimisations pour réduire le coût en tokens",
        inputSchema: {
          type: "object",
          properties: {
            current_approach: {
              type: "array",
              description: "Approche actuelle (liste d'opérations)",
              items: {
                type: "object",
                properties: {
                  operation: { type: "string" },
                  size: { type: "string" },
                },
              },
            },
          },
          required: ["current_approach"],
        },
      },
    ],
  };
});

/**
 * Gestionnaire d'appel d'outils
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "evaluate_effort":
        return await evaluateEffort(args);

      case "estimate_operation":
        return await estimateOperation(args);

      case "suggest_optimization":
        return await suggestOptimization(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Évalue l'effort de plusieurs approches
 */
async function evaluateEffort(args) {
  const { task, approaches } = args;

  const results = [];

  for (const approach of approaches) {
    let totalTokens = 0;
    const stepCosts = [];

    for (const step of approach.steps) {
      const cost = estimateStepCost(step);
      totalTokens += cost;
      stepCosts.push({
        operation: step.operation,
        details: step.details || "",
        cost,
      });
    }

    results.push({
      name: approach.name,
      totalTokens,
      steps: stepCosts,
    });
  }

  // Trier par coût croissant
  results.sort((a, b) => a.totalTokens - b.totalTokens);

  // Recommandation
  const best = results[0];
  const worst = results[results.length - 1];
  const savings = worst.totalTokens - best.totalTokens;

  let output = `# Évaluation d'effort : ${task}\n\n`;

  output += `## 📊 Résultats\n\n`;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const badge = i === 0 ? "🏆 RECOMMANDÉ" : "";

    output += `### ${i + 1}. ${result.name} ${badge}\n`;
    output += `**Coût total estimé : ${result.totalTokens} tokens**\n\n`;
    output += `Détails des étapes :\n`;

    for (const step of result.steps) {
      output += `- ${step.operation}${step.details ? ` (${step.details})` : ""} : ${step.cost} tokens\n`;
    }

    output += `\n`;
  }

  output += `## 💡 Recommandation\n\n`;
  output += `L'approche **"${best.name}"** est la plus efficace avec **${best.totalTokens} tokens**.\n\n`;

  if (savings > 0) {
    output += `💰 Économie par rapport à "${worst.name}" : **${savings} tokens** (${Math.round(savings / worst.totalTokens * 100)}%)\n`;
  }

  return {
    content: [
      {
        type: "text",
        text: output,
      },
    ],
  };
}

/**
 * Estime le coût d'une opération
 */
async function estimateOperation(args) {
  const { operation, size = "medium", details = "" } = args;

  const cost = estimateStepCost({ operation, size, details });

  const output = `# Estimation d'opération\n\n` +
    `**Opération :** ${operation}\n` +
    `**Taille :** ${size}\n` +
    `${details ? `**Détails :** ${details}\n` : ""}` +
    `\n**Coût estimé : ${cost} tokens**`;

  return {
    content: [
      {
        type: "text",
        text: output,
      },
    ],
  };
}

/**
 * Suggère des optimisations
 */
async function suggestOptimization(args) {
  const { current_approach } = args;

  let totalCost = 0;
  const suggestions = [];

  for (const step of current_approach) {
    const cost = estimateStepCost(step);
    totalCost += cost;

    // Suggérer des alternatives moins coûteuses
    if (step.operation === "analyze_codebase" && step.size === "large") {
      suggestions.push({
        original: step.operation,
        suggestion: "search_project avec patterns ciblés",
        saving: 1200,
        reason: "Recherche ciblée vs analyse complète",
      });
    }

    if (step.operation === "generate_full_feature") {
      suggestions.push({
        original: step.operation,
        suggestion: "Décomposer en plusieurs generate_simple",
        saving: 2000,
        reason: "Génération incrémentale plus précise",
      });
    }

    if (step.size === "large") {
      suggestions.push({
        original: `${step.operation} (large)`,
        suggestion: `${step.operation} (medium) en plusieurs passes`,
        saving: Math.round(cost * 0.3),
        reason: "Traitement par chunks plus efficace",
      });
    }
  }

  let output = `# Optimisations suggérées\n\n`;
  output += `**Coût actuel total : ${totalCost} tokens**\n\n`;

  if (suggestions.length === 0) {
    output += `✅ Aucune optimisation évidente détectée. L'approche semble déjà efficace.\n`;
  } else {
    output += `## 💡 Suggestions\n\n`;
    let totalSavings = 0;

    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i];
      output += `${i + 1}. **${s.original}** → **${s.suggestion}**\n`;
      output += `   - Économie : ~${s.saving} tokens\n`;
      output += `   - Raison : ${s.reason}\n\n`;
      totalSavings += s.saving;
    }

    output += `**💰 Économie potentielle totale : ~${totalSavings} tokens** (${Math.round(totalSavings / totalCost * 100)}%)\n`;
  }

  return {
    content: [
      {
        type: "text",
        text: output,
      },
    ],
  };
}

/**
 * Estime le coût d'une étape
 */
function estimateStepCost(step) {
  const { operation, size = "medium" } = step;

  // Construire la clé de recherche
  const baseOp = operation.replace(/_small$|_medium$|_large$/, "");
  const key = size !== "medium" ? `${baseOp}_${size}` : baseOp;

  return OPERATION_COSTS[key] || OPERATION_COSTS[baseOp] || 200;
}

/**
 * Démarrage du serveur
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("💰 Effort Evaluator MCP Server running");
  console.error("Version: 1.0.0");
  console.error("Tools: 3 (evaluate_effort, estimate_operation, suggest_optimization)");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
