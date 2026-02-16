import { Command } from "commander";
import chalk from "chalk";
import { join } from "path";
import { homedir } from "os";
import { getConfigManager } from "../core/config/manager.js";
import { ErrorHandler } from "../utils/errors.js";
import { logger, initLogger } from "../utils/logger.js";
import { ProgressIndicator } from "../utils/spinner.js";
import { Prompts } from "../utils/prompts.js";

export const initCommand = new Command("init")
  .description("Initialize Enkidu in the current or specified directory")
  .option(
    "-d, --dir <directory>",
    "Directory to initialize (default: ~/enkidu)",
  )
  .action(async (options) => {
    try {
      console.log();
      console.log(chalk.bold.cyan("Welcome to Enkidu! 📚"));
      console.log(chalk.gray("Personal Knowledge Management System"));
      console.log();

      // Prompt for configuration
      const rootDir =
        options.dir ||
        (await Prompts.input({
          message: "Where would you like to store your Enkidu notes?",
          default: join(homedir(), "enkidu"),
        }));

      const editor = await Prompts.select({
        message: "Select your preferred editor:",
        choices: [
          { name: "VS Code", value: "code" },
          { name: "Vim", value: "vim" },
          { name: "Neovim", value: "nvim" },
          { name: "Nano", value: "nano" },
          { name: "Emacs", value: "emacs" },
          { name: "System default", value: "default" },
        ],
        default: "code",
      });

      const syncTarget = await Prompts.input({
        message: "Path to your Docusaurus blog directory (optional):",
        default: "",
      });

      const manager = getConfigManager();

      // Check if already initialized
      logger.debug("Checking if already initialized", { rootDir });
      const isInitialized = await manager.loadConfig(rootDir).then(
        () => true,
        () => false,
      );

      if (isInitialized) {
        const overwrite = await Prompts.confirm({
          message:
            "Enkidu is already initialized in this directory. Overwrite?",
          default: false,
          warning: true,
        });

        if (!overwrite) {
          console.log(chalk.yellow("Initialization cancelled."));
          return;
        }
      }

      // Initialize with progress indicator
      const progress = new ProgressIndicator([
        "Creating directory structure",
        "Setting up configuration",
        "Creating default templates",
        "Initializing cache",
      ]);

      progress.start();

      // Initialize with user inputs
      const config = await manager.initConfig(rootDir, {
        editor: editor === "default" ? process.env.EDITOR || "vim" : editor,
        sync: {
          target: syncTarget,
          enabled: Boolean(syncTarget),
          include: ["blog/**/*.md"],
          exclude: ["**/drafts/**"],
          publishField: "publish",
          transformFrontmatter: true,
          copyAssets: true,
          assetsPath: syncTarget ? join(syncTarget, "..", "static", "img") : "",
        },
      });

      progress.nextStep();
      progress.nextStep();
      progress.nextStep();
      progress.complete(chalk.green("✓ Enkidu initialized successfully!"));

      // Initialize logger for this workspace
      initLogger(config.rootDir);
      logger.info("Enkidu initialized", { rootDir: config.rootDir });

      // Display success message
      console.log();
      console.log(chalk.bold("Directory:"), chalk.cyan(config.rootDir));
      console.log();
      console.log(chalk.bold("Directory structure created:"));
      console.log(chalk.gray("  📁 daily/          - Daily notes"));
      console.log(chalk.gray("  📁 notes/          - General notes"));
      console.log(chalk.gray("    📁 projects/     - Project notes"));
      console.log(chalk.gray("    📁 reference/    - Reference materials"));
      console.log(chalk.gray("    📁 ideas/        - Ideas and brainstorming"));
      console.log(chalk.gray("    📁 misc/         - Miscellaneous"));
      console.log(
        chalk.gray("  📁 blog/           - Blog posts (publishable)"),
      );
      console.log(chalk.gray("  📁 attachments/    - Images and files"));
      console.log(chalk.gray("  📁 .enkidu/        - Configuration and cache"));
      console.log();
      console.log(chalk.bold.cyan("Next steps:"));
      console.log(
        chalk.white("  1. Create your first daily note:"),
        chalk.cyan("enkidu daily"),
      );
      console.log(
        chalk.white("  2. Create a new note:           "),
        chalk.cyan('enkidu note create "My First Note"'),
      );
      console.log(
        chalk.white("  3. View configuration:          "),
        chalk.cyan("enkidu config list"),
      );
      console.log();
    } catch (error) {
      logger.error("Failed to initialize Enkidu", error);
      ErrorHandler.handle(error);
    }
  });
