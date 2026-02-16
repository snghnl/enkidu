import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Read file contents as string
 */
export function readFile(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

/**
 * Write content to file (creates parent directories if needed)
 */
export function writeFile(path: string, content: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, content, 'utf-8');
}

/**
 * Delete file if it exists
 */
export function deleteFile(path: string): void {
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

/**
 * Check if file exists
 */
export function fileExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Ensure directory exists (create if needed)
 */
export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * List all files in directory recursively
 */
export function listFilesRecursive(dir: string, extension?: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...listFilesRecursive(fullPath, extension));
    } else if (stat.isFile()) {
      if (!extension || fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Get all files in a directory (non-recursive)
 */
export function listFiles(dir: string, extension?: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isFile()) {
      if (!extension || fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Copy file from source to destination
 */
export function copyFile(source: string, destination: string): void {
  const content = readFile(source);
  writeFile(destination, content);
}
