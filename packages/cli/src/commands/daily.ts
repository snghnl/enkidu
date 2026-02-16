import { Command } from 'commander';
import { NoteManager } from '../core/note/manager.js';
import { getConfigManager, ConfigManager } from '../core/config/manager.js';
import { parseDate, formatDateForDisplay, getMonthRange, parseMonth } from '../utils/date.js';
import { openInEditor } from '../utils/editor.js';

export const dailyCommand = new Command('daily')
  .description('Manage daily notes')
  .argument('[date]', 'Date (today, yesterday, tomorrow, or YYYY-MM-DD)', 'today')
  .action(async (dateArg: string) => {
    try {
      // Find PKM root
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      // Load config and create note manager
      const configManager = getConfigManager();
      await configManager.loadConfig(pkmRoot);
      const config = configManager.getConfig();

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      // Parse date
      const date = parseDate(dateArg);

      // Get or create daily note
      const { note, created } = await noteManager.getDailyNote(date);

      if (created) {
        console.log(`✓ Created daily note for ${formatDateForDisplay(date)}`);
      } else {
        console.log(`Daily note for ${formatDateForDisplay(date)}`);
      }

      // Open in editor if configured
      if (config.daily.openInEditor) {
        await openInEditor(note.filePath, config.editor);
      } else {
        console.log(`Path: ${note.filePath}`);
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: append
dailyCommand
  .command('append')
  .description('Append content to today\'s daily note')
  .argument('<content>', 'Content to append')
  .action(async (content: string) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const today = new Date();
      const note = await noteManager.appendToDailyNote(today, content);

      console.log(`✓ Appended to daily note`);
      console.log(`Path: ${note.filePath}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: list
dailyCommand
  .command('list')
  .description('List daily notes')
  .option('--month <YYYY-MM>', 'Filter by month')
  .option('--limit <number>', 'Limit number of results', '10')
  .action(async (options) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (options.month) {
        const monthDate = parseMonth(options.month);
        const range = getMonthRange(monthDate);
        startDate = range.start;
        endDate = range.end;
      }

      const notes = await noteManager.listDailyNotes(startDate, endDate);
      const limit = parseInt(options.limit, 10);
      const limited = notes.slice(0, limit);

      if (limited.length === 0) {
        console.log('No daily notes found.');
        return;
      }

      console.log(`\nDaily Notes (showing ${limited.length} of ${notes.length}):\n`);

      for (const note of limited) {
        const date = new Date(note.frontmatter.date);
        console.log(`  ${formatDateForDisplay(date)} - ${note.frontmatter.title}`);
      }

      if (notes.length > limit) {
        console.log(`\n... and ${notes.length - limit} more`);
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
