import { join, basename } from "path";
import { Note } from "../../types/note.js";
import { EnkiduConfig } from "../config/schema.js";
import { writeFile, copyFile, ensureDir } from "../../utils/fs.js";
import { stringifyFrontmatter } from "../note/frontmatter.js";
import { transformToDocusaurusBlog } from "./transformer.js";
import { copyNoteAssets } from "./assets.js";
import { validateSyncConfig, getPublishableNotes } from "./validator.js";

export interface SyncResult {
  success: boolean;
  syncedNotes: string[];
  errors: string[];
  copiedAssets: string[];
  dryRun: boolean;
}

export interface SyncOptions {
  dryRun?: boolean;
  force?: boolean;
  noteSlug?: string;
}

export class DocusaurusSync {
  private config: EnkiduConfig;
  private enkiduRoot: string;

  constructor(config: EnkiduConfig, enkiduRoot: string) {
    this.config = config;
    this.enkiduRoot = enkiduRoot;
  }

  /**
   * Sync all publishable notes to Docusaurus
   */
  async syncAll(notes: Note[], options: SyncOptions = {}): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedNotes: [],
      errors: [],
      copiedAssets: [],
      dryRun: options.dryRun || false,
    };

    // Validate configuration
    const validation = validateSyncConfig(this.config);
    if (!validation.valid) {
      result.success = false;
      result.errors.push(...validation.errors);
      return result;
    }

    // Get publishable notes
    const publishableNotes = getPublishableNotes(notes, this.config);

    if (publishableNotes.length === 0) {
      result.errors.push(
        'No publishable notes found. Set "publish: true" in frontmatter.',
      );
      return result;
    }

    // Sync each note
    for (const note of publishableNotes) {
      try {
        const syncResult = await this.syncNote(note, options);

        if (syncResult.success) {
          result.syncedNotes.push(note.slug);
          result.copiedAssets.push(...syncResult.copiedAssets);
        } else {
          result.errors.push(...syncResult.errors);
        }
      } catch (error) {
        result.errors.push(
          `Error syncing ${note.slug}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Sync a single note to Docusaurus
   */
  async syncNote(note: Note, options: SyncOptions = {}): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedNotes: [],
      errors: [],
      copiedAssets: [],
      dryRun: options.dryRun || false,
    };

    try {
      // Transform frontmatter
      let transformedFrontmatter = note.frontmatter;
      if (this.config.sync.transformFrontmatter) {
        transformedFrontmatter = transformToDocusaurusBlog(note.frontmatter);
      }

      // Handle assets
      let content = note.content;
      if (this.config.sync.copyAssets && this.config.sync.assetsPath) {
        const assetsResult = copyNoteAssets(
          content,
          this.enkiduRoot,
          this.config.sync.assetsPath,
        );

        content = assetsResult.updatedContent;
        result.copiedAssets = assetsResult.copiedAssets;

        if (assetsResult.errors.length > 0) {
          result.errors.push(...assetsResult.errors);
        }

        if (!options.dryRun) {
          // Actually copy assets
          // (copyNoteAssets already does this)
        }
      }

      // Generate output filename
      const outputFilename = this.generateOutputFilename(note);
      const outputPath = join(this.config.sync.target, outputFilename);

      // Create markdown content
      const outputContent = stringifyFrontmatter(
        transformedFrontmatter,
        content,
      );

      if (!options.dryRun) {
        // Ensure target directory exists
        ensureDir(this.config.sync.target);

        // Write file
        writeFile(outputPath, outputContent);
      }

      result.syncedNotes.push(note.slug);
      result.success = true;
    } catch (error) {
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return result;
  }

  /**
   * Generate output filename for synced note
   */
  private generateOutputFilename(note: Note): string {
    // For blog posts, use date-based filename if available
    if (note.frontmatter.type === "blog" && note.frontmatter.created) {
      const date = new Date(note.frontmatter.created);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}-${note.slug}.md`;
    }

    // For other notes, use slug
    return `${note.slug}.md`;
  }
}
