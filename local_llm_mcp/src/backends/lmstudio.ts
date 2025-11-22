/**
 * LM Studio Backend Client (OpenAI-compatible API)
 */

import axios from 'axios';

export class LMStudioClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:1234') {
    this.baseUrl = baseUrl;
  }

  async listModels() {
    const response = await axios.get(`${this.baseUrl}/v1/models`);
    return response.data.data.map((m: any) => ({
      id: m.id,
      created: m.created,
      owned_by: m.owned_by
    }));
  }

  async generate(model: string, prompt: string, options: any = {}) {
    const response = await axios.post(`${this.baseUrl}/v1/completions`, {
      model,
      prompt,
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
      stream: false
    }, {
      timeout: options.timeout || 120000
    });

    return {
      text: response.data.choices[0].text,
      model: response.data.model,
      finish_reason: response.data.choices[0].finish_reason,
      usage: response.data.usage
    };
  }

  async chat(model: string, messages: any[], options: any = {}) {
    const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, {
      model,
      messages,
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
      stream: false
    }, {
      timeout: options.timeout || 120000
    });

    return {
      message: response.data.choices[0].message,
      model: response.data.model,
      finish_reason: response.data.choices[0].finish_reason,
      usage: response.data.usage
    };
  }

  async health() {
    try {
      await axios.get(`${this.baseUrl}/v1/models`, { timeout: 5000 });
      return { status: 'healthy', backend: 'lmstudio' };
    } catch (error) {
      return { status: 'unhealthy', backend: 'lmstudio', error: (error as Error).message };
    }
  }
}
