import { join, basename } from "path";
import type { WikiLink, ResolvedLink } from "../../types/link.js";
import { listFilesRecursive, fileExists } from "../../utils/fs.js";
import { slugify } from "../../utils/slug.js";

/**
 * Resolve a wiki-link to an actual file path
 * @param linkTarget - The target from the wiki-link (e.g., "note-name")
 * @param pkmRoot - Root directory of PKM system
 * @returns ResolvedLink with path if found
 */
export function resolveWikiLink(
  linkTarget: string,
  pkmRoot: string,
): ResolvedLink {
  const link: WikiLink = {
    raw: `[[${linkTarget}]]`,
    target: linkTarget,
    startIndex: 0,
    endIndex: linkTarget.length + 4,
  };

  const resolvedPath = findNoteByLink(linkTarget, pkmRoot);

  if (resolvedPath) {
    return {
      link,
      resolvedPath,
      exists: true,
    };
  }

  // Generate suggestions for broken links
  const suggestions = findSimilarNotes(linkTarget, pkmRoot);

  return {
    link,
    exists: false,
    suggestions,
  };
}

/**
 * Find note file by various matching strategies
 * @param target - Link target
 * @param pkmRoot - PKM root directory
 * @returns Absolute path to note file or null
 */
export function findNoteByLink(target: string, pkmRoot: string): string | null {
  // Get all markdown files
  const allFiles = getAllMarkdownFiles(pkmRoot);

  // Strategy 1: Exact slug match
  const exactMatch = allFiles.find((file) => {
    const slug = basename(file, ".md");
    return slug === target;
  });

  if (exactMatch) {
    return exactMatch;
  }

  // Strategy 2: Case-insensitive slug match
  const lowerTarget = target.toLowerCase();
  const caseInsensitiveMatch = allFiles.find((file) => {
    const slug = basename(file, ".md");
    return slug.toLowerCase() === lowerTarget;
  });

  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch;
  }

  // Strategy 3: Slugified match (in case target has spaces or special chars)
  const slugifiedTarget = slugify(target);
  const slugifiedMatch = allFiles.find((file) => {
    const slug = basename(file, ".md");
    return slug === slugifiedTarget || slug.toLowerCase() === slugifiedTarget;
  });

  if (slugifiedMatch) {
    return slugifiedMatch;
  }

  // Strategy 4: Daily note pattern (YYYY-MM-DD or YYYY/MM/DD)
  const dailyMatch = findDailyNote(target, pkmRoot);
  if (dailyMatch) {
    return dailyMatch;
  }

  return null;
}

/**
 * Find similar note names for suggestions
 * @param target - Link target
 * @param pkmRoot - PKM root directory
 * @param maxSuggestions - Maximum number of suggestions
 * @returns Array of similar note slugs
 */
export function findSimilarNotes(
  target: string,
  pkmRoot: string,
  maxSuggestions: number = 5,
): string[] {
  const allFiles = getAllMarkdownFiles(pkmRoot);
  const allSlugs = allFiles.map((file) => basename(file, ".md"));

  // Calculate similarity scores using Levenshtein distance
  const scored = allSlugs
    .map((slug) => ({
      slug,
      score: levenshteinDistance(target.toLowerCase(), slug.toLowerCase()),
    }))
    .filter((item) => item.score <= 5) // Only suggest if reasonably close
    .sort((a, b) => a.score - b.score)
    .slice(0, maxSuggestions);

  return scored.map((item) => item.slug);
}

/**
 * Get all markdown files in PKM directory
 * @param pkmRoot - PKM root directory
 * @returns Array of absolute file paths
 */
function getAllMarkdownFiles(pkmRoot: string): string[] {
  const files: string[] = [];

  try {
    // Search in notes directory
    const notesPath = join(pkmRoot, "notes");
    if (fileExists(notesPath)) {
      files.push(...listFilesRecursive(notesPath, ".md"));
    }

    // Search in blog directory
    const blogPath = join(pkmRoot, "blog");
    if (fileExists(blogPath)) {
      files.push(...listFilesRecursive(blogPath, ".md"));
    }

    // Search in daily directory
    const dailyPath = join(pkmRoot, "daily");
    if (fileExists(dailyPath)) {
      files.push(...listFilesRecursive(dailyPath, ".md"));
    }
  } catch (error) {
    // Silently handle errors
  }

  return files;
}

/**
 * Try to find daily note by date pattern
 * @param target - Link target (might be date format)
 * @param pkmRoot - PKM root directory
 * @returns Path to daily note or null
 */
function findDailyNote(target: string, pkmRoot: string): string | null {
  // Match patterns like: 2026-02-16, 2026/02/16, 20260216
  const datePatterns = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{4})\/(\d{2})\/(\d{2})$/, // YYYY/MM/DD
    /^(\d{4})(\d{2})(\d{2})$/, // YYYYMMDD
  ];

  for (const pattern of datePatterns) {
    const match = target.match(pattern);
    if (match) {
      const [, year, month, day] = match;
      const dailyPath = join(pkmRoot, "daily", year, month, `${day}.md`);

      if (fileExists(dailyPath)) {
        return dailyPath;
      }
    }
  }

  return null;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching suggestions
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Batch resolve multiple links
 * @param links - Array of WikiLinks
 * @param pkmRoot - PKM root directory
 * @returns Array of ResolvedLinks
 */
export function resolveWikiLinks(
  links: WikiLink[],
  pkmRoot: string,
): ResolvedLink[] {
  return links.map((link) => resolveWikiLink(link.target, pkmRoot));
}

/**
 * Check if a link target exists
 * @param target - Link target
 * @param pkmRoot - PKM root directory
 * @returns True if target note exists
 */
export function linkExists(target: string, pkmRoot: string): boolean {
  return findNoteByLink(target, pkmRoot) !== null;
}
