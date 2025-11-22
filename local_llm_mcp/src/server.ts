/**
 * Local LLM MCP Server
 * Support pour Ollama, LM Studio, GPT4All, Qwen
 */

import express from 'express';
import dotenv from 'dotenv';
import { OllamaClient } from './backends/ollama.js';
import { LMStudioClient } from './backends/lmstudio.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = parseInt(process.env.MCP_PORT || '3200');

// Backends
const backends = {
  ollama: new OllamaClient(process.env.OLLAMA_URL),
  lmstudio: new LMStudioClient(process.env.LMSTUDIO_URL)
};

let currentBackend: 'ollama' | 'lmstudio' = (process.env.DEFAULT_BACKEND as any) || 'ollama';

// ===== ENDPOINTS MCP =====

app.get('/health', async (req, res) => {
  const backendsHealth = await Promise.all([
    backends.ollama.health(),
    backends.lmstudio.health()
  ]);

  res.json({
    status: 'healthy',
    service: 'local-llm-mcp',
    version: '1.0.0',
    current_backend: currentBackend,
    backends: backendsHealth
  });
});

app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'llm_list_models',
        description: 'Liste tous les modèles disponibles',
        inputSchema: {
          type: 'object',
          properties: {
            backend: { type: 'string', enum: ['ollama', 'lmstudio'], description: 'Backend à utiliser (optionnel)' }
          }
        }
      },
      {
        name: 'llm_run_inference',
        description: 'Exécute une inférence (génération de texte)',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Le prompt à envoyer au modèle' },
            model: { type: 'string', description: 'Nom du modèle à utiliser' },
            backend: { type: 'string', enum: ['ollama', 'lmstudio'] },
            temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
            max_tokens: { type: 'number', default: 2048 },
            top_p: { type: 'number', minimum: 0, maximum: 1, default: 0.9 }
          },
          required: ['prompt', 'model']
        }
      },
      {
        name: 'llm_chat',
        description: 'Conversation avec le modèle',
        inputSchema: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['system', 'user', 'assistant'] },
                  content: { type: 'string' }
                }
              }
            },
            model: { type: 'string' },
            backend: { type: 'string', enum: ['ollama', 'lmstudio'] },
            temperature: { type: 'number', default: 0.7 },
            max_tokens: { type: 'number', default: 2048 }
          },
          required: ['messages', 'model']
        }
      },
      {
        name: 'llm_model_info',
        description: 'Informations sur un modèle spécifique',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            backend: { type: 'string', enum: ['ollama', 'lmstudio'] }
          },
          required: ['model']
        }
      },
      {
        name: 'llm_set_backend',
        description: 'Change le backend par défaut',
        inputSchema: {
          type: 'object',
          properties: {
            backend: { type: 'string', enum: ['ollama', 'lmstudio'] }
          },
          required: ['backend']
        }
      },
      {
        name: 'llm_get_backend',
        description: 'Retourne le backend courant',
        inputSchema: { type: 'object', properties: {} }
      }
    ]
  });
});

app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    const backend = args?.backend || currentBackend;
    const client = backends[backend as keyof typeof backends];

    if (!client) {
      return res.status(400).json({
        success: false,
        error: `Backend inconnu: ${backend}`,
        timestamp: new Date().toISOString()
      });
    }

    let result;

    switch (name) {
      case 'llm_list_models':
        result = await client.listModels();
        break;

      case 'llm_run_inference':
        if (!args.prompt || !args.model) {
          return res.status(400).json({ success: false, error: 'prompt et model requis' });
        }
        result = await client.generate(args.model, args.prompt, {
          temperature: args.temperature,
          max_tokens: args.max_tokens,
          top_p: args.top_p
        });
        break;

      case 'llm_chat':
        if (!args.messages || !args.model) {
          return res.status(400).json({ success: false, error: 'messages et model requis' });
        }
        result = await client.chat(args.model, args.messages, {
          temperature: args.temperature,
          max_tokens: args.max_tokens
        });
        break;

      case 'llm_model_info':
        if (!args.model) {
          return res.status(400).json({ success: false, error: 'model requis' });
        }
        if (backend === 'ollama') {
          result = await (client as OllamaClient).getModelInfo(args.model);
        } else {
          result = { message: 'Model info non disponible pour ce backend' };
        }
        break;

      case 'llm_set_backend':
        currentBackend = args.backend;
        result = { backend: currentBackend, message: `Backend changé vers ${currentBackend}` };
        break;

      case 'llm_get_backend':
        result = { backend: currentBackend };
        break;

      default:
        return res.status(404).json({ success: false, error: `Tool inconnu: ${name}` });
    }

    res.json({
      success: true,
      data: result,
      backend: backend,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Démarrage
app.listen(PORT, () => {
  console.log(`🧠 Local LLM MCP Server démarré sur http://localhost:${PORT}`);
  console.log(`📡 Backend par défaut: ${currentBackend}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /health       - Health check`);
  console.log(`  GET  /tools        - Liste des tools`);
  console.log(`  POST /tools/call   - Appeler un tool`);
});
