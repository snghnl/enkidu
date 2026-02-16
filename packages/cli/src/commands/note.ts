import { Command } from "commander";
import chalk from "chalk";
import { NoteManager } from "../core/note/manager.js";
import { getConfigManager, ConfigManager } from "../core/config/manager.js";
import { openInEditor } from "../utils/editor.js";
import { ErrorHandler } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { spinner } from "../utils/spinner.js";
import { prompts } from "../utils/prompts.js";

export const noteCommand = new Command("note").description("Manage notes");

// Subcommand: create
noteCommand
  .command("create")
  .description("Create a new note")
  .argument("<title>", "Note title")
  .option(
    "-c, --category <category>",
    "Category (e.g., projects, reference, ideas)",
  )
  .option("-t, --template <template>", "Template to use")
  .option("--tag <tags...>", "Tags (space-separated)")
  .option("--blog", "Create as blog post")
  .action(async (title: string, options) => {
    try {
      const enkiduRoot = ConfigManager.findEnkiduRoot();
      if (!enkiduRoot) {
        throw ErrorHandler.notInitialized();
      }

      logger.debug("Creating note", { title, options });

      const configManager = getConfigManager();
      await configManager.loadConfig(enkiduRoot);
      const config = configManager.getConfig();

      const noteManager = new NoteManager(enkiduRoot);
      await noteManager.initialize();

      // Create note with spinner
      const note = await spinner.run(
        `Creating note "${title}"...`,
        async () =>
          await noteManager.createNote(title, {
            category: options.category,
            template: options.template,
            type: options.blog ? "blog" : "note",
            tags: options.tag,
          }),
        { successText: chalk.green(`✓ Created note: ${title}`) },
      );

      console.log(chalk.gray(`  Path: ${note.filePath}`));
      console.log(chalk.gray(`  Slug: ${note.slug}`));

      logger.info("Note created successfully", { slug: note.slug });

      // Open in editor
      logger.debug("Opening in editor", { editor: config.editor });
      await openInEditor(note.filePath, config.editor);
    } catch (error) {
      logger.error("Failed to create note", error);
      ErrorHandler.handle(error);
    }
  });

// Subcommand: edit
noteCommand
  .command("edit")
  .description("Edit an existing note")
  .argument("<slug>", "Note slug or path")
  .action(async (slug: string) => {
    try {
      const enkiduRoot = ConfigManager.findEnkiduRoot();
      if (!enkiduRoot) {
        throw ErrorHandler.notInitialized();
      }

      logger.debug("Editing note", { slug });

      const configManager = getConfigManager();
      await configManager.loadConfig(enkiduRoot);
      const config = configManager.getConfig();

      const noteManager = new NoteManager(enkiduRoot);
      await noteManager.initialize();

      // Read note with spinner
      const note = await spinner.run(
        "Loading note...",
        async () => {
          try {
            return await noteManager.readNote(slug);
          } catch (error) {
            throw ErrorHandler.notFound("Note", slug, [
              'Check that the note exists with "enkidu note list"',
              "Verify the slug or file path is correct",
              'Use "enkidu search" to find the note',
            ]);
          }
        },
        { successText: chalk.green(`✓ Opening "${slug}"...`) },
      );

      logger.info("Opening note in editor", { slug: note.slug });
      await openInEditor(note.filePath, config.editor);
    } catch (error) {
      logger.error("Failed to edit note", error);
      ErrorHandler.handle(error);
    }
  });

// Subcommand: show
noteCommand
  .command("show")
  .description("Show note details")
  .argument("<slug>", "Note slug or path")
  .action(async (slug: string) => {
    try {
      const enkiduRoot = ConfigManager.findEnkiduRoot();
      if (!enkiduRoot) {
        throw ErrorHandler.notInitialized();
      }

      logger.debug("Showing note details", { slug });

      const noteManager = new NoteManager(enkiduRoot);
      await noteManager.initialize();

      // Read note
      const note = await spinner.run("Loading note...", async () => {
        try {
          return await noteManager.readNote(slug);
        } catch (error) {
          throw ErrorHandler.notFound("Note", slug);
        }
      });

      // Display note details
      console.log();
      console.log(chalk.bold.cyan(note.frontmatter.title));
      console.log(chalk.gray("=".repeat(note.frontmatter.title.length)));
      console.log();
      console.log(chalk.white("Path:    "), chalk.gray(note.filePath));
      console.log(chalk.white("Slug:    "), chalk.cyan(note.slug));
      console.log(
        chalk.white("Type:    "),
        chalk.yellow(note.frontmatter.type),
      );
      console.log(
        chalk.white("Category:"),
        chalk.blue(note.frontmatter.category),
      );
      console.log(
        chalk.white("Tags:    "),
        note.frontmatter.tags.length > 0
          ? note.frontmatter.tags.map((t) => chalk.green(`#${t}`)).join(", ")
          : chalk.gray("none"),
      );
      console.log(
        chalk.white("Created: "),
        new Date(note.frontmatter.created).toLocaleString(),
      );
      console.log(
        chalk.white("Updated: "),
        new Date(note.frontmatter.updated).toLocaleString(),
      );
      console.log(
        chalk.white("Publish: "),
        note.frontmatter.publish ? chalk.green("yes") : chalk.gray("no"),
      );
      console.log();

      logger.debug("Note details displayed", { slug: note.slug });
    } catch (error) {
      logger.error("Failed to show note", error);
      ErrorHandler.handle(error);
    }
  });

