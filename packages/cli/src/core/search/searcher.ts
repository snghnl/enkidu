import Fuse from "fuse.js";
import { Note } from "../../types/note.js";
import {
  SearchDocument,
  SearchOptions,
  SearchResult,
  SearchMatch,
} from "../../types/search.js";

export class Searcher {
  constructor(private fuse: Fuse<SearchDocument>) {}

  /**
   * Execute search with filters
   */
  search(options: SearchOptions): SearchResult[] {
    const { query, category, tag, type, dateFrom, dateTo, limit, titleOnly } =
      options;

    // Perform fuzzy search
    let fuseResults = this.fuse.search(query);

    // Apply filters
    fuseResults = fuseResults.filter((result) => {
      const doc = result.item;

      // Category filter
      if (category && doc.category !== category) {
        return false;
      }

      // Tag filter
      if (tag && !doc.tags.includes(tag)) {
        return false;
      }

      // Type filter
      if (type && doc.type !== type) {
        return false;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const docDate = new Date(doc.updated);
        if (dateFrom && docDate < dateFrom) {
          return false;
        }
        if (dateTo && docDate > dateTo) {
          return false;
        }
      }

      return true;
    });

    // Filter matches if titleOnly is specified
    if (titleOnly) {
      fuseResults = fuseResults.filter((result) => {
        return result.matches?.some((match) => match.key === "title");
      });
    }

    // Apply limit
    if (limit) {
      fuseResults = fuseResults.slice(0, limit);
    }

    // Convert to SearchResult format
    return fuseResults.map((result) => {
      const matches: SearchMatch[] = (result.matches || []).map((match) => {
        const searchMatch: SearchMatch = {
          key: match.key || "",
          value: match.value || "",
          indices: match.indices || [],
        };

        // Generate snippet for content matches
        if (
          match.key === "content" &&
          match.value &&
          match.indices &&
          match.indices.length > 0
        ) {
          searchMatch.snippet = this.generateSnippet(
            match.value,
            match.indices,
            100,
          );
        }

        return searchMatch;
      });

      // Convert SearchDocument back to Note
      const note: Note = {
        slug: result.item.slug,
        filePath: result.item.filePath,
        frontmatter: {
          title: result.item.title,
          created: result.item.created,
          updated: result.item.updated,
          tags: result.item.tags,
          category: result.item.category,
          type: result.item.type,
        },
        content: result.item.content,
        rawContent: "", // Not needed for search results
      };

      return {
        note,
        score: result.score || 0,
        matches,
      };
    });
  }

  /**
   * Search title only
   */
  searchTitles(query: string, limit?: number): SearchResult[] {
    return this.search({
      query,
      titleOnly: true,
      limit,
    });
  }

  /**
   * Generate context snippet with highlighted matches
   */
  generateSnippet(
    content: string,
    indices: readonly (readonly [number, number])[],
    contextLength: number = 100,
  ): string {
    if (indices.length === 0) {
      return content.slice(0, contextLength) + "...";
    }

    // Get the first match
    const [start, end] = indices[0];

    // Calculate snippet boundaries
    const snippetStart = Math.max(0, start - Math.floor(contextLength / 2));
    const snippetEnd = Math.min(
      content.length,
      end + Math.floor(contextLength / 2),
    );

    // Extract snippet
    let snippet = content.slice(snippetStart, snippetEnd);

    // Add ellipsis
    if (snippetStart > 0) {
      snippet = "..." + snippet;
    }
    if (snippetEnd < content.length) {
      snippet = snippet + "...";
    }

    // Clean up whitespace
    snippet = snippet.replace(/\s+/g, " ").trim();

    return snippet;
  }

  /**
   * Get search statistics
   */
  getStats(): {
    totalDocuments: number;
  } {
    // Fuse.js doesn't expose a size method, so we get the collection
    const collection = (this.fuse as any)._docs || [];
    return {
      totalDocuments: collection.length,
    };
  }
}
