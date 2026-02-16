import Fuse, { IFuseOptions } from "fuse.js";
import { Note } from "../../types/note.js";
import { SearchDocument } from "../../types/search.js";

export const fuseOptions: IFuseOptions<SearchDocument> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "content", weight: 0.3 },
    { name: "tags", weight: 0.2 },
    { name: "category", weight: 0.1 },
  ],
  threshold: 0.4, // 0 = exact, 1 = match anything
  includeScore: true,
  includeMatches: true, // For highlighting
  minMatchCharLength: 2,
  ignoreLocation: true, // Search entire content
};

export class SearchIndexer {
  private fuse: Fuse<SearchDocument> | null = null;
  private documents: SearchDocument[] = [];

  /**
   * Build search index from all notes
   */
  async buildIndex(notes: Note[]): Promise<Fuse<SearchDocument>> {
    this.documents = notes.map((note) => this.noteToDocument(note));
    this.fuse = new Fuse(this.documents, fuseOptions);
    return this.fuse;
  }

  /**
   * Add note to index (incremental)
   */
  addToIndex(note: Note): void {
    if (!this.fuse) {
      throw new Error("Index not built. Call buildIndex() first.");
    }

    const document = this.noteToDocument(note);
    this.documents.push(document);

    // Rebuild Fuse index with updated documents
    this.fuse.setCollection(this.documents);
  }

  /**
   * Remove note from index
   */
  removeFromIndex(slug: string): void {
    if (!this.fuse) {
      throw new Error("Index not built. Call buildIndex() first.");
    }

    this.documents = this.documents.filter((doc) => doc.slug !== slug);
    this.fuse.setCollection(this.documents);
  }

  /**
   * Update note in index
   */
  updateInIndex(note: Note): void {
    this.removeFromIndex(note.slug);
    this.addToIndex(note);
  }

  /**
   * Get the Fuse instance
   */
  getFuse(): Fuse<SearchDocument> {
    if (!this.fuse) {
      throw new Error("Index not built. Call buildIndex() first.");
    }
    return this.fuse;
  }

  /**
   * Get all indexed documents
   */
  getDocuments(): SearchDocument[] {
    return this.documents;
  }

  /**
   * Convert a Note to a SearchDocument
   */
  private noteToDocument(note: Note): SearchDocument {
    return {
      slug: note.slug,
      title: note.frontmatter.title,
      content: note.content,
      tags: note.frontmatter.tags,
      category: note.frontmatter.category,
      type: note.frontmatter.type,
      created: note.frontmatter.created,
      updated: note.frontmatter.updated,
      filePath: note.filePath,
    };
  }
}