// Subcommand: list
noteCommand
  .command("list")
  .description("List notes")
  .option("-c, --category <category>", "Filter by category")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("--blog", "Show only blog posts")
  .option("--limit <number>", "Limit number of results", "20")
  .action(async (options) => {
    try {
      const enkiduRoot = ConfigManager.findEnkiduRoot();
      if (!enkiduRoot) {
        throw ErrorHandler.notInitialized();
      }

      logger.debug("Listing notes", { options });

      const noteManager = new NoteManager(enkiduRoot);
      await noteManager.initialize();

      // List notes with spinner
      const notes = await spinner.run(
        "Loading notes...",
        async () =>
          await noteManager.listNotes({
            category: options.category,
            tag: options.tag,
            type: options.blog ? "blog" : undefined,
            limit: parseInt(options.limit, 10),
          }),
      );

      if (notes.length === 0) {
        console.log();
        console.log(chalk.yellow("No notes found."));
        console.log();
        console.log(chalk.cyan("Tip:"), "Create your first note with:");
        console.log(chalk.gray('  enkidu note create "My First Note"'));
        console.log();
        return;
      }

      console.log();
      console.log(
        chalk.bold(
          `Found ${notes.length} note${notes.length === 1 ? "" : "s"}:`,
        ),
      );
      console.log();

      for (const note of notes) {
        const tags =
          note.frontmatter.tags.length > 0
            ? " " +
              note.frontmatter.tags.map((t) => chalk.green(`#${t}`)).join(" ")
            : "";

        console.log(chalk.cyan(`  ${note.slug}`));
        console.log(`    ${chalk.white(note.frontmatter.title)}${tags}`);
        console.log(
          chalk.gray(
            `    ${note.frontmatter.category} • Updated: ${new Date(note.frontmatter.updated).toLocaleDateString()}`,
          ),
        );
        console.log();
      }

      logger.info("Listed notes", { count: notes.length });
    } catch (error) {
      logger.error("Failed to list notes", error);
      ErrorHandler.handle(error);
    }
  });

// Subcommand: delete
noteCommand
  .command("delete")
  .description("Delete a note")
  .argument("<slug>", "Note slug or path")
  .option("-y, --yes", "Skip confirmation")
  .action(async (slug: string, options) => {
    try {
      const enkiduRoot = ConfigManager.findEnkiduRoot();
      if (!enkiduRoot) {
        throw ErrorHandler.notInitialized();
      }

      logger.debug("Deleting note", { slug, skipConfirm: options.yes });

      const noteManager = new NoteManager(enkiduRoot);
      await noteManager.initialize();

      // Read note
      const note = await spinner.run("Loading note...", async () => {
        try {
          return await noteManager.readNote(slug);
        } catch (error) {
          throw ErrorHandler.notFound("Note", slug);
        }
      });

      // Confirm deletion (unless --yes flag)
      if (!options.yes) {
        const confirmed = await prompts.confirmDelete(
          note.frontmatter.title,
          "note",
        );

        if (!confirmed) {
          console.log(chalk.yellow("Cancelled."));
          return;
        }
      }

      // Delete with spinner
      await spinner.run(
        `Deleting "${note.frontmatter.title}"...`,
        async () => await noteManager.deleteNote(slug),
        { successText: chalk.green(`✓ Deleted: ${note.frontmatter.title}`) },
      );

      logger.info("Note deleted", { slug: note.slug });
    } catch (error) {
      logger.error("Failed to delete note", error);
      ErrorHandler.handle(error);
    }
  });
