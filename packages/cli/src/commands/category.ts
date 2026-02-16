import { Command } from 'commander';
import { NoteManager } from '../core/note/manager.js';
import { ConfigManager } from '../core/config/manager.js';

export const categoryCommand = new Command('category')
  .description('Manage categories');

// Subcommand: list
categoryCommand
  .command('list')
  .description('List all categories')
  .action(async () => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const categories = await noteManager.getAllCategories();

      if (categories.length === 0) {
        console.log('No categories found.');
        return;
      }

      console.log(`\nCategories (${categories.length}):\n`);

      for (const category of categories) {
        console.log(`  ${category}`);
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: move
categoryCommand
  .command('move')
  .description('Move a note to a different category')
  .argument('<slug>', 'Note slug or path')
  .argument('<category>', 'Target category')
  .action(async (slug: string, category: string) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const note = await noteManager.moveNoteToCategory(slug, category);

      console.log(`✓ Moved "${note.frontmatter.title}" to category "${category}"`);
      console.log(`  New path: ${note.filePath}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
