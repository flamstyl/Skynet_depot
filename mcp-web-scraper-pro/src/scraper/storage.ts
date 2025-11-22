import Database from 'better-sqlite3';
import * as path from 'path';
import { StorageEntry } from '../types/schemas.js';

/**
 * Stockage SQLite pour pages scrappées
 */

export class ScraperStorage {
  private db: Database.Database;

  constructor(dbPath: string = './scraped_data.db') {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  /**
   * Initialise la base de données
   */
  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'json',
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_url ON pages(url);
      CREATE INDEX IF NOT EXISTS idx_created_at ON pages(created_at);
    `);
  }

  /**
   * Stocke une page
   */
  storePage(url: string, content: string, format: string, metadata?: Record<string, any>): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO pages (url, content, format, metadata, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(url, content, format, metadata ? JSON.stringify(metadata) : null);
    return result.lastInsertRowid as number;
  }

  /**
   * Récupère une page par URL
   */
  getPageByUrl(url: string): StorageEntry | null {
    const stmt = this.db.prepare('SELECT * FROM pages WHERE url = ?');
    const row = stmt.get(url) as any;

    if (!row) return null;

    return {
      id: row.id,
      url: row.url,
      content: row.content,
      format: row.format,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Récupère une page par ID
   */
  getPageById(id: number): StorageEntry | null {
    const stmt = this.db.prepare('SELECT * FROM pages WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      url: row.url,
      content: row.content,
      format: row.format,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supprime une page
   */
  deletePage(urlOrId: string | number): boolean {
    let stmt;
    if (typeof urlOrId === 'number') {
      stmt = this.db.prepare('DELETE FROM pages WHERE id = ?');
    } else {
      stmt = this.db.prepare('DELETE FROM pages WHERE url = ?');
    }

    const result = stmt.run(urlOrId);
    return result.changes > 0;
  }

  /**
   * Recherche dans les pages
   */
  searchPages(query: string, limit: number = 10): StorageEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pages
      WHERE content LIKE ? OR url LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(`%${query}%`, `%${query}%`, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      url: row.url,
      content: row.content,
      format: row.format,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Liste toutes les pages
   */
  listPages(limit: number = 100): StorageEntry[] {
    const stmt = this.db.prepare('SELECT * FROM pages ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];

    return rows.map(row => ({
      id: row.id,
      url: row.url,
      content: row.content,
      format: row.format,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Compte le nombre de pages
   */
  countPages(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM pages');
    const result = stmt.get() as any;
    return result.count;
  }

  /**
   * Ferme la base de données
   */
  close(): void {
    this.db.close();
  }
}
