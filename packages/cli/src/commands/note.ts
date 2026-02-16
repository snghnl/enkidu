import { Command } from 'commander';
import { NoteManager } from '../core/note/manager.js';
import { getConfigManager, ConfigManager } from '../core/config/manager.js';
import { openInEditor } from '../utils/editor.js';

export const noteCommand = new Command('note')
  .description('Manage notes');

// Subcommand: create
noteCommand
  .command('create')
  .description('Create a new note')
  .argument('<title>', 'Note title')
  .option('-c, --category <category>', 'Category (e.g., projects, reference, ideas)')
  .option('-t, --template <template>', 'Template to use')
  .option('--tag <tags...>', 'Tags (space-separated)')
  .option('--blog', 'Create as blog post')
  .action(async (title: string, options) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const configManager = getConfigManager();
      await configManager.loadConfig(pkmRoot);
      const config = configManager.getConfig();

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const note = await noteManager.createNote(title, {
        category: options.category,
        template: options.template,
        type: options.blog ? 'blog' : 'note',
        tags: options.tag,
      });

      console.log(`✓ Created note: ${title}`);
      console.log(`  Path: ${note.filePath}`);
      console.log(`  Slug: ${note.slug}`);

      // Open in editor
      await openInEditor(note.filePath, config.editor);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: edit
noteCommand
  .command('edit')
  .description('Edit an existing note')
  .argument('<slug>', 'Note slug or path')
  .action(async (slug: string) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const configManager = getConfigManager();
      await configManager.loadConfig(pkmRoot);
      const config = configManager.getConfig();

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const note = await noteManager.readNote(slug);
      await openInEditor(note.filePath, config.editor);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: show
noteCommand
  .command('show')
  .description('Show note details')
  .argument('<slug>', 'Note slug or path')
  .action(async (slug: string) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const note = await noteManager.readNote(slug);

      console.log(`\n${note.frontmatter.title}`);
      console.log('='.repeat(note.frontmatter.title.length));
      console.log(`\nPath: ${note.filePath}`);
      console.log(`Slug: ${note.slug}`);
      console.log(`Type: ${note.frontmatter.type}`);
      console.log(`Category: ${note.frontmatter.category}`);
      console.log(`Tags: ${note.frontmatter.tags.join(', ') || 'none'}`);
      console.log(`Created: ${new Date(note.frontmatter.created).toLocaleString()}`);
      console.log(`Updated: ${new Date(note.frontmatter.updated).toLocaleString()}`);
      console.log(`Publish: ${note.frontmatter.publish ? 'yes' : 'no'}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: list
noteCommand
  .command('list')
  .description('List notes')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('--blog', 'Show only blog posts')
  .option('--limit <number>', 'Limit number of results', '20')
  .action(async (options) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const notes = await noteManager.listNotes({
        category: options.category,
        tag: options.tag,
        type: options.blog ? 'blog' : undefined,
        limit: parseInt(options.limit, 10),
      });

      if (notes.length === 0) {
        console.log('No notes found.');
        return;
      }

      console.log(`\nNotes (${notes.length}):\n`);

      for (const note of notes) {
        const tags = note.frontmatter.tags.length > 0
          ? ` [${note.frontmatter.tags.join(', ')}]`
          : '';
        console.log(`  ${note.slug}`);
        console.log(`    ${note.frontmatter.title}${tags}`);
        console.log(`    ${note.frontmatter.category} • Updated: ${new Date(note.frontmatter.updated).toLocaleDateString()}`);
        console.log();
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: delete
noteCommand
  .command('delete')
  .description('Delete a note')
  .argument('<slug>', 'Note slug or path')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (slug: string, options) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const note = await noteManager.readNote(slug);

      if (!options.yes) {
        const inquirer = (await import('inquirer')).default;
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete "${note.frontmatter.title}"?`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log('Cancelled.');
          return;
        }
      }

      await noteManager.deleteNote(slug);
      console.log(`✓ Deleted: ${note.frontmatter.title}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
