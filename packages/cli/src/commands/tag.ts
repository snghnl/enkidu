import { Command } from 'commander';
import { NoteManager } from '../core/note/manager.js';
import { ConfigManager } from '../core/config/manager.js';

export const tagCommand = new Command('tag')
  .description('Manage tags');

// Subcommand: list
tagCommand
  .command('list')
  .description('List all tags')
  .action(async () => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const tags = await noteManager.getAllTags();

      if (tags.size === 0) {
        console.log('No tags found.');
        return;
      }

      console.log(`\nTags (${tags.size}):\n`);

      // Sort by count descending
      const sorted = Array.from(tags.entries()).sort((a, b) => b[1] - a[1]);

      for (const [tag, count] of sorted) {
        console.log(`  ${tag} (${count} note${count !== 1 ? 's' : ''})`);
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: find
tagCommand
  .command('find')
  .description('Find notes by tag')
  .argument('<tag>', 'Tag to search for')
  .action(async (tag: string) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const notes = await noteManager.listNotes({ tag });

      if (notes.length === 0) {
        console.log(`No notes found with tag "${tag}".`);
        return;
      }

      console.log(`\nNotes with tag "${tag}" (${notes.length}):\n`);

      for (const note of notes) {
        console.log(`  ${note.slug}`);
        console.log(`    ${note.frontmatter.title}`);
        console.log(`    ${note.frontmatter.category} • ${new Date(note.frontmatter.updated).toLocaleDateString()}`);
        console.log();
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Subcommand: rename
tagCommand
  .command('rename')
  .description('Rename a tag across all notes')
  .argument('<oldTag>', 'Current tag name')
  .argument('<newTag>', 'New tag name')
  .action(async (oldTag: string, newTag: string) => {
    try {
      const pkmRoot = ConfigManager.findPkmRoot();
      if (!pkmRoot) {
        console.error('PKM not initialized. Run "pkm init" first.');
        process.exit(1);
      }

      const noteManager = new NoteManager(pkmRoot);
      await noteManager.initialize();

      const count = await noteManager.renameTag(oldTag, newTag);

      if (count === 0) {
        console.log(`No notes found with tag "${oldTag}".`);
        return;
      }

      console.log(`✓ Renamed tag "${oldTag}" to "${newTag}" in ${count} note${count !== 1 ? 's' : ''}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
