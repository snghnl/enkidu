import matter from 'gray-matter';
import { NoteFrontmatter } from '../../types/note.js';

/**
 * Parse markdown file with frontmatter
 */
export function parseFrontmatter(content: string): { frontmatter: NoteFrontmatter; content: string } {
  const { data, content: body } = matter(content);

  return {
    frontmatter: data as NoteFrontmatter,
    content: body,
  };
}

/**
 * Stringify frontmatter and content to markdown
 */
export function stringifyFrontmatter(frontmatter: NoteFrontmatter, content: string): string {
  return matter.stringify(content, frontmatter);
}

/**
 * Update frontmatter in existing markdown content
 */
export function updateFrontmatter(
  content: string,
  updates: Partial<NoteFrontmatter>
): string {
  const { data, content: body } = matter(content);
  const updatedFrontmatter = { ...data, ...updates };

  return matter.stringify(body, updatedFrontmatter);
}

/**
 * Extract frontmatter without parsing content
 */
export function extractFrontmatter(content: string): NoteFrontmatter {
  const { data } = matter(content);
  return data as NoteFrontmatter;
}

/**
 * Check if content has frontmatter
 */
export function hasFrontmatter(content: string): boolean {
  return content.trimStart().startsWith('---');
}

/**
 * Create default frontmatter for a note
 */
export function createDefaultFrontmatter(
  title: string,
  options: {
    category?: string;
    type?: 'note' | 'daily' | 'blog';
    tags?: string[];
  } = {}
): NoteFrontmatter {
  const now = new Date().toISOString();

  return {
    title,
    created: now,
    updated: now,
    tags: options.tags || [],
    category: options.category || 'misc',
    type: options.type || 'note',
    publish: false,
  };
}
