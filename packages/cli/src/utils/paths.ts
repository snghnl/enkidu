import { join, resolve, relative, isAbsolute } from "path";
import { homedir } from "os";

/**
 * Resolve tilde (~) in paths
 */
export function resolveTilde(path: string): string {
  if (path.startsWith("~/") || path === "~") {
    return join(homedir(), path.slice(2));
  }
  return path;
}

/**
 * Resolve path relative to Enkidu root
 */
export function resolvePkmPath(pkmRoot: string, ...paths: string[]): string {
  return resolve(pkmRoot, ...paths);
}

/**
 * Get relative path from Enkidu root
 */
export function getRelativePath(pkmRoot: string, absolutePath: string): string {
  return relative(pkmRoot, absolutePath);
}

/**
 * Normalize path (resolve and remove trailing slashes)
 */
export function normalizePath(path: string): string {
  const resolved = resolveTilde(path);
  return resolve(resolved);
}

/**
 * Check if path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  return isAbsolute(path);
}

/**
 * Join paths safely
 */
export function joinPaths(...paths: string[]): string {
  return join(...paths);
}
