/**
 * Service n8n - Skynet Control Panel
 */

import axios from 'axios';

export class N8nService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY || '';
  }

  async listWorkflows() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/workflows`, {
        headers: { 'X-N8N-API-KEY': this.apiKey }
      });
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  async executeWorkflow(id: string) {
    const response = await axios.post(`${this.baseUrl}/api/v1/workflows/${id}/execute`, {}, {
      headers: { 'X-N8N-API-KEY': this.apiKey }
    });
    return response.data;
  }
}
