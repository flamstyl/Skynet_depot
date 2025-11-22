import * as cheerio from 'cheerio';

/**
 * Nettoyage et purification du HTML
 */

export class HtmlCleaner {
  /**
   * Nettoie le HTML en supprimant scripts, styles, trackers, etc.
   */
  clean(html: string, options: {
    removeScripts?: boolean;
    removeStyles?: boolean;
    removeComments?: boolean;
    removeTrackers?: boolean;
    removeAds?: boolean;
  } = {}): string {
    const {
      removeScripts = true,
      removeStyles = true,
      removeComments = true,
      removeTrackers = true,
      removeAds = true,
    } = options;

    let $ = cheerio.load(html);

    // Supprimer scripts
    if (removeScripts) {
      $('script, noscript').remove();
    }

    // Supprimer styles
    if (removeStyles) {
      $('style, link[rel="stylesheet"]').remove();
      $('*').removeAttr('style');
    }

    // Supprimer commentaires HTML
    if (removeComments) {
      $('*').contents().filter(function() {
        return this.type === 'comment';
      }).remove();
    }

    // Supprimer trackers et analytics
    if (removeTrackers) {
      this.removeTrackers($);
    }

    // Supprimer publicités
    if (removeAds) {
      this.removeAds($);
    }

    return $.html();
  }

  /**
   * Supprime les trackers et scripts analytics
   */
  private removeTrackers($: cheerio.CheerioAPI): void {
    const trackerSelectors = [
      'script[src*="google-analytics"]',
      'script[src*="googletagmanager"]',
      'script[src*="facebook.com/tr"]',
      'script[src*="doubleclick"]',
      'script[src*="analytics"]',
      'script[src*="tracking"]',
      'script[src*="pixel"]',
      'img[src*="analytics"]',
      'img[src*="tracking"]',
      'iframe[src*="google"]',
      'iframe[src*="facebook"]',
    ];

    trackerSelectors.forEach(selector => {
      $(selector).remove();
    });
  }

  /**
   * Supprime les publicités
   */
  private removeAds($: cheerio.CheerioAPI): void {
    const adSelectors = [
      '.ad, .ads, .advertisement',
      '[class*="ad-"], [id*="ad-"]',
      '[class*="banner"], [id*="banner"]',
      '[class*="sponsor"], [id*="sponsor"]',
      'iframe[src*="ads"]',
      'div[id*="google_ads"]',
    ];

    adSelectors.forEach(selector => {
      $(selector).remove();
    });
  }

  /**
   * Supprime le "boilerplate" (header, footer, sidebar, nav)
   */
  removeBoilerplate(html: string): string {
    const $ = cheerio.load(html);

    // Supprimer éléments structurels non-content
    $('header, footer, nav, aside, .sidebar, .header, .footer, .navigation').remove();

    // Supprimer menus
    $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();

    return $.html();
  }

  /**
   * Extrait uniquement le contenu principal (main content)
   */
  extractMainContent(html: string): string {
    const $ = cheerio.load(html);

    // Chercher le contenu principal
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
    ];

    for (const selector of mainSelectors) {
      const $main = $(selector).first();
      if ($main.length > 0 && $main.text().trim().length > 100) {
        return $main.html() || '';
      }
    }

    // Si pas de main trouvé, retourner body nettoyé
    return this.removeBoilerplate(html);
  }

  /**
   * Normalise les espaces blancs
   */
  normalizeWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s+\n/g, '\n\n')
      .trim();
  }

  /**
   * Supprime les attributs inutiles
   */
  removeUnnecessaryAttributes(html: string): string {
    const $ = cheerio.load(html);

    const attributesToRemove = [
      'data-*',
      'onclick',
      'onload',
      'onerror',
      'class',
      'id',
      'style',
    ];

    $('*').each((_, el) => {
      const $el = $(el);
      attributesToRemove.forEach(attr => {
        if (attr.endsWith('*')) {
          // Supprimer tous les attributs data-*
          const prefix = attr.slice(0, -1);
          Object.keys(el.attribs || {}).forEach(attrName => {
            if (attrName.startsWith(prefix)) {
              $el.removeAttr(attrName);
            }
          });
        } else {
          $el.removeAttr(attr);
        }
      });
    });

    return $.html();
  }

  /**
   * Détecte et supprime le spam/contenu généré
   */
  removeSpam(html: string): string {
    const $ = cheerio.load(html);

    // Patterns de spam
    const spamPatterns = [
      /buy\s+(now|cheap|online)/i,
      /click\s+here/i,
      /free\s+(download|trial|shipping)/i,
      /\$\d+\s*(USD|EUR|GBP)/i,
    ];

    $('*').each((_, el) => {
      const text = $(el).text();
      if (spamPatterns.some(pattern => pattern.test(text))) {
        $(el).remove();
      }
    });

    return $.html();
  }
}
