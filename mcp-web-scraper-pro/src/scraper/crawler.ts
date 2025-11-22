import { HttpClient } from './http-client.js';
import { HtmlParser } from './parser.js';
import { HtmlCleaner } from './cleaner.js';
import { ScrapedPage, CrawlManifest } from '../types/schemas.js';

/**
 * Crawler multi-pages
 */

export class Crawler {
  private httpClient: HttpClient;
  private parser: HtmlParser;
  private cleaner: HtmlCleaner;
  private visited: Set<string> = new Set();
  private queue: string[] = [];

  constructor() {
    this.httpClient = new HttpClient();
    this.parser = new HtmlParser();
    this.cleaner = new HtmlCleaner();
  }

  /**
   * Lance un crawl à partir d'une URL
   */
  async crawl(options: {
    startUrl: string;
    maxPages?: number;
    sameDomainOnly?: boolean;
    respectRobotsTxt?: boolean;
    delay?: number;
    ignorePatterns?: string[];
  }): Promise<CrawlManifest> {
    const {
      startUrl,
      maxPages = 10,
      sameDomainOnly = true,
      respectRobotsTxt = true,
      delay = 1000,
      ignorePatterns = [],
    } = options;

    const startTime = Date.now();
    const pages: ScrapedPage[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    this.visited.clear();
    this.queue = [startUrl];

    const baseDomain = new URL(startUrl).hostname;

    while (this.queue.length > 0 && pages.length < maxPages) {
      const url = this.queue.shift()!;

      // Skip si déjà visité
      if (this.visited.has(url)) continue;

      // Skip si pattern à ignorer
      if (ignorePatterns.some(pattern => url.includes(pattern))) continue;

      // Skip si domaine différent (si sameDomainOnly)
      if (sameDomainOnly) {
        const urlDomain = new URL(url).hostname;
        if (urlDomain !== baseDomain) continue;
      }

      // Vérifier robots.txt
      if (respectRobotsTxt) {
        const allowed = await this.httpClient.checkRobotsTxt(url);
        if (!allowed) {
          console.warn(`Robots.txt interdit l'accès à ${url}`);
          continue;
        }
      }

      try {
        // Scrape la page
        const { data, status, headers } = await this.httpClient.fetch(url);

        // Nettoyer et parser
        const cleanedHtml = this.cleaner.clean(data);
        const structured = this.parser.extractStructured(cleanedHtml, url);
        const extractedText = this.parser.htmlToText(cleanedHtml);

        pages.push({
          url,
          status,
          title: structured.title,
          cleanedHtml,
          extractedText,
          structured,
          metadata: {
            scrapedAt: new Date().toISOString(),
            contentType: headers['content-type'],
            charset: this.detectCharset(headers['content-type']),
            size: data.length,
          },
        });

        // Ajouter les liens à la queue
        const links = this.parser.extractAllLinks(data, url);
        for (const link of links) {
          if (!this.visited.has(link) && !this.queue.includes(link)) {
            this.queue.push(link);
          }
        }

        this.visited.add(url);

        // Respecter le delay
        await this.sleep(delay);
      } catch (error: any) {
        errors.push({ url, error: error.message });
      }
    }

    const endTime = Date.now();

    return {
      startUrl,
      pages,
      totalPages: pages.length,
      successCount: pages.length,
      errorCount: errors.length,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date(endTime).toISOString(),
      duration: endTime - startTime,
    };
  }

  /**
   * Détecte le charset depuis Content-Type
   */
  private detectCharset(contentType?: string): string {
    if (!contentType) return 'utf-8';

    const match = contentType.match(/charset=([^;]+)/i);
    return match ? match[1].trim().toLowerCase() : 'utf-8';
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
