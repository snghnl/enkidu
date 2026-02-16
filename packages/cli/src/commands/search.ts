import { Command } from 'commander';
import { join } from 'path';
import chalk from 'chalk';
import { NoteManager } from '../core/note/manager.js';
import { SearchIndexer } from '../core/search/indexer.js';
import { SearchCacheManager } from '../core/search/cache.js';
import { Searcher } from '../core/search/searcher.js';
import { getConfigManager, ConfigManager } from '../core/config/manager.js';
import { formatDistanceToNow } from 'date-fns';

export const searchCommand = new Command('search')
  .description('Search across all notes')
  .argument('<query>', 'Search query')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('--type <type>', 'Filter by type (note|daily|blog)')
  .option('--from <date>', 'Filter by start date (YYYY-MM-DD)')
  .option('--to <date>', 'Filter by end date (YYYY-MM-DD)')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('--title-only', 'Search in titles only')
  .option('--no-cache', 'Disable cache and rebuild index')
  .action(async (query: string, options) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "enkidu init" first.');
        process.exit(1);
      }

      const configManager = getConfigManager();
      await configManager.loadConfig(pkmRoot);

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      // Prepare cache path
      const cachePath = join(pkmRoot, '.enkidu', 'cache', 'search.json');
      const cacheManager = new SearchCacheManager();

      // Build or load search index
      const indexer = new SearchIndexer();
      let useCache = options.cache !== false;

      if (useCache && cacheManager.isValid(cachePath)) {
        // Load from cache
        const documents = await cacheManager.loadCache(cachePath);
        if (documents) {
          await indexer.buildIndex(
            documents.map(doc => ({
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
              rawContent: '',
            }))
          );
        }
      } else {
        // Build fresh index
        const notes = await noteManager.listNotes();
        await indexer.buildIndex(notes);

        // Save to cache
        if (useCache) {
          await cacheManager.saveCache(indexer.getDocuments(), cachePath);
        }
      }

      // Prepare search options
      const searchOptions: any = {
        query,
        limit: parseInt(options.limit, 10),
      };

      if (options.category) {
        searchOptions.category = options.category;
      }

      if (options.tag) {
        searchOptions.tag = options.tag;
      }

      if (options.type) {
        if (!['note', 'daily', 'blog'].includes(options.type)) {
          console.error('Invalid type. Must be: note, daily, or blog');
          process.exit(1);
        }
        searchOptions.type = options.type;
      }

      if (options.from) {
        searchOptions.dateFrom = new Date(options.from);
        if (isNaN(searchOptions.dateFrom.getTime())) {
          console.error('Invalid from date. Use format: YYYY-MM-DD');
          process.exit(1);
        }
      }

      if (options.to) {
        searchOptions.dateTo = new Date(options.to);
        if (isNaN(searchOptions.dateTo.getTime())) {
          console.error('Invalid to date. Use format: YYYY-MM-DD');
          process.exit(1);
        }
      }

      if (options.titleOnly) {
        searchOptions.titleOnly = true;
      }

      // Execute search
      const searcher = new Searcher(indexer.getFuse());
      const results = searcher.search(searchOptions);

      // Display results
      if (results.length === 0) {
        console.log(chalk.yellow('\nNo results found.'));
        return;
      }

      console.log(chalk.bold(`\nFound ${results.length} result${results.length === 1 ? '' : 's'}:\n`));

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const note = result.note;
        const score = ((1 - result.score) * 100).toFixed(0); // Convert to percentage

        // Format date
        const updatedDate = new Date(note.frontmatter.updated);
        const relativeDate = formatDistanceToNow(updatedDate, { addSuffix: true });

        // Header
        console.log(
          chalk.bold(`${i + 1}. ${note.frontmatter.title}`) +
          chalk.gray(` (score: ${score}%)`)
        );

        // Metadata
        console.log(
          chalk.cyan(`   ${note.frontmatter.category}`) +
          chalk.gray(` • ${note.frontmatter.type}`) +
          chalk.gray(` • ${relativeDate}`)
        );

        // Tags
        if (note.frontmatter.tags.length > 0) {
          console.log(
            chalk.gray('   tags: ') +
            note.frontmatter.tags.map(t => chalk.blue(`#${t}`)).join(' ')
          );
        }

        // Display snippets from matches
        const contentMatches = result.matches.filter(m => m.key === 'content' && m.snippet);
        if (contentMatches.length > 0) {
          console.log(chalk.gray('   ' + contentMatches[0].snippet));
        }

        // File path (for reference)
        console.log(chalk.gray(`   ${note.filePath}`));

        console.log(); // Empty line between results
      }

      // Search stats
      const stats = searcher.getStats();
      console.log(chalk.gray(`Searched across ${stats.totalDocuments} documents`));

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
