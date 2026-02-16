import { join, basename } from "path";
import type {
  WikiLink,
  LinkIndexEntry,
  LinkReference,
  BrokenLink,
  LinkGraph,
  LinkNode,
  LinkEdge,
} from "../../types/link.js";
import {
  readFile,
  writeFile,
  fileExists,
  listFilesRecursive,
} from "../../utils/fs.js";
import { parseFrontmatter } from "../note/frontmatter.js";
import { extractWikiLinks } from "./parser.js";
import { resolveWikiLink } from "./resolver.js";

/**
 * Link Index - manages the graph of links between notes
 */
export class LinkIndex {
  private index: Map<string, LinkIndexEntry> = new Map();
  private enkiduRoot: string;

  constructor(enkiduRoot: string) {
    this.enkiduRoot = enkiduRoot;
  }

  /**
   * Build full link index by scanning all notes
   */
  async buildIndex(): Promise<Map<string, LinkIndexEntry>> {
    this.index.clear();

    // Get all markdown files
    const allFiles = this.getAllMarkdownFiles();

    // First pass: collect all outgoing links
    for (const filePath of allFiles) {
      const slug = this.getSlugFromPath(filePath);

      try {
        const content = readFile(filePath);
        const links = extractWikiLinks(content);

        this.index.set(slug, {
          slug,
          filePath,
          outgoingLinks: links,
          incomingLinks: [],
        });
      } catch (error) {
        console.warn(`Failed to index ${filePath}:`, error);
      }
    }

    // Second pass: build incoming links (backlinks)
    for (const [sourceSlug, entry] of this.index.entries()) {
      for (const link of entry.outgoingLinks) {
        // Resolve the link target to a slug
        const targetSlug = this.resolveTargetSlug(link.target);

        if (targetSlug && this.index.has(targetSlug)) {
          const targetEntry = this.index.get(targetSlug)!;
          targetEntry.incomingLinks.push({
            sourceSlug,
            sourcePath: entry.filePath,
            link,
          });
        }
      }
    }

    return this.index;
  }

  /**
   * Get backlinks for a specific note
   */
  getBacklinks(slug: string): LinkReference[] {
    const entry = this.index.get(slug);
    return entry?.incomingLinks || [];
  }

  /**
   * Get outgoing links for a specific note
   */
  getOutgoingLinks(slug: string): WikiLink[] {
    const entry = this.index.get(slug);
    return entry?.outgoingLinks || [];
  }

  /**
   * Find all broken links across all notes
   */
  findBrokenLinks(): BrokenLink[] {
    const brokenLinks: BrokenLink[] = [];

    for (const [slug, entry] of this.index.entries()) {
      for (const link of entry.outgoingLinks) {
        const resolved = resolveWikiLink(link.target, this.enkiduRoot);

        if (!resolved.exists) {
          brokenLinks.push({
            sourceSlug: slug,
            sourcePath: entry.filePath,
            link,
            suggestions: resolved.suggestions,
          });
        }
      }
    }

    return brokenLinks;
  }

  /**
   * Get link statistics
   */
  getStatistics() {
    let totalLinks = 0;
    let brokenLinksCount = 0;
    const brokenLinks = this.findBrokenLinks();

    for (const entry of this.index.values()) {
      totalLinks += entry.outgoingLinks.length;
    }

    brokenLinksCount = brokenLinks.length;

    return {
      totalNotes: this.index.size,
      totalLinks,
      brokenLinks: brokenLinksCount,
      validLinks: totalLinks - brokenLinksCount,
    };
  }

