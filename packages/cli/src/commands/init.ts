import { Command } from "commander";
import { getConfigManager } from "../core/config/manager.js";
import inquirer from "inquirer";
import { join } from "path";
import { homedir } from "os";

export const initCommand = new Command("init")
  .description("Initialize Enkidu in the current or specified directory")
  .option(
    "-d, --dir <directory>",
    "Directory to initialize (default: ~/enkidu)",
  )
  .action(async (options) => {
    try {
      // Prompt for configuration
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "rootDir",
          message: "Where would you like to store your Enkidu notes?",
          default: options.dir || join(homedir(), "enkidu"),
        },
        {
          type: "input",
          name: "editor",
          message: "What editor would you like to use?",
          default: process.env.EDITOR || "vim",
        },
        {
          type: "input",
          name: "syncTarget",
          message: "Path to your Docusaurus blog directory (optional):",
          default: "",
        },
      ]);

      const manager = getConfigManager();

      // Check if already initialized
      const isInitialized = await manager.loadConfig(answers.rootDir).then(
        () => true,
        () => false,
      );

      if (isInitialized) {
        const { overwrite } = await inquirer.prompt([
          {
            type: "confirm",
            name: "overwrite",
            message:
              "Enkidu is already initialized in this directory. Overwrite?",
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log("Initialization cancelled.");
          return;
        }
      }

      // Initialize with user inputs
      const config = await manager.initConfig(answers.rootDir, {
        editor: answers.editor,
        sync: {
          target: answers.syncTarget,
          enabled: Boolean(answers.syncTarget),
          include: ["blog/**/*.md"],
          exclude: ["**/drafts/**"],
          publishField: "publish",
          transformFrontmatter: true,
          copyAssets: true,
          assetsPath: answers.syncTarget
            ? join(answers.syncTarget, "..", "static", "img")
            : "",
        },
      });

      console.log("\n✓ Enkidu initialized successfully!");
      console.log(`\nDirectory: ${config.rootDir}`);
      console.log("\nDirectory structure created:");
      console.log("  📁 daily/          - Daily notes");
      console.log("  📁 notes/          - General notes");
      console.log("    📁 projects/     - Project notes");
      console.log("    📁 reference/    - Reference materials");
      console.log("    📁 ideas/        - Ideas and brainstorming");
      console.log("    📁 misc/         - Miscellaneous");
      console.log("  📁 blog/           - Blog posts (publishable)");
      console.log("  📁 attachments/    - Images and files");
      console.log("  📁 .enkidu/        - Configuration and cache");
      console.log("\nNext steps:");
      console.log("  1. Create your first daily note:  enkidu daily");
      console.log(
        '  2. Create a new note:              enkidu note create "My First Note"',
      );
      console.log("  3. View configuration:             enkidu config list");
    } catch (error) {
      console.error(
        "Error initializing Enkidu:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });
