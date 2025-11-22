import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import robotsParser from 'robots-parser';

/**
 * Client HTTP robuste avec retry, timeout, rate limiting
 */

export class HttpClient {
  private client: AxiosInstance;
  private robotsCache: Map<string, any> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private minDelay = 1000; // 1 seconde entre requêtes sur même domaine

  constructor(config?: AxiosRequestConfig) {
    this.client = axios.create({
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MCPWebScraper/1.0; +https://github.com/skynet/mcp-web-scraper)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
      },
      ...config,
    });
  }

  /**
   * Récupère une URL avec gestion d'erreurs et retries
   */
  async fetch(url: string, options?: {
    timeout?: number;
    userAgent?: string;
    retries?: number;
  }): Promise<{ data: string; status: number; headers: any }> {
    const domain = new URL(url).hostname;

    // Rate limiting
    await this.respectRateLimit(domain);

    // Configuration de la requête
    const config: AxiosRequestConfig = {
      timeout: options?.timeout || 10000,
      headers: {
        ...(options?.userAgent && { 'User-Agent': options.userAgent }),
      },
    };

    // Retry logic
    const maxRetries = options?.retries || 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.client.get(url, config);

        // Mettre à jour le timestamp de la dernière requête
        this.lastRequestTime.set(domain, Date.now());

        return {
          data: response.data,
          status: response.status,
          headers: response.headers,
        };
      } catch (error: any) {
        lastError = error;

        // Ne pas retry sur certaines erreurs
        if (error.response && [400, 401, 403, 404, 410].includes(error.response.status)) {
          throw new Error(`Erreur HTTP ${error.response.status} : ${url}`);
        }

        // Attendre avant retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Échec après ${maxRetries} tentatives : ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Vérifie le robots.txt d'un site
   */
  async checkRobotsTxt(url: string, userAgent = 'MCPWebScraper'): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;

      // Vérifier le cache
      if (this.robotsCache.has(robotsUrl)) {
        const robots = this.robotsCache.get(robotsUrl);
        return robots.isAllowed(url, userAgent);
      }

      // Télécharger robots.txt
      const response = await this.client.get(robotsUrl, {
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 404,
      });

      // Si 404, considérer que tout est autorisé
      if (response.status === 404) {
        return true;
      }

      // Parser robots.txt
      const robots = robotsParser(robotsUrl, response.data);
      this.robotsCache.set(robotsUrl, robots);

      return robots.isAllowed(url, userAgent);
    } catch (error) {
      // En cas d'erreur, considérer que c'est autorisé (fail-safe)
      console.warn(`Impossible de vérifier robots.txt pour ${url} : ${error}`);
      return true;
    }
  }

  /**
   * Récupère le Crawl-delay depuis robots.txt
   */
  async getCrawlDelay(url: string, userAgent = 'MCPWebScraper'): Promise<number | null> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;

      if (this.robotsCache.has(robotsUrl)) {
        const robots = this.robotsCache.get(robotsUrl);
        return robots.getCrawlDelay(userAgent);
      }

      const response = await this.client.get(robotsUrl, {
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 404,
      });

      if (response.status === 404) {
        return null;
      }

      const robots = robotsParser(robotsUrl, response.data);
      this.robotsCache.set(robotsUrl, robots);

      return robots.getCrawlDelay(userAgent);
    } catch {
      return null;
    }
  }

  /**
   * Rate limiting : respecte le délai minimum entre requêtes
   */
  private async respectRateLimit(domain: string): Promise<void> {
    const lastRequest = this.lastRequestTime.get(domain);

    if (lastRequest) {
      const elapsed = Date.now() - lastRequest;
      const remaining = this.minDelay - elapsed;

      if (remaining > 0) {
        await this.sleep(remaining);
      }
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valide une URL
   */
  validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);

      // Vérifier protocole
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'Protocole non supporté (http/https uniquement)' };
      }

      // Bloquer IPs privées (prévention SSRF)
      const hostname = urlObj.hostname;
      if (this.isPrivateIP(hostname)) {
        return { valid: false, error: 'Adresses IP privées interdites (prévention SSRF)' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'URL invalide' };
    }
  }

  /**
   * Détecte si une IP est privée (prévention SSRF)
   */
  private isPrivateIP(hostname: string): boolean {
    // IPs privées et localhost
    const privateRanges = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^localhost$/i,
      /^0\.0\.0\.0$/,
    ];

    return privateRanges.some(range => range.test(hostname));
  }
}
