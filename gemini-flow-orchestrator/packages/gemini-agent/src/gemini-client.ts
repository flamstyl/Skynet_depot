/**
 * Google Gemini API Client
 * Handles communication with Gemini 2.5 Flash
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiClient {
  private genAI?: GoogleGenerativeAI;
  private model?: GenerativeModel;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...config,
    };

    // Only initialize if API key is provided
    if (this.config.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: this.config.model!,
      });
    }
  }

  /**
   * Check if client is initialized
   */
  private ensureInitialized(): void {
    if (!this.genAI || !this.model) {
      throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
    }
  }

  /**
   * Generate text completion
   */
  async generateText(prompt: string): Promise<string> {
    this.ensureInitialized();
    try {
      const result = await this.model!.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      throw new Error(
        `Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate structured JSON output
   * Using Gemini's JSON mode for reliable structured output
   */
  async generateJSON<T = any>(prompt: string, schema?: any): Promise<T> {
    this.ensureInitialized();
    try {
      // Enhanced prompt for JSON generation
      const jsonPrompt = `${prompt}

IMPORTANT: You must respond with ONLY valid JSON. No markdown, no code blocks, no explanation.
${schema ? `The JSON must match this schema: ${JSON.stringify(schema, null, 2)}` : ''}

Return only the JSON object.`;

      const generationConfig: GenerationConfig = {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
        responseMimeType: 'application/json',
      };

      const result = await this.model!.generateContent({
        contents: [{ role: 'user', parts: [{ text: jsonPrompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      // Parse JSON
      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Gemini returned invalid JSON');
      }
    } catch (error) {
      throw new Error(
        `Gemini JSON generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate with function calling
   */
  async generateWithFunctions(
    prompt: string,
    functions: Array<{
      name: string;
      description: string;
      parameters: any;
    }>
  ): Promise<{
    text?: string;
    functionCall?: {
      name: string;
      args: any;
    };
  }> {
    this.ensureInitialized();
    try {
      const tools = [
        {
          functionDeclarations: functions.map(fn => ({
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters,
          })),
        },
      ];

      const result = await this.model!.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools,
      });

      const response = result.response;
      const functionCall = response.functionCalls?.()?.[0];

      if (functionCall) {
        return {
          functionCall: {
            name: functionCall.name,
            args: functionCall.args,
          },
        };
      }

      return {
        text: response.text(),
      };
    } catch (error) {
      throw new Error(
        `Gemini function calling error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Chat session (multi-turn conversation)
   */
  async chat(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    this.ensureInitialized();
    try {
      const chat = this.model!.startChat({
        history: messages.slice(0, -1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      return result.response.text();
    } catch (error) {
      throw new Error(
        `Gemini chat error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Count tokens in text
   */
  async countTokens(text: string): Promise<number> {
    this.ensureInitialized();
    try {
      const result = await this.model!.countTokens(text);
      return result.totalTokens;
    } catch (error) {
      console.error('Token counting failed:', error);
      return 0;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.apiKey && !this.genAI) {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    }

    if (config.model && this.genAI) {
      this.model = this.genAI.getGenerativeModel({
        model: config.model,
      });
    }
  }
}
