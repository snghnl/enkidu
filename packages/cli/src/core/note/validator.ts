import { z } from 'zod';

export const noteFrontmatterSchema = z.object({
  title: z.string(),
  created: z.string(),
  updated: z.string(),
  tags: z.array(z.string()),
  category: z.string(),
  type: z.enum(['note', 'daily', 'blog']),
  publish: z.boolean().optional(),
}).passthrough(); // Allow additional fields

export function validateNoteFrontmatter(data: any): boolean {
  try {
    noteFrontmatterSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function validateNoteTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (title.length > 200) {
    return { valid: false, error: 'Title is too long (max 200 characters)' };
  }

  // Check for invalid filename characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
  if (invalidChars.test(title)) {
    return { valid: false, error: 'Title contains invalid characters' };
  }

  return { valid: true };
}
