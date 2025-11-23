/**
 * Web Scraper with SSRF Protection
 * Lightweight scraping using cheerio
 */

import * as cheerio from 'cheerio';
import type { ScrapeConfig, ScrapeResult } from '@gemini-flow/shared-types';
import { SecureHttpClient } from './http-client';

export class WebScraper {
  private httpClient: SecureHttpClient;

  constructor() {
    this.httpClient = new SecureHttpClient();
  }

  /**
   * Scrape a web page
   */
  async scrape(config: ScrapeConfig): Promise<ScrapeResult> {
    const startTime = Date.now();

    try {
      // Fetch the page
      const response = await this.httpClient.get(config.url, {
        timeout: config.timeout || 30000,
        headers: {
          'User-Agent': 'Gemini-Flow-Orchestrator/1.0 (Web Scraper)',
        },
      });

      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}: Failed to fetch page`);
      }

      // Load HTML into cheerio
      const $ = cheerio.load(response.body);

      let data: any;

      // Extract data based on config
      if (config.extractionRules) {
        // Use extraction rules
        data = {};
        for (const [key, selector] of Object.entries(config.extractionRules)) {
          data[key] = this.extractData($, selector);
        }
      } else if (config.selector) {
        // Use single selector
        data = this.extractData($, config.selector);
      } else {
        // Return entire page text
        data = {
          title: $('title').text(),
          text: $('body').text().trim(),
          html: $.html(),
        };
      }

      const duration = Date.now() - startTime;

      return {
        data,
        metadata: {
          url: config.url,
          timestamp: new Date(),
          duration,
        },
      };
    } catch (error) {
      throw new Error(
        `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract data from selector
   */
  private extractData($: cheerio.CheerioAPI, selector: string): any {
    const elements = $(selector);

    if (elements.length === 0) {
      return null;
    }

    if (elements.length === 1) {
      return this.extractElement($, elements.first());
    }

    // Multiple elements
    const results: any[] = [];
    elements.each((_, elem) => {
      results.push(this.extractElement($, $(elem)));
    });

    return results;
  }

  /**
   * Extract data from a single element
   */
  private extractElement($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): any {
    const tagName = element.prop('tagName')?.toLowerCase();

    // Links
    if (tagName === 'a') {
      return {
        text: element.text().trim(),
        href: element.attr('href'),
      };
    }

    // Images
    if (tagName === 'img') {
      return {
        src: element.attr('src'),
        alt: element.attr('alt'),
      };
    }

    // Inputs
    if (tagName === 'input') {
      return {
        type: element.attr('type'),
        name: element.attr('name'),
        value: element.attr('value'),
      };
    }

    // Tables
    if (tagName === 'table') {
      return this.extractTable($, element);
    }

    // Lists
    if (tagName === 'ul' || tagName === 'ol') {
      const items: string[] = [];
      element.find('li').each((_, li) => {
        items.push($(li).text().trim());
      });
      return items;
    }

    // Default: return text content
    return element.text().trim();
  }

  /**
   * Extract table data
   */
  private extractTable($: cheerio.CheerioAPI, table: cheerio.Cheerio<any>): any {
    const headers: string[] = [];
    const rows: any[] = [];

    // Extract headers
    table.find('thead tr th, thead tr td').each((_, th) => {
      headers.push($(th).text().trim());
    });

    // Extract rows
    table.find('tbody tr, tr').each((_, tr) => {
      const row: any = {};
      $(tr)
        .find('td')
        .each((index, td) => {
          const header = headers[index] || `column_${index}`;
          row[header] = $(td).text().trim();
        });

      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    });

    return {
      headers,
      rows,
    };
  }

  /**
   * Quick scrape helper
   */
  async quickScrape(url: string, selector?: string): Promise<any> {
    const result = await this.scrape({ url, selector });
    return result.data;
  }
}

/**
 * Default instance
 */
export const scraper = new WebScraper();