  /**
   * Export link graph for visualization
   */
  exportGraph(): LinkGraph {
    const nodes: LinkNode[] = [];
    const edges: LinkEdge[] = [];
    const addedEdges = new Set<string>(); // Prevent duplicates

    for (const [slug, entry] of this.index.entries()) {
      // Add node
      const title = this.getNoteTitleFromPath(entry.filePath);
      nodes.push({
        id: slug,
        label: title || slug,
        path: entry.filePath,
      });

      // Add edges for outgoing links
      for (const link of entry.outgoingLinks) {
        const targetSlug = this.resolveTargetSlug(link.target);

        if (targetSlug && this.index.has(targetSlug)) {
          const edgeKey = `${slug}->${targetSlug}`;
          if (!addedEdges.has(edgeKey)) {
            edges.push({
              source: slug,
              target: targetSlug,
              type: "wiki",
            });
            addedEdges.add(edgeKey);
          }
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Save index cache to file
   */
  async saveCache(cachePath: string): Promise<void> {
    const cacheData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      index: Array.from(this.index.entries()),
    };

    writeFile(cachePath, JSON.stringify(cacheData, null, 2));
  }

  /**
   * Load index cache from file
   */
  async loadCache(cachePath: string): Promise<boolean> {
    if (!fileExists(cachePath)) {
      return false;
    }

    try {
      const content = readFile(cachePath);
      const cacheData = JSON.parse(content);

      // Validate cache version
      if (cacheData.version !== "1.0.0") {
        return false;
      }

      // Reconstruct index
      this.index.clear();
      for (const [slug, entry] of cacheData.index) {
        this.index.set(slug, entry);
      }

      return true;
    } catch (error) {
      console.warn("Failed to load cache:", error);
      return false;
    }
  }

  /**
   * Check if cache is still valid
   */
  async isCacheValid(cachePath: string): Promise<boolean> {
    if (!fileExists(cachePath)) {
      return false;
    }

    try {
      const content = readFile(cachePath);
      const cacheData = JSON.parse(content);
      const cacheTime = new Date(cacheData.timestamp).getTime();
      const now = Date.now();

      // Cache is valid for 1 hour
      const maxAge = 60 * 60 * 1000;

      if (now - cacheTime > maxAge) {
        return false;
      }

      // Check if any files have been modified since cache
      // For simplicity, we'll just check file count
      const currentFiles = this.getAllMarkdownFiles();
      const cachedFiles = cacheData.index.length;

      return currentFiles.length === cachedFiles;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all notes that have no incoming links (orphans)
   */
  getOrphanedNotes(): string[] {
    const orphans: string[] = [];

    for (const [slug, entry] of this.index.entries()) {
      if (entry.incomingLinks.length === 0) {
        orphans.push(slug);
      }
    }

    return orphans;
  }

  /**
   * Get most linked notes
   */
  getMostLinkedNotes(
    limit: number = 10,
  ): Array<{ slug: string; count: number }> {
    const linkCounts = new Map<string, number>();

    for (const [slug, entry] of this.index.entries()) {
      linkCounts.set(slug, entry.incomingLinks.length);
    }

    return Array.from(linkCounts.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Private helper methods

  private getAllMarkdownFiles(): string[] {
    const files: string[] = [];

    try {
      const notesPath = join(this.enkiduRoot, "notes");
      if (fileExists(notesPath)) {
        files.push(...listFilesRecursive(notesPath, ".md"));
      }

      const blogPath = join(this.enkiduRoot, "blog");
      if (fileExists(blogPath)) {
        files.push(...listFilesRecursive(blogPath, ".md"));
      }

      const dailyPath = join(this.enkiduRoot, "daily");
      if (fileExists(dailyPath)) {
        files.push(...listFilesRecursive(dailyPath, ".md"));
      }
    } catch (error) {
      // Silently handle errors
    }

    return files;
  }

  private getSlugFromPath(filePath: string): string {
    // For daily notes, include the date path
    if (filePath.includes("/daily/")) {
      const parts = filePath.split("/daily/")[1];
      const dateMatch = parts.match(/(\d{4})\/(\d{2})\/(\d{2})\.md/);
      if (dateMatch) {
        return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }
    }

    return basename(filePath, ".md");
  }

  private resolveTargetSlug(target: string): string | null {
    const resolved = resolveWikiLink(target, this.enkiduRoot);

    if (resolved.exists && resolved.resolvedPath) {
      return this.getSlugFromPath(resolved.resolvedPath);
    }

    return null;
  }

  private getNoteTitleFromPath(filePath: string): string | null {
    try {
      const content = readFile(filePath);
      const { frontmatter } = parseFrontmatter(content);
      return frontmatter.title || null;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Create and build a new link index
 */
export async function buildLinkIndex(enkiduRoot: string): Promise<LinkIndex> {
  const index = new LinkIndex(enkiduRoot);
  await index.buildIndex();
  return index;
}

/**
 * Load cached index or build new one
 */
export async function loadOrBuildLinkIndex(
  enkiduRoot: string,
  cachePath?: string,
): Promise<LinkIndex> {
  const index = new LinkIndex(enkiduRoot);

  if (cachePath) {
    const cacheValid = await index.isCacheValid(cachePath);

    if (cacheValid) {
      const loaded = await index.loadCache(cachePath);
      if (loaded) {
        return index;
      }
    }
  }

  // Build fresh index
  await index.buildIndex();

  // Save cache if path provided
  if (cachePath) {
    await index.saveCache(cachePath);
  }

  return index;
}
