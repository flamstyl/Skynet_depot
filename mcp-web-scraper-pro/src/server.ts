import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';

import { HttpClient } from './scraper/http-client.js';
import { HtmlParser } from './scraper/parser.js';
import { HtmlCleaner } from './scraper/cleaner.js';
import { Crawler } from './scraper/crawler.js';
import { ScraperStorage } from './scraper/storage.js';

import {
  ScrapeUrlSchema,
  CleanHtmlSchema,
  ExtractStructuredSchema,
  ListLinksSchema,
  CrawlSchema,
  StorePageSchema,
  GetStoredPageSchema,
  DeleteStoredPageSchema,
  SearchStoredPagesSchema,
  ValidateUrlSchema,
} from './types/schemas.js';

const TOOLS: Tool[] = [
  {
    name: 'scrape_url',
    description: 'Scrape une URL et récupère son contenu (HTML brut, texte, ou structuré JSON)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri', description: 'URL à scraper' },
        mode: { type: 'string', enum: ['html', 'text', 'structured'], default: 'structured', description: 'Mode extraction' },
        depth: { type: 'number', default: 0, description: 'Profondeur crawl (0-3)' },
        followLinks: { type: 'boolean', default: false },
        respectRobotsTxt: { type: 'boolean', default: true },
        timeout: { type: 'number', default: 10000 },
      },
      required: ['url'],
    },
  },
  {
    name: 'clean_html',
    description: 'Nettoie du HTML en supprimant scripts, styles, trackers, publicités',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML à nettoyer' },
        removeScripts: { type: 'boolean', default: true },
        removeStyles: { type: 'boolean', default: true },
        removeComments: { type: 'boolean', default: true },
        removeTrackers: { type: 'boolean', default: true },
      },
      required: ['html'],
    },
  },
  {
    name: 'extract_structured',
    description: 'Extrait le contenu structuré d\'un HTML (title, headings, paragraphes, links, images, meta)',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML à parser' },
        extractLinks: { type: 'boolean', default: true },
        extractImages: { type: 'boolean', default: true },
        extractMeta: { type: 'boolean', default: true },
      },
      required: ['html'],
    },
  },
  {
    name: 'list_links',
    description: 'Liste tous les liens d\'une page web (internes et/ou externes)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        internalOnly: { type: 'boolean', default: false },
        externalOnly: { type: 'boolean', default: false },
      },
      required: ['url'],
    },
  },
  {
    name: 'crawl',
    description: 'Crawl un site web (multi-pages) avec limites configurables',
    inputSchema: {
      type: 'object',
      properties: {
        startUrl: { type: 'string', format: 'uri' },
        maxPages: { type: 'number', default: 10, description: 'Nombre max de pages (1-100)' },
        sameDomainOnly: { type: 'boolean', default: true },
        ignorePatterns: { type: 'array', items: { type: 'string' } },
        respectRobotsTxt: { type: 'boolean', default: true },
        delay: { type: 'number', default: 1000, description: 'Délai entre requêtes (ms)' },
      },
      required: ['startUrl'],
    },
  },
  {
    name: 'store_scraped_data',
    description: 'Stocke une page scrappée dans la base de données locale (SQLite)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        content: { type: 'string' },
        metadata: { type: 'object' },
        format: { type: 'string', enum: ['html', 'text', 'json'], default: 'json' },
      },
      required: ['url', 'content'],
    },
  },
  {
    name: 'get_stored_page',
    description: 'Récupère une page stockée par URL ou ID',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        id: { type: 'number' },
      },
    },
  },
  {
    name: 'delete_stored_page',
    description: 'Supprime une page stockée',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        id: { type: 'number' },
      },
    },
  },
  {
    name: 'search_stored_pages',
    description: 'Recherche dans les pages stockées',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'validate_url',
    description: 'Valide une URL (format, robots.txt, HTTPS)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        checkRobotsTxt: { type: 'boolean', default: true },
        checkHttps: { type: 'boolean', default: true },
      },
      required: ['url'],
    },
  },
  {
    name: 'scraper_status',
    description: 'Récupère les statistiques du scraper (nombre de pages stockées, derniers scrapes)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export function createMCPServer() {
  const server = new Server({ name: 'mcp-web-scraper-pro', version: '1.0.0' }, { capabilities: { tools: {} } });
  const httpClient = new HttpClient();
  const parser = new HtmlParser();
  const cleaner = new HtmlCleaner();
  const crawler = new Crawler();
  const storage = new ScraperStorage();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      let result: any;

      switch (name) {
        case 'scrape_url': {
          const input = ScrapeUrlSchema.parse(args);
          const validation = httpClient.validateUrl(input.url);
          if (!validation.valid) throw new Error(validation.error);

          if (input.respectRobotsTxt && !(await httpClient.checkRobotsTxt(input.url))) {
            throw new Error('Robots.txt interdit l\'accès à cette URL');
          }

          const { data, status, headers } = await httpClient.fetch(input.url, { timeout: input.timeout });
          const cleanedHtml = cleaner.clean(data);

          result = {
            url: input.url,
            status,
            cleanedHtml: input.mode === 'html' ? cleanedHtml : undefined,
            extractedText: input.mode === 'text' ? parser.htmlToText(cleanedHtml) : undefined,
            structured: input.mode === 'structured' ? parser.extractStructured(cleanedHtml, input.url) : undefined,
            metadata: { scrapedAt: new Date().toISOString(), contentType: headers['content-type'], size: data.length },
          };
          break;
        }

        case 'clean_html': {
          const input = CleanHtmlSchema.parse(args);
          result = { cleanedHtml: cleaner.clean(input.html, input) };
          break;
        }

        case 'extract_structured': {
          const input = ExtractStructuredSchema.parse(args);
          result = parser.extractStructured(input.html, 'http://localhost');
          break;
        }

        case 'list_links': {
          const input = ListLinksSchema.parse(args);
          const { data } = await httpClient.fetch(input.url);
          const structured = parser.extractStructured(data, input.url);
          result = { links: structured.links.filter(l =>
            (input.internalOnly ? l.isInternal : true) && (input.externalOnly ? l.isExternal : true)
          )};
          break;
        }

        case 'crawl': {
          const input = CrawlSchema.parse(args);
          result = await crawler.crawl(input);
          break;
        }

        case 'store_scraped_data': {
          const input = StorePageSchema.parse(args);
          const id = storage.storePage(input.url, input.content, input.format, input.metadata);
          result = { id, message: `Page stockée avec l'ID ${id}` };
          break;
        }

        case 'get_stored_page': {
          const input = GetStoredPageSchema.parse(args);
          result = input.url ? storage.getPageByUrl(input.url) : storage.getPageById(input.id!);
          if (!result) throw new Error('Page non trouvée');
          break;
        }

        case 'delete_stored_page': {
          const input = DeleteStoredPageSchema.parse(args);
          const deleted = storage.deletePage(input.url || input.id!);
          result = { success: deleted };
          break;
        }

        case 'search_stored_pages': {
          const input = SearchStoredPagesSchema.parse(args);
          result = { pages: storage.searchPages(input.query, input.limit) };
          break;
        }

        case 'validate_url': {
          const input = ValidateUrlSchema.parse(args);
          const validation = httpClient.validateUrl(input.url);
          const robotsAllowed = input.checkRobotsTxt ? await httpClient.checkRobotsTxt(input.url) : true;
          const isHttps = input.url.startsWith('https://');
          result = { valid: validation.valid && robotsAllowed, isHttps, robotsAllowed, error: validation.error };
          break;
        }

        case 'scraper_status': {
          result = { totalPages: storage.countPages(), pages: storage.listPages(10) };
          break;
        }

        default:
          throw new Error(`Tool inconnu : ${name}`);
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error: any) {
      return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error: error.message }, null, 2) }] };
    }
  });

  return server;
}

export async function runServer() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Web Scraper Pro Server démarré');
}
