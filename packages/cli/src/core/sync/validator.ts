import { Note } from "../../types/note.js";
import { EnkiduConfig } from "../config/schema.js";
import { fileExists } from "../../utils/fs.js";

/**
 * Get all publishable notes
 */
export function getPublishableNotes(
  notes: Note[],
  config: EnkiduConfig,
): Note[] {
  const publishField = config.sync.publishField;

  return notes.filter((note) => {
    // Check publish field
    if (!note.frontmatter[publishField]) {
      return false;
    }

    // Apply include patterns
    if (config.sync.include.length > 0) {
      const matches = config.sync.include.some((pattern) => {
        // Simple glob matching (blog/** matches blog/anything)
        const regex = new RegExp(
          "^" + pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$",
        );
        return regex.test(note.filePath);
      });

      if (!matches) {
        return false;
      }
    }

    // Apply exclude patterns
    if (config.sync.exclude.length > 0) {
      const excluded = config.sync.exclude.some((pattern) => {
        const regex = new RegExp(
          "^" + pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$",
        );
        return regex.test(note.filePath);
      });

      if (excluded) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Validate sync configuration
 */
export function validateSyncConfig(config: EnkiduConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.sync.enabled) {
    errors.push("Sync is not enabled in configuration");
  }

  if (!config.sync.target || config.sync.target.trim() === "") {
    errors.push("Sync target directory not configured");
  }

  if (config.sync.target && !fileExists(config.sync.target)) {
    errors.push(`Sync target directory does not exist: ${config.sync.target}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
