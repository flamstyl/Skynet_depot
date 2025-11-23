/**
 * HTTP Client with SSRF Protection
 * Secure HTTP requests with validation
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { HttpRequestConfig, HttpResponse, SecurityConfig } from '@gemini-flow/shared-types';
import { SSRFProtection } from '@gemini-flow/security';

export class SecureHttpClient {
  private ssrfProtection: SSRFProtection;

  constructor(securityConfig?: Partial<SecurityConfig>) {
    this.ssrfProtection = new SSRFProtection(securityConfig);
  }

  /**
   * Make a secure HTTP request
   */
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    const startTime = Date.now();

    try {
      // 1. Validate URL against SSRF protection
      const validation = await this.ssrfProtection.validateUrl(config.url);

      if (!validation.allowed) {
        throw new Error(`SSRF Protection: ${validation.reason}`);
      }

      // 2. Use sanitized URL
      const sanitizedUrl = validation.sanitizedUrl || config.url;

      // 3. Prepare axios config
      const axiosConfig: AxiosRequestConfig = {
        method: config.method,
        url: sanitizedUrl,
        headers: config.headers || {},
        timeout: config.timeout || 30000,
        maxRedirects: this.ssrfProtection.getConfig().maxRedirects || 3,
        validateStatus: () => true, // Accept all status codes
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(config.method)) {
        axiosConfig.data = config.body;
      }

      // Authentication
      if (config.authentication) {
        switch (config.authentication.type) {
          case 'basic':
            axiosConfig.auth = {
              username: config.authentication.credentials.username,
              password: config.authentication.credentials.password,
            };
            break;

          case 'bearer':
            axiosConfig.headers = {
              ...axiosConfig.headers,
              Authorization: `Bearer ${config.authentication.credentials.token}`,
            };
            break;

          case 'apiKey':
            const { headerName, apiKey } = config.authentication.credentials;
            axiosConfig.headers = {
              ...axiosConfig.headers,
              [headerName || 'X-API-Key']: apiKey,
            };
            break;
        }
      }

      // SSL validation
      if (config.validateSSL === false) {
        // Only disable in development!
        console.warn('⚠️  SSL validation disabled - use only in development');
      }

      // 4. Execute request
      const response: AxiosResponse = await axios(axiosConfig);

      // 5. Check for redirects and validate them
      if (response.request._redirectable?._redirectCount > 0) {
        const finalUrl = response.request.res.responseUrl;
        const redirectValidation = await this.ssrfProtection.validateRedirect(
          sanitizedUrl,
          finalUrl
        );

        if (!redirectValidation.allowed) {
          throw new Error(`Unsafe redirect detected: ${redirectValidation.reason}`);
        }
      }

      // 6. Return normalized response
      const executionTime = Date.now() - startTime;

      return {
        statusCode: response.status,
        headers: response.headers as Record<string, string>,
        body: response.data,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            statusCode: error.response.status,
            headers: error.response.headers as Record<string, string>,
            body: error.response.data,
            executionTime,
          };
        }

        throw new Error(
          `HTTP request failed: ${error.message} (${error.code || 'UNKNOWN'})`
        );
      }

      throw error;
    }
  }

  /**
   * Convenience methods
   */

  async get(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse> {
    return this.request({ method: 'GET', url, ...config });
  }

  async post(
    url: string,
    body: any,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse> {
    return this.request({ method: 'POST', url, body, ...config });
  }

  async put(
    url: string,
    body: any,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse> {
    return this.request({ method: 'PUT', url, body, ...config });
  }

  async patch(
    url: string,
    body: any,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse> {
    return this.request({ method: 'PATCH', url, body, ...config });
  }

  async delete(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse> {
    return this.request({ method: 'DELETE', url, ...config });
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.ssrfProtection.updateConfig(config);
  }
}

/**
 * Default instance
 */
export const httpClient = new SecureHttpClient();
