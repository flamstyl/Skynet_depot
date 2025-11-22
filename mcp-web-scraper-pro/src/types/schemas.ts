import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDATION POUR LES TOOLS MCP WEB SCRAPER
// ============================================================================

// --- SCRAPING ---
export const ScrapeUrlSchema = z.object({
  url: z.string().url(),
  mode: z.enum(['html', 'text', 'structured']).default('structured'),
  depth: z.number().min(0).max(3).default(0),
  followLinks: z.boolean().default(false),
  respectRobotsTxt: z.boolean().default(true),
  timeout: z.number().min(1000).max(60000).default(10000),
  userAgent: z.string().optional(),
});

export const CleanHtmlSchema = z.object({
  html: z.string(),
  removeScripts: z.boolean().default(true),
  removeStyles: z.boolean().default(true),
  removeComments: z.boolean().default(true),
  removeTrackers: z.boolean().default(true),
});

export const ExtractStructuredSchema = z.object({
  html: z.string(),
  extractLinks: z.boolean().default(true),
  extractImages: z.boolean().default(true),
  extractMeta: z.boolean().default(true),
});

export const ListLinksSchema = z.object({
  url: z.string().url(),
  internalOnly: z.boolean().default(false),
  externalOnly: z.boolean().default(false),
});

export const CrawlSchema = z.object({
  startUrl: z.string().url(),
  maxPages: z.number().min(1).max(100).default(10),
  sameDomainOnly: z.boolean().default(true),
  ignorePatterns: z.array(z.string()).default([]),
  respectRobotsTxt: z.boolean().default(true),
  delay: z.number().min(100).max(10000).default(1000),
});

// --- STORAGE ---
export const StorePageSchema = z.object({
  url: z.string().url(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  format: z.enum(['html', 'text', 'json']).default('json'),
});

export const GetStoredPageSchema = z.object({
  url: z.string().url().optional(),
  id: z.number().optional(),
});

export const DeleteStoredPageSchema = z.object({
  url: z.string().url().optional(),
  id: z.number().optional(),
});

export const SearchStoredPagesSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).default(10),
});

// --- VALIDATION ---
export const ValidateUrlSchema = z.object({
  url: z.string().url(),
  checkRobotsTxt: z.boolean().default(true),
  checkHttps: z.boolean().default(true),
});

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

export type ScrapeUrlInput = z.infer<typeof ScrapeUrlSchema>;
export type CleanHtmlInput = z.infer<typeof CleanHtmlSchema>;
export type ExtractStructuredInput = z.infer<typeof ExtractStructuredSchema>;
export type ListLinksInput = z.infer<typeof ListLinksSchema>;
export type CrawlInput = z.infer<typeof CrawlSchema>;
export type StorePageInput = z.infer<typeof StorePageSchema>;
export type GetStoredPageInput = z.infer<typeof GetStoredPageSchema>;
export type DeleteStoredPageInput = z.infer<typeof DeleteStoredPageSchema>;
export type SearchStoredPagesInput = z.infer<typeof SearchStoredPagesSchema>;
export type ValidateUrlInput = z.infer<typeof ValidateUrlSchema>;

// ============================================================================
// TYPES DE DONNÉES
// ============================================================================

export interface ScrapedPage {
  url: string;
  status: number;
  title?: string;
  cleanedHtml?: string;
  extractedText?: string;
  structured?: StructuredPage;
  metadata: {
    scrapedAt: string;
    contentType?: string;
    charset?: string;
    size: number;
  };
}

export interface StructuredPage {
  title?: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  paragraphs: string[];
  links: LinkInfo[];
  images: ImageInfo[];
  meta: MetaInfo;
  sections: Section[];
}

export interface LinkInfo {
  href: string;
  text: string;
  title?: string;
  isInternal: boolean;
  isExternal: boolean;
}

export interface ImageInfo {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface MetaInfo {
  description?: string;
  keywords?: string;
  author?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  canonical?: string;
}

export interface Section {
  heading?: string;
  content: string;
  level: number;
}

export interface CrawlManifest {
  startUrl: string;
  pages: ScrapedPage[];
  totalPages: number;
  successCount: number;
  errorCount: number;
  startedAt: string;
  completedAt: string;
  duration: number;
}

export interface StorageEntry {
  id: number;
  url: string;
  content: string;
  format: string;
  metadata: string; // JSON stringified
  createdAt: string;
  updatedAt: string;
}
