import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import { SearchDocument, SearchCache } from '../../types/search.js';

const CACHE_VERSION = '1.0.0';

export class SearchCacheManager {
  /**
   * Save search index to cache
   */
  async saveCache(
    documents: SearchDocument[],
    cachePath: string
  ): Promise<void> {
    const cache: SearchCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      documents,
    };

    // Ensure cache directory exists
    const dir = dirname(cachePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write cache file
    writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  }

  /**
   * Load search index from cache
   */
  async loadCache(cachePath: string): Promise<SearchDocument[] | null> {
    if (!existsSync(cachePath)) {
      return null;
    }

    try {
      const content = readFileSync(cachePath, 'utf-8');
      const cache: SearchCache = JSON.parse(content);

      // Validate cache version
      if (cache.version !== CACHE_VERSION) {
        console.warn('Cache version mismatch. Invalidating cache.');
        this.invalidate(cachePath);
        return null;
      }

      return cache.documents;
    } catch (error) {
      console.error('Failed to load search cache:', error);
      return null;
    }
  }

  /**
   * Invalidate cache
   */
  invalidate(cachePath: string): void {
    if (existsSync(cachePath)) {
      unlinkSync(cachePath);
    }
  }

  /**
   * Check if cache is valid
   */
  isValid(cachePath: string, maxAge: number = 24 * 60 * 60 * 1000): boolean {
    if (!existsSync(cachePath)) {
      return false;
    }

    try {
      const stats = statSync(cachePath);
      const age = Date.now() - stats.mtimeMs;

      if (age > maxAge) {
        return false;
      }

      // Validate cache content
      const content = readFileSync(cachePath, 'utf-8');
      const cache: SearchCache = JSON.parse(content);

      return cache.version === CACHE_VERSION;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache age in milliseconds
   */
  getCacheAge(cachePath: string): number | null {
    if (!existsSync(cachePath)) {
      return null;
    }

    try {
      const stats = statSync(cachePath);
      return Date.now() - stats.mtimeMs;
    } catch (error) {
      return null;
    }
  }
}
