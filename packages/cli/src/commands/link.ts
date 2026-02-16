import { Command } from "commander";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager } from "../core/config/manager.js";
import { buildLinkIndex, loadOrBuildLinkIndex } from "../core/link/index.js";
import { resolveWikiLink } from "../core/link/resolver.js";

export const linkCommand = new Command("link").description(
  "Manage wiki-style links between notes",
);

// Subcommand: backlinks
linkCommand
  .command("backlinks")
  .description("Show backlinks to a note")
  .argument("<slug>", "Note slug")
  .action(async (slug: string) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error("PKM not initialized. Run 'enkidu init' first.");
        process.exit(1);
      }

      const spinner = ora("Building link index...").start();

      const cachePath = join(pkmRoot, ".enkidu", "cache", "links.json");
      const linkIndex = await loadOrBuildLinkIndex(pkmRoot, cachePath);

      spinner.succeed("Link index built");

      const backlinks = linkIndex.getBacklinks(slug);

      if (backlinks.length === 0) {
        console.log(
          chalk.yellow(`\nNo backlinks found for "${chalk.bold(slug)}"`),
        );
        return;
      }

      console.log(
        chalk.blue(`\n📎 Backlinks to "${chalk.bold(slug)}"`),
        chalk.gray(`(${backlinks.length})`),
      );
      console.log();

      for (const ref of backlinks) {
        const lineInfo = ref.link.line ? `:${ref.link.line}` : "";
        console.log(
          `  ${chalk.green("→")} ${chalk.cyan(ref.sourceSlug)}${chalk.gray(lineInfo)}`,
        );
        if (ref.link.displayText) {
          console.log(`    ${chalk.gray("Display:")} ${ref.link.displayText}`);
        }
      }
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Subcommand: show
linkCommand
  .command("show")
  .description("Show outgoing links from a note")
  .argument("<slug>", "Note slug")
  .action(async (slug: string) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error("PKM not initialized. Run 'enkidu init' first.");
        process.exit(1);
      }

      const spinner = ora("Building link index...").start();

      const cachePath = join(pkmRoot, ".enkidu", "cache", "links.json");
      const linkIndex = await loadOrBuildLinkIndex(pkmRoot, cachePath);

      spinner.succeed("Link index built");

      const outgoingLinks = linkIndex.getOutgoingLinks(slug);

      if (outgoingLinks.length === 0) {
        console.log(
          chalk.yellow(`\nNo outgoing links found in "${chalk.bold(slug)}"`),
        );
        return;
      }

      console.log(
        chalk.blue(`\n🔗 Links in "${chalk.bold(slug)}"`),
        chalk.gray(`(${outgoingLinks.length})`),
      );
      console.log();

      for (const link of outgoingLinks) {
        const resolved = resolveWikiLink(link.target, pkmRoot);
        const status = resolved.exists ? chalk.green("✓") : chalk.red("✗");
        const lineInfo = link.line ? chalk.gray(`:${link.line}`) : "";

        console.log(`  ${status} ${chalk.cyan(link.target)}${lineInfo}`);

        if (link.displayText) {
          console.log(`    ${chalk.gray("Display:")} ${link.displayText}`);
        }

        if (
          !resolved.exists &&
          resolved.suggestions &&
          resolved.suggestions.length > 0
        ) {
          console.log(
            `    ${chalk.gray("Suggestions:")} ${resolved.suggestions.join(", ")}`,
          );
        }
      }
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Subcommand: validate
linkCommand
  .command("validate")
  .description("Validate all links and find broken ones")
  .option("--fix", "Suggest fixes for broken links")
  .action(async (options) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error("PKM not initialized. Run 'enkidu init' first.");
        process.exit(1);
      }

      const spinner = ora("Building link index...").start();

      const linkIndex = await buildLinkIndex(pkmRoot);
      const stats = linkIndex.getStatistics();

      spinner.succeed(
        `Indexed ${chalk.cyan(stats.totalNotes)} notes with ${chalk.cyan(stats.totalLinks)} links`,
      );

      console.log();
      console.log(chalk.blue("📊 Link Statistics:"));
      console.log(`  Total notes: ${chalk.cyan(stats.totalNotes)}`);
      console.log(`  Total links: ${chalk.cyan(stats.totalLinks)}`);
      console.log(`  Valid links: ${chalk.green(stats.validLinks)}`);
      console.log(
        `  Broken links: ${stats.brokenLinks > 0 ? chalk.red(stats.brokenLinks) : chalk.green(stats.brokenLinks)}`,
      );

      const brokenLinks = linkIndex.findBrokenLinks();

      if (brokenLinks.length === 0) {
        console.log();
        console.log(chalk.green("✓ All links are valid!"));
        return;
      }

      console.log();
      console.log(
        chalk.red(
          `\n⚠️  Found ${chalk.bold(brokenLinks.length)} broken links:`,
        ),
      );
      console.log();

      for (const broken of brokenLinks) {
        const lineInfo = broken.link.line
          ? chalk.gray(`:${broken.link.line}`)
          : "";
        console.log(
          `  ${chalk.red("✗")} ${chalk.cyan(broken.sourceSlug)}${lineInfo}`,
        );
        console.log(
          `    ${chalk.gray("→")} ${chalk.yellow(broken.link.target)}`,
        );

        if (
          options.fix &&
          broken.suggestions &&
          broken.suggestions.length > 0
        ) {
          console.log(
            `    ${chalk.gray("Did you mean:")} ${chalk.green(broken.suggestions[0])}?`,
          );
        }
      }

      process.exit(1); // Exit with error code if broken links found
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Subcommand: stats
linkCommand
  .command("stats")
  .description("Show link statistics and insights")
  .action(async () => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error("PKM not initialized. Run 'enkidu init' first.");
        process.exit(1);
      }

      const spinner = ora("Analyzing links...").start();

      const cachePath = join(pkmRoot, ".enkidu", "cache", "links.json");
      const linkIndex = await loadOrBuildLinkIndex(pkmRoot, cachePath);

      const stats = linkIndex.getStatistics();
      const orphans = linkIndex.getOrphanedNotes();
      const mostLinked = linkIndex.getMostLinkedNotes(10);

      spinner.succeed("Analysis complete");

      console.log();
      console.log(chalk.blue("📊 Link Statistics:"));
      console.log(`  Total notes: ${chalk.cyan(stats.totalNotes)}`);
      console.log(`  Total links: ${chalk.cyan(stats.totalLinks)}`);
      console.log(`  Valid links: ${chalk.green(stats.validLinks)}`);
      console.log(
        `  Broken links: ${stats.brokenLinks > 0 ? chalk.red(stats.brokenLinks) : chalk.green(stats.brokenLinks)}`,
      );
      console.log(
        `  Orphaned notes: ${orphans.length > 0 ? chalk.yellow(orphans.length) : chalk.green(orphans.length)}`,
      );

      if (mostLinked.length > 0) {
        console.log();
        console.log(chalk.blue("🔝 Most Linked Notes:"));
        for (const { slug, count } of mostLinked) {
          if (count > 0) {
            console.log(
              `  ${chalk.cyan(slug)} ${chalk.gray(`(${count} backlinks)`)}`,
            );
          }
        }
      }

      if (orphans.length > 0 && orphans.length <= 10) {
        console.log();
        console.log(chalk.yellow("📌 Orphaned Notes (no backlinks):"));
        for (const slug of orphans) {
          console.log(`  ${chalk.gray("→")} ${chalk.cyan(slug)}`);
        }
      } else if (orphans.length > 10) {
        console.log();
        console.log(
          chalk.yellow(
            `📌 ${orphans.length} orphaned notes (use 'enkidu link graph' to see all)`,
          ),
        );
      }
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });
