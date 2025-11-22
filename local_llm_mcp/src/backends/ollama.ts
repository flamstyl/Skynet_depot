/**
 * Ollama Backend Client
 */

import axios from 'axios';

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async listModels() {
    const response = await axios.get(`${this.baseUrl}/api/tags`);
    return response.data.models.map((m: any) => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
      digest: m.digest
    }));
  }

  async getModelInfo(model: string) {
    const response = await axios.post(`${this.baseUrl}/api/show`, { name: model });
    return response.data;
  }

  async generate(model: string, prompt: string, options: any = {}) {
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
        top_k: options.top_k || 40,
        num_predict: options.max_tokens || 2048
      }
    }, {
      timeout: options.timeout || 120000
    });

    return {
      text: response.data.response,
      model,
      created_at: response.data.created_at,
      done: response.data.done,
      context: response.data.context,
      total_duration: response.data.total_duration,
      load_duration: response.data.load_duration,
      prompt_eval_count: response.data.prompt_eval_count,
      eval_count: response.data.eval_count
    };
  }

  async chat(model: string, messages: any[], options: any = {}) {
    const response = await axios.post(`${this.baseUrl}/api/chat`, {
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9
      }
    }, {
      timeout: options.timeout || 120000
    });

    return {
      message: response.data.message,
      model,
      created_at: response.data.created_at,
      done: response.data.done
    };
  }

  async health() {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return { status: 'healthy', backend: 'ollama' };
    } catch (error) {
      return { status: 'unhealthy', backend: 'ollama', error: (error as Error).message };
    }
  }
}
