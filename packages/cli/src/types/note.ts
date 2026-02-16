export interface NoteFrontmatter {
  title: string;
  created: string;
  updated: string;
  tags: string[];
  category: string;
  type: 'note' | 'daily' | 'blog';
  publish?: boolean;
  [key: string]: any; // Allow additional custom fields
}

export interface Note {
  slug: string;
  filePath: string;
  frontmatter: NoteFrontmatter;
  content: string;
  rawContent: string; // Content with frontmatter
}

export interface NoteListOptions {
  category?: string;
  tag?: string;
  type?: 'note' | 'daily' | 'blog';
  limit?: number;
}

export interface NoteCreateOptions {
  category?: string;
  template?: string;
  type?: 'note' | 'daily' | 'blog';
  tags?: string[];
}
