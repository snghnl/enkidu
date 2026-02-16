import { Command } from "commander";
import { NoteManager } from "../core/note/manager.js";
import { getConfigManager, ConfigManager } from "../core/config/manager.js";
import { DocusaurusSync } from "../core/sync/docusaurus.js";
import inquirer from "inquirer";
import { join } from "path";

export const syncCommand = new Command("sync")
  .description("Sync publishable notes to Docusaurus")
  .argument("[slug]", "Specific note to sync (optional)")
  .option("--dry-run", "Preview changes without writing files")
  .option("-f, --force", "Force sync even if target exists")
  .action(async (slug: string | undefined, options) => {
    try {
      const enkiduRoot = ConfigManager.findEnkiduRoot();
      if (!enkiduRoot) {
        console.error('Enkidu not initialized. Run "enkidu init" first.');
        process.exit(1);
      }

      const configManager = getConfigManager();
      await configManager.loadConfig(enkiduRoot);
      const config = configManager.getConfig();

      // Check if sync is configured
      if (!config.sync.target) {
        console.error("Sync target not configured.");
        console.error('Run "enkidu sync config" to set up Docusaurus sync.');
        process.exit(1);
      }

      const noteManager = new NoteManager(enkiduRoot);
      await noteManager.initialize();

      const docusaurusSync = new DocusaurusSync(config, enkiduRoot);

      if (options.dryRun) {
        console.log("🔍 Dry run mode - no files will be written\n");
      }

      // Sync specific note or all publishable notes
      let notes;
      if (slug) {
        const note = await noteManager.readNote(slug);
        notes = [note];
      } else {
        // Get all notes
        const allNotes = await noteManager.listNotes();
        notes = allNotes;
      }

      // Perform sync
      console.log("Syncing to Docusaurus...\n");
      const result = await docusaurusSync.syncAll(notes, {
        dryRun: options.dryRun,
        force: options.force,
      });

      // Display results
      if (result.syncedNotes.length > 0) {
        console.log(`✓ Synced ${result.syncedNotes.length} note(s):`);
        for (const noteSlug of result.syncedNotes) {
          console.log(`  - ${noteSlug}`);
        }
      } else {
        console.log("No notes synced.");
      }

      if (result.copiedAssets.length > 0) {
        console.log(`\n✓ Copied ${result.copiedAssets.length} asset(s)`);
      }

      if (result.errors.length > 0) {
        console.log("\n⚠ Errors:");
        for (const error of result.errors) {
          console.log(`  - ${error}`);
        }
      }

      if (options.dryRun) {
        console.log("\n💡 Run without --dry-run to actually sync files");
      } else {
        console.log(`\n✓ Synced to: ${config.sync.target}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: config
syncCommand
  .command("config")
  .description("Configure Docusaurus sync settings")
  .action(async () => {
    try {
      const enkiduRoot = ConfigManager.findEnkiduRoot();
      if (!enkiduRoot) {
        console.error('Enkidu not initialized. Run "enkidu init" first.');
        process.exit(1);
      }

      const configManager = getConfigManager();
      await configManager.loadConfig(enkiduRoot);
      const config = configManager.getConfig();

      console.log("\n📝 Configure Docusaurus Sync\n");

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "target",
          message: "Docusaurus blog directory path:",
          default: config.sync.target,
        },
        {
          type: "input",
          name: "assetsPath",
          message: "Docusaurus static/img directory path:",
          default:
            config.sync.assetsPath ||
            join(config.sync.target, "..", "static", "img"),
        },
        {
          type: "confirm",
          name: "enabled",
          message: "Enable sync?",
          default: true,
        },
        {
          type: "confirm",
          name: "transformFrontmatter",
          message: "Transform frontmatter to Docusaurus format?",
          default: true,
        },
        {
          type: "confirm",
          name: "copyAssets",
          message: "Copy images and assets?",
          default: true,
        },
      ]);

      // Update config
      await configManager.setConfigValue("sync.target", answers.target);
      await configManager.setConfigValue("sync.assetsPath", answers.assetsPath);
      await configManager.setConfigValue("sync.enabled", answers.enabled);
      await configManager.setConfigValue(
        "sync.transformFrontmatter",
        answers.transformFrontmatter,
      );
      await configManager.setConfigValue("sync.copyAssets", answers.copyAssets);

      console.log("\n✓ Sync configuration updated!");
      console.log("\nNext steps:");
      console.log(
        '  1. Mark notes for publishing: Add "publish: true" to frontmatter',
      );
      console.log("  2. Preview sync: enkidu sync --dry-run");
      console.log("  3. Sync notes: enkidu sync");
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: status
syncCommand
  .command("status")
  .description("Show sync status and publishable notes")
  .action(async () => {
    try {
      const enkiduRoot = ConfigManager.findEnkiduRoot();
      if (!enkiduRoot) {
        console.error('Enkidu not initialized. Run "enkidu init" first.');
        process.exit(1);
      }

      const configManager = getConfigManager();
      await configManager.loadConfig(enkiduRoot);
      const config = configManager.getConfig();

      const noteManager = new NoteManager(enkiduRoot);
      await noteManager.initialize();

      console.log("\n📊 Sync Status\n");
      console.log(`Enabled: ${config.sync.enabled ? "✓ Yes" : "✗ No"}`);
      console.log(`Target: ${config.sync.target || "(not configured)"}`);
      console.log(
        `Assets Path: ${config.sync.assetsPath || "(not configured)"}`,
      );

      // Find publishable notes
      const allNotes = await noteManager.listNotes();
      const publishableNotes = allNotes.filter(
        (note) => note.frontmatter.publish === true,
      );

      console.log(`\nPublishable Notes: ${publishableNotes.length}\n`);

      if (publishableNotes.length > 0) {
        for (const note of publishableNotes) {
          console.log(`  ✓ ${note.slug}`);
          console.log(`    ${note.frontmatter.title}`);
          console.log(
            `    ${note.frontmatter.category} • ${note.frontmatter.tags.join(", ")}`,
          );
          console.log();
        }
      } else {
        console.log("  No notes marked for publishing.");
        console.log('  Add "publish: true" to note frontmatter to publish.');
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
