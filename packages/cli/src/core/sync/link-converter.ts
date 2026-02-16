import { dirname, relative, join, basename } from "path";
import type { WikiLink } from "../../types/link.js";
import { extractWikiLinks, replaceWikiLinks } from "../link/parser.js";
import { resolveWikiLink } from "../link/resolver.js";
import { readFile } from "../../utils/fs.js";
import { parseFrontmatter } from "../note/frontmatter.js";

/**
 * Convert wiki-links to markdown links for Docusaurus compatibility
 * Converts [[note-name]] to [Note Title](../path/to/note.md)
 */
export function convertWikiLinksToMarkdown(
  content: string,
  sourceFilePath: string,
  pkmRoot: string,
  options: LinkConversionOptions = {},
): string {
  return replaceWikiLinks(content, (link) => {
    return convertSingleWikiLink(link, sourceFilePath, pkmRoot, options);
  });
}

export interface LinkConversionOptions {
  /**
   * How to handle broken links
   * - 'keep': Keep as wiki-link format (default)
   * - 'text': Convert to plain text
   * - 'remove': Remove the link entirely
   */
  brokenLinkStrategy?: "keep" | "text" | "remove";

  /**
   * Base path for relative links (for Docusaurus)
   */
  basePath?: string;

  /**
   * Whether to use absolute paths
   */
  useAbsolutePaths?: boolean;
}

/**
 * Convert a single wiki-link to markdown format
 */
function convertSingleWikiLink(
  link: WikiLink,
  sourceFilePath: string,
  pkmRoot: string,
  options: LinkConversionOptions,
): string {
  const {
    brokenLinkStrategy = "keep",
    basePath = "",
    useAbsolutePaths = false,
  } = options;

  // Resolve the link
  const resolved = resolveWikiLink(link.target, pkmRoot);

  // Handle broken links
  if (!resolved.exists || !resolved.resolvedPath) {
    switch (brokenLinkStrategy) {
      case "text":
        return link.displayText || link.target;
      case "remove":
        return "";
      case "keep":
      default:
        return link.raw; // Keep original wiki-link
    }
  }

  // Get the note title for the link text
  const linkText = link.displayText || getNoteTitle(resolved.resolvedPath);

  // Calculate relative path from source to target
  let linkPath: string;

  if (useAbsolutePaths) {
    // Use absolute path from basePath
    const relativeFromRoot = relative(pkmRoot, resolved.resolvedPath);
    linkPath = join(basePath, relativeFromRoot).replace(/\\/g, "/");
  } else {
    // Use relative path from source file
    const sourceDir = dirname(sourceFilePath);
    linkPath = relative(sourceDir, resolved.resolvedPath).replace(/\\/g, "/");
  }

  // Ensure .md extension
  if (!linkPath.endsWith(".md")) {
    linkPath += ".md";
  }

  // Create markdown link
  return `[${linkText}](${linkPath})`;
}

/**
 * Get note title from frontmatter or filename
 */
function getNoteTitle(filePath: string): string {
  try {
    const content = readFile(filePath);
    const { frontmatter } = parseFrontmatter(content);

    if (frontmatter.title) {
      return frontmatter.title;
    }
  } catch (error) {
    // Fallback to filename
  }

  // Use filename without extension
  const filename = basename(filePath, ".md");
  // Convert kebab-case to Title Case
  return filename
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Convert markdown links back to wiki-links
 * Useful for importing content back into PKM
 */
export function convertMarkdownLinksToWiki(
  content: string,
  sourceFilePath: string,
): string {
  // Match markdown links: [text](path)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return content.replace(markdownLinkRegex, (match, text, path) => {
    // Skip external links
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return match;
    }

    // Skip anchor links
    if (path.startsWith("#")) {
      return match;
    }

    // Resolve path to absolute
    const sourceDir = dirname(sourceFilePath);
    const absolutePath = join(sourceDir, path);

    // Get slug from path
    const slug = basename(absolutePath, ".md");

    // Create wiki-link
    return `[[${slug}|${text}]]`;
  });
}

/**
 * Extract all links from content (both wiki and markdown)
 */
export function extractAllLinks(content: string): {
  wikiLinks: WikiLink[];
  markdownLinks: Array<{ text: string; url: string }>;
} {
  const wikiLinks = extractWikiLinks(content);

  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const markdownLinks: Array<{ text: string; url: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    markdownLinks.push({
      text: match[1],
      url: match[2],
    });
  }

  return {
    wikiLinks,
    markdownLinks,
  };
}

/**
 * Validate that all links in content can be resolved
 */
export function validateLinks(
  content: string,
  pkmRoot: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const links = extractWikiLinks(content);

  for (const link of links) {
    const resolved = resolveWikiLink(link.target, pkmRoot);

    if (!resolved.exists) {
      const lineInfo = link.line ? ` (line ${link.line})` : "";
      let errorMsg = `Broken link: [[${link.target}]]${lineInfo}`;

      if (resolved.suggestions && resolved.suggestions.length > 0) {
        errorMsg += ` - Did you mean: ${resolved.suggestions[0]}?`;
      }

      errors.push(errorMsg);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Process content for sync: convert links and handle assets
 */
export function processSyncContent(
  content: string,
  sourceFilePath: string,
  pkmRoot: string,
  options: LinkConversionOptions = {},
): string {
  // Convert wiki-links to markdown links
  let processed = convertWikiLinksToMarkdown(
    content,
    sourceFilePath,
    pkmRoot,
    options,
  );

  // Additional processing can be added here:
  // - Image path conversion
  // - Asset references
  // - Embed blocks

  return processed;
}
