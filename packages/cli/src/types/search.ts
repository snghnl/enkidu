import { Note } from "./note.js";

export interface SearchDocument {
  slug: string;
  title: string;
  content: string; // Full text content
  tags: string[];
  category: string;
  type: "note" | "daily" | "blog";
  created: string;
  updated: string;
  filePath: string;
}

export interface SearchOptions {
  query: string;
  category?: string;
  tag?: string;
  type?: "note" | "daily" | "blog";
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  titleOnly?: boolean;
}

export interface SearchResult {
  note: Note;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  key: string; // 'title', 'content', 'tags', 'category'
  value: string; // Matched text
  indices: readonly (readonly [number, number])[]; // Character positions
  snippet?: string; // Context snippet (for content)
}

export interface SearchCache {
  version: string;
  timestamp: number;
  documents: SearchDocument[];
}
