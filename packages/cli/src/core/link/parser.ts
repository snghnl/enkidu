import type { WikiLink } from "../../types/link.js";

/**
 * Regular expression to match wiki-links
 * Matches: [[note-name]] or [[note-name|Display Text]]
 */
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Extract all wiki-links from markdown content
 * @param content - Markdown content to parse
 * @returns Array of WikiLink objects
 */
export function extractWikiLinks(content: string): WikiLink[] {
  const links: WikiLink[] = [];
  const lines = content.split("\n");
  let currentIndex = 0;

  // Track line numbers for better error reporting
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    const lineStart = currentIndex;

    // Reset regex state
    WIKI_LINK_REGEX.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = WIKI_LINK_REGEX.exec(line)) !== null) {
      const raw = match[0];
      const target = match[1].trim();
      const displayText = match[2]?.trim();
      const startIndex = lineStart + match.index;
      const endIndex = startIndex + raw.length;

      links.push({
        raw,
        target,
        displayText,
        startIndex,
        endIndex,
        line: lineNumber + 1, // 1-indexed for user display
      });
    }

    currentIndex += line.length + 1; // +1 for newline
  }

  return links;
}

/**
 * Parse individual wiki-link string
 * @param linkText - The wiki-link text including brackets
 * @returns WikiLink object or null if invalid
 */
export function parseWikiLink(linkText: string): WikiLink | null {
  WIKI_LINK_REGEX.lastIndex = 0;
  const match = WIKI_LINK_REGEX.exec(linkText);

  if (!match) {
    return null;
  }

  return {
    raw: match[0],
    target: match[1].trim(),
    displayText: match[2]?.trim(),
    startIndex: 0,
    endIndex: match[0].length,
  };
}

/**
 * Replace wiki-links in content with custom replacements
 * @param content - Markdown content
 * @param replacer - Function to generate replacement text for each link
 * @returns Content with replaced links
 */
export function replaceWikiLinks(
  content: string,
  replacer: (link: WikiLink) => string,
): string {
  const links = extractWikiLinks(content);

  // Sort links by position in reverse order to avoid index shifting
  const sortedLinks = [...links].sort((a, b) => b.startIndex - a.startIndex);

  let result = content;
  for (const link of sortedLinks) {
    const replacement = replacer(link);
    result =
      result.slice(0, link.startIndex) +
      replacement +
      result.slice(link.endIndex);
  }

  return result;
}

/**
 * Validate if a string is a valid wiki-link
 * @param text - Text to validate
 * @returns True if valid wiki-link format
 */
export function isValidWikiLink(text: string): boolean {
  WIKI_LINK_REGEX.lastIndex = 0;
  const match = WIKI_LINK_REGEX.exec(text);
  return match?.[0] === text;
}

/**
 * Create a wiki-link string from components
 * @param target - Target note slug
 * @param displayText - Optional display text
 * @returns Formatted wiki-link string
 */
export function createWikiLink(target: string, displayText?: string): string {
  if (displayText) {
    return `[[${target}|${displayText}]]`;
  }
  return `[[${target}]]`;
}
