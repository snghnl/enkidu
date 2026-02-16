import { Command } from "commander";
import { join } from "path";
import chalk from "chalk";
import { formatDistanceToNow } from "date-fns";
import { NoteManager } from "../core/note/manager.js";
import { SearchIndexer } from "../core/search/indexer.js";
import { SearchCacheManager } from "../core/search/cache.js";
import { Searcher } from "../core/search/searcher.js";
import { getConfigManager, ConfigManager } from "../core/config/manager.js";
import { ErrorHandler } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { ProgressIndicator } from "../utils/spinner.js";

export const searchCommand = new Command("search")
  .description("Search across all notes")
  .argument("<query>", "Search query")
  .option("-c, --category <category>", "Filter by category")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("--type <type>", "Filter by type (note|daily|blog)")
  .option("--from <date>", "Filter by start date (YYYY-MM-DD)")
  .option("--to <date>", "Filter by end date (YYYY-MM-DD)")
  .option("-l, --limit <number>", "Limit number of results", "10")
  .option("--title-only", "Search in titles only")
  .option("--rebuild-index", "Rebuild search index")
  .action(async (query: string, options) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        throw ErrorHandler.notInitialized();
      }

      logger.debug("Starting search", { query, options });

      const configManager = getConfigManager();
      await configManager.loadConfig(pkmRoot);

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      // Validate query
      if (query.trim().length < 2) {
        throw ErrorHandler.invalidInput(
          "search query",
          query,
          "Query must be at least 2 characters long",
        );
      }

      // Validate type filter
      if (options.type && !["note", "daily", "blog"].includes(options.type)) {
        throw ErrorHandler.invalidInput(
          "type",
          options.type,
          "Type must be one of: note, daily, blog",
        );
      }

      // Validate date filters
      if (options.from) {
        const fromDate = new Date(options.from);
        if (isNaN(fromDate.getTime())) {
          throw ErrorHandler.invalidInput(
            "from date",
            options.from,
            "Date must be in format: YYYY-MM-DD",
          );
        }
      }

      if (options.to) {
        const toDate = new Date(options.to);
        if (isNaN(toDate.getTime())) {
          throw ErrorHandler.invalidInput(
            "to date",
            options.to,
            "Date must be in format: YYYY-MM-DD",
          );
        }
      }

      // Prepare cache path
      const cachePath = join(pkmRoot, ".enkidu", "cache", "search.json");
      const cacheManager = new SearchCacheManager();
      const indexer = new SearchIndexer();

      // Build or load search index with progress indicator
      const progress = new ProgressIndicator([
        "Loading search index",
        "Executing search",
      ]);

      progress.start();

      const useCache = !options.rebuildIndex;

      if (useCache && cacheManager.isValid(cachePath)) {
        // Load from cache
        logger.debug("Loading index from cache");
        progress.update("Loading search index from cache");

        const documents = await cacheManager.loadCache(cachePath);
        if (documents) {
          await indexer.buildIndex(
            documents.map((doc) => ({
              slug: doc.slug,
              filePath: doc.filePath,
              frontmatter: {
                title: doc.title,
                created: doc.created,
                updated: doc.updated,
                tags: doc.tags,
                category: doc.category,
                type: doc.type,
              },
              content: doc.content,
              rawContent: "",
            })),
          );
        }
      } else {
        // Build fresh index
        logger.debug("Building fresh index");
        progress.update("Building search index");

        const notes = await noteManager.listNotes();
        await indexer.buildIndex(notes);

        // Save to cache
        if (useCache) {
          logger.debug("Saving index to cache");
          await cacheManager.saveCache(indexer.getDocuments(), cachePath);
        }
      }

      progress.nextStep();

      // Prepare search options
      const searchOptions: any = {
        query,
        limit: parseInt(options.limit, 10),
      };

      if (options.category) searchOptions.category = options.category;
      if (options.tag) searchOptions.tag = options.tag;
      if (options.type) searchOptions.type = options.type;
      if (options.from) searchOptions.dateFrom = new Date(options.from);
      if (options.to) searchOptions.dateTo = new Date(options.to);
      if (options.titleOnly) searchOptions.titleOnly = true;

      // Execute search
      logger.debug("Executing search", { searchOptions });
      const searcher = new Searcher(indexer.getFuse());
      const results = searcher.search(searchOptions);

      progress.complete();

      // Display results
      console.log();

      if (results.length === 0) {
        console.log(chalk.yellow("No results found."));
        console.log();
        console.log(chalk.cyan("Tips:"));
        console.log(chalk.gray("  • Try different keywords"));
        console.log(chalk.gray("  • Use broader search terms"));
        console.log(chalk.gray("  • Check spelling"));
        console.log(
          chalk.gray("  • Search without filters to see all results"),
        );
        console.log();

        logger.info("Search completed with no results", { query });
        return;
      }

      console.log(
        chalk.bold(
          `Found ${results.length} result${results.length === 1 ? "" : "s"}:`,
        ),
      );
      console.log();

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const note = result.note;
        const score = ((1 - result.score) * 100).toFixed(0); // Convert to percentage

        // Format date
        const updatedDate = new Date(note.frontmatter.updated);
        const relativeDate = formatDistanceToNow(updatedDate, {
          addSuffix: true,
        });

        // Header
        console.log(
          chalk.bold(`${i + 1}. ${note.frontmatter.title}`) +
            chalk.gray(` (score: ${score}%)`),
        );

        // Metadata
        console.log(
          chalk.cyan(`   ${note.frontmatter.category}`) +
            chalk.gray(` • ${note.frontmatter.type}`) +
            chalk.gray(` • ${relativeDate}`),
        );

        // Tags
        if (note.frontmatter.tags.length > 0) {
          console.log(
            chalk.gray("   tags: ") +
              note.frontmatter.tags.map((t) => chalk.blue(`#${t}`)).join(" "),
          );
        }

        // Display snippets from matches
        const contentMatches = result.matches.filter(
          (m) => m.key === "content" && m.snippet,
        );
        if (contentMatches.length > 0) {
          console.log(chalk.gray("   " + contentMatches[0].snippet));
        }

        // File path (for reference)
        console.log(chalk.gray(`   ${note.filePath}`));

        console.log(); // Empty line between results
      }

      // Search stats
      const stats = searcher.getStats();
      console.log(
        chalk.gray(
          `Searched ${stats.totalDocuments} document${stats.totalDocuments === 1 ? "" : "s"}`,
        ),
      );
      console.log();

      logger.info("Search completed successfully", {
        query,
        resultCount: results.length,
        totalDocuments: stats.totalDocuments,
      });
    } catch (error) {
      logger.error("Search failed", error);
      ErrorHandler.handle(error);
    }
  });
