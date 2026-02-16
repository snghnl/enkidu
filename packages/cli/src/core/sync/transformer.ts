import { NoteFrontmatter } from "../../types/note.js";
import { format } from "date-fns";

/**
 * Transform Enkidu frontmatter to Docusaurus blog post format
 */
export function transformToDocusaurusBlog(frontmatter: NoteFrontmatter): any {
  const docusaurusFrontmatter: any = {
    title: frontmatter.title,
    date: frontmatter.created,
    tags: frontmatter.tags || [],
  };

  // Add authors field (default or from frontmatter)
  if (frontmatter.authors) {
    docusaurusFrontmatter.authors = frontmatter.authors;
  } else {
    docusaurusFrontmatter.authors = ["default"];
  }

  // Add description if available
  if (frontmatter.description) {
    docusaurusFrontmatter.description = frontmatter.description;
  }

  // Add slug if specified
  if (frontmatter.slug) {
    docusaurusFrontmatter.slug = frontmatter.slug;
  }

  // Add image if available
  if (frontmatter.image) {
    docusaurusFrontmatter.image = frontmatter.image;
  }

  // Remove Enkidu-specific fields
  // Don't include: category, type, publish, updated

  return docusaurusFrontmatter;
}

/**
 * Transform Enkidu frontmatter to Docusaurus docs format
 */
export function transformToDocusaurusDocs(frontmatter: NoteFrontmatter): any {
  const docusaurusFrontmatter: any = {
    title: frontmatter.title,
    tags: frontmatter.tags || [],
  };

  // Add sidebar position if specified
  if (frontmatter.sidebar_position) {
    docusaurusFrontmatter.sidebar_position = frontmatter.sidebar_position;
  }

  // Add sidebar label if specified
  if (frontmatter.sidebar_label) {
    docusaurusFrontmatter.sidebar_label = frontmatter.sidebar_label;
  }

  // Add description if available
  if (frontmatter.description) {
    docusaurusFrontmatter.description = frontmatter.description;
  }

  return docusaurusFrontmatter;
}

/**
 * Convert date to Docusaurus-compatible format
 */
export function formatDateForDocusaurus(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd");
  } catch {
    return dateString;
  }
}
