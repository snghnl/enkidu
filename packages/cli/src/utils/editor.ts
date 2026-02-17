import { execa } from "execa";
import { fileExists } from "./fs.js";
import { mkdir } from "node:fs/promises";

/**
 * Detect editor from config or environment
 */
export function detectEditor(configEditor?: string): string {
  // Priority: config > $EDITOR > fallbacks
  if (configEditor) {
    return configEditor;
  }

  if (process.env.EDITOR) {
    return process.env.EDITOR;
  }

  // Common fallbacks
  const fallbacks = ["vim", "vi", "nano", "code", "emacs"];

  for (const editor of fallbacks) {
    try {
      // Try to find editor in PATH
      return editor;
    } catch {
      continue;
    }
  }

  return "vi"; // Last resort
}

/**
 * Open file in editor
 */
export async function openInEditor(
  filePath: string,
  content?: string,
  editor?: string,
): Promise<void> {
  if (!fileExists(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const editorCmd = detectEditor(editor);
  const contentArg = content ? content : "";

  try {
    await execa(editorCmd, [filePath], { stdio: "inherit" });
  } catch (error) {
    throw new Error(
      `Failed to open editor: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Open file in editor and wait for it to close
 */
export async function editFile(
  filePath: string,
  editor?: string,
): Promise<void> {
  await openInEditor(filePath, editor);
}
