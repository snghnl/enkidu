import { join, basename, dirname } from "path";
import { copyFile, fileExists, ensureDir } from "../../utils/fs.js";

/**
 * Extract image references from markdown content
 */
export function extractImageReferences(content: string): string[] {
  const images: string[] = [];

  // Match markdown images: ![alt](path)
  const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
  let match;

  while ((match = markdownImageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  // Match HTML images: <img src="path">
  const htmlImageRegex = /<img[^>]+src="([^">]+)"/g;

  while ((match = htmlImageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  return images;
}

/**
 * Copy asset file to Docusaurus static directory
 */
export function copyAsset(
  sourcePath: string,
  targetDir: string,
  enkiduRoot: string,
): { success: boolean; targetPath?: string; error?: string } {
  try {
    // Resolve source path (could be relative to Enkidu root)
    let resolvedSource = sourcePath;
    if (!sourcePath.startsWith("/")) {
      // Try attachments directory first
      resolvedSource = join(enkiduRoot, "attachments", sourcePath);

      if (!fileExists(resolvedSource)) {
        // Try relative to Enkidu root
        resolvedSource = join(enkiduRoot, sourcePath);
      }
    }

    if (!fileExists(resolvedSource)) {
      return {
        success: false,
        error: `Asset not found: ${sourcePath}`,
      };
    }

    // Create target directory if needed
    ensureDir(targetDir);

    // Copy file
    const filename = basename(resolvedSource);
    const targetPath = join(targetDir, filename);

    copyFile(resolvedSource, targetPath);

    return {
      success: true,
      targetPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update image paths in content for Docusaurus
 */
export function updateImagePaths(
  content: string,
  imageMapping: Map<string, string>,
): string {
  let updatedContent = content;

  for (const [originalPath, newPath] of imageMapping.entries()) {
    // Update markdown images
    const markdownRegex = new RegExp(
      `!\\[([^\\]]*)\\]\\(${escapeRegex(originalPath)}\\)`,
      "g",
    );
    updatedContent = updatedContent.replace(markdownRegex, `![$1](${newPath})`);

    // Update HTML images
    const htmlRegex = new RegExp(
      `<img([^>]+)src="${escapeRegex(originalPath)}"`,
      "g",
    );
    updatedContent = updatedContent.replace(
      htmlRegex,
      `<img$1src="${newPath}"`,
    );
  }

  return updatedContent;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Copy all assets referenced in a note
 */
export function copyNoteAssets(
  content: string,
  enkiduRoot: string,
  targetDir: string,
): {
  updatedContent: string;
  copiedAssets: string[];
  errors: string[];
} {
  const images = extractImageReferences(content);
  const imageMapping = new Map<string, string>();
  const copiedAssets: string[] = [];
  const errors: string[] = [];

  for (const imagePath of images) {
    // Skip external URLs
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      continue;
    }

    const result = copyAsset(imagePath, targetDir, enkiduRoot);

    if (result.success && result.targetPath) {
      // Map to Docusaurus static path
      const filename = basename(result.targetPath);
      const docusaurusPath = `/img/${filename}`;
      imageMapping.set(imagePath, docusaurusPath);
      copiedAssets.push(result.targetPath);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  const updatedContent = updateImagePaths(content, imageMapping);

  return {
    updatedContent,
    copiedAssets,
    errors,
  };
}
