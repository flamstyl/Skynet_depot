import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import * as he from 'he';
import { StructuredPage, LinkInfo, ImageInfo, MetaInfo, Section } from '../types/schemas.js';

/**
 * Parser HTML avec extraction structurée
 */

export class HtmlParser {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
  }

  /**
   * Parse et extrait le contenu structuré d'une page HTML
   */
  extractStructured(html: string, baseUrl: string): StructuredPage {
    const $ = cheerio.load(html);

    return {
      title: this.extractTitle($),
      headings: this.extractHeadings($),
      paragraphs: this.extractParagraphs($),
      links: this.extractLinks($, baseUrl),
      images: this.extractImages($, baseUrl),
      meta: this.extractMeta($),
      sections: this.extractSections($),
    };
  }

  /**
   * Extrait le titre de la page
   */
  private extractTitle($: cheerio.CheerioAPI): string | undefined {
    // Priorité : <title>, og:title, h1
    return (
      $('title').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      undefined
    );
  }

  /**
   * Extrait tous les headings par niveau
   */
  private extractHeadings($: cheerio.CheerioAPI) {
    return {
      h1: $('h1').map((_, el) => $(el).text().trim()).get(),
      h2: $('h2').map((_, el) => $(el).text().trim()).get(),
      h3: $('h3').map((_, el) => $(el).text().trim()).get(),
    };
  }

  /**
   * Extrait les paragraphes
   */
  private extractParagraphs($: cheerio.CheerioAPI): string[] {
    return $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 20); // Filtrer les paragraphes trop courts
  }

  /**
   * Extrait les liens
   */
  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): LinkInfo[] {
    const links: LinkInfo[] = [];
    const baseDomain = new URL(baseUrl).hostname;

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        const linkDomain = new URL(absoluteUrl).hostname;

        links.push({
          href: absoluteUrl,
          text: $(el).text().trim(),
          title: $(el).attr('title'),
          isInternal: linkDomain === baseDomain,
          isExternal: linkDomain !== baseDomain,
        });
      } catch {
        // Ignorer URLs invalides
      }
    });

    return links;
  }

  /**
   * Extrait les images
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl: string): ImageInfo[] {
    const images: ImageInfo[] = [];

    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (!src) return;

      try {
        const absoluteUrl = new URL(src, baseUrl).href;

        images.push({
          src: absoluteUrl,
          alt: $(el).attr('alt'),
          title: $(el).attr('title'),
          width: parseInt($(el).attr('width') || '0') || undefined,
          height: parseInt($(el).attr('height') || '0') || undefined,
        });
      } catch {
        // Ignorer URLs invalides
      }
    });

    return images;
  }

  /**
   * Extrait les métadonnées
   */
  private extractMeta($: cheerio.CheerioAPI): MetaInfo {
    return {
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      author: $('meta[name="author"]').attr('content'),
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      twitterCard: $('meta[name="twitter:card"]').attr('content'),
      canonical: $('link[rel="canonical"]').attr('href'),
    };
  }

  /**
   * Extrait les sections (basé sur les headings)
   */
  private extractSections($: cheerio.CheerioAPI): Section[] {
    const sections: Section[] = [];
    const $body = $('body');

    // Rechercher sections avec h1, h2, h3
    $body.find('h1, h2, h3').each((_, el) => {
      const heading = $(el).text().trim();
      const level = parseInt(el.tagName.substring(1));

      // Récupérer le contenu jusqu'au prochain heading de même niveau ou supérieur
      let content = '';
      $(el).nextUntil(`h1, h2, h3`).each((_, contentEl) => {
        content += $(contentEl).text().trim() + '\n';
      });

      sections.push({
        heading,
        content: content.trim(),
        level,
      });
    });

    return sections;
  }

  /**
   * Convertit HTML en Markdown
   */
  htmlToMarkdown(html: string): string {
    return this.turndownService.turndown(html);
  }

  /**
   * Convertit HTML en texte brut
   */
  htmlToText(html: string): string {
    const $ = cheerio.load(html);

    // Supprimer scripts, styles, commentaires
    $('script, style, noscript, iframe').remove();

    // Extraire le texte
    return $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Décode les entités HTML
   */
  decodeHtml(text: string): string {
    return he.decode(text);
  }

  /**
   * Extrait tous les liens d'une page
   */
  extractAllLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const links = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        links.add(absoluteUrl);
      } catch {
        // Ignorer URLs invalides
      }
    });

    return Array.from(links);
  }

  /**
   * Détecte le type de contenu d'une page
   */
  detectPageType($: cheerio.CheerioAPI): string {
    // Article de blog/news
    if ($('article').length > 0 || $('[itemtype*="Article"]').length > 0) {
      return 'article';
    }

    // Page produit e-commerce
    if ($('[itemtype*="Product"]').length > 0 || $('.product, .item-product').length > 0) {
      return 'product';
    }

    // Documentation technique
    if ($('pre code').length > 3 || $('.documentation, .docs').length > 0) {
      return 'documentation';
    }

    // Page d'accueil
    if ($('nav').length > 0 && $('h1').length === 1) {
      return 'homepage';
    }

    return 'generic';
  }
}
