import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { NoteManager } from '../manager.js';
import { TestFixtures } from '../../../__test-utils__/fixtures.js';
import { writeFile } from '../../../utils/fs.js';

describe('NoteManager', () => {
  let fixtures: TestFixtures;
  let tempDir: string;
  let noteManager: NoteManager;

  beforeEach(async () => {
    tempDir = TestFixtures.createTempDir('note-manager-');
    fixtures = new TestFixtures(tempDir);
    fixtures.initPkmStructure();
    fixtures.createConfig();

    noteManager = new NoteManager(tempDir);
    await noteManager.initialize();
  });

  afterEach(() => {
    TestFixtures.cleanup(tempDir);
  });

  describe('createNote', () => {
    it('should create a basic note', async () => {
      const note = await noteManager.createNote('Test Note');

      expect(note.frontmatter.title).toBe('Test Note');
      expect(note.slug).toBe('test-note');
      expect(note.filePath).toContain('test-note.md');
      expect(note.frontmatter.created).toBeDefined();
      expect(note.frontmatter.updated).toBeDefined();
    });

    it('should create note with specified category', async () => {
      const note = await noteManager.createNote('Blog Post', {
        category: 'blog',
      });

      expect(note.frontmatter.category).toBe('blog');
      expect(note.filePath).toContain('blog');
    });

    it('should create note with tags', async () => {
      const note = await noteManager.createNote('Tagged Note', {
        tags: ['test', 'sample'],
      });

      expect(note.frontmatter.tags).toEqual(['test', 'sample']);
    });

    it('should throw error for empty title', async () => {
      await expect(noteManager.createNote('')).rejects.toThrow();
    });

    it('should throw error for duplicate note', async () => {
      await noteManager.createNote('Duplicate');
      await expect(noteManager.createNote('Duplicate')).rejects.toThrow(
        'Note already exists'
      );
    });

    it('should create note with default category', async () => {
      const note = await noteManager.createNote('Default Note');

      expect(note.frontmatter.category).toBe('general');
    });

    it('should throw error for daily note type', async () => {
      await expect(
        noteManager.createNote('Daily', { type: 'daily' })
      ).rejects.toThrow('Use daily note methods');
    });

    it('should slugify title correctly', async () => {
      const note = await noteManager.createNote('My Awesome Note!');

      expect(note.slug).toBe('my-awesome-note');
    });

    it('should set type correctly', async () => {
      const note = await noteManager.createNote('Note', { type: 'note' });

      expect(note.frontmatter.type).toBe('note');
    });

    it('should create blog type note in blog directory', async () => {
      const note = await noteManager.createNote('Blog', { type: 'blog' });

      expect(note.filePath).toContain('blog');
      expect(note.frontmatter.type).toBe('blog');
    });
  });

  describe('readNote', () => {
    beforeEach(async () => {
      await noteManager.createNote('Test Note', {
        category: 'general',
        tags: ['test'],
      });
    });

    it('should read note by slug', async () => {
      const note = await noteManager.readNote('test-note');

      expect(note.frontmatter.title).toBe('Test Note');
      expect(note.slug).toBe('test-note');
    });

    it('should read note by full path', async () => {
      const notePath = join(tempDir, 'notes', 'general', 'test-note.md');
      const note = await noteManager.readNote(notePath);

      expect(note.frontmatter.title).toBe('Test Note');
    });

    it('should read note by relative path', async () => {
      const note = await noteManager.readNote('notes/general/test-note.md');

      expect(note.frontmatter.title).toBe('Test Note');
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteManager.readNote('non-existent')).rejects.toThrow(
        'Note not found'
      );
    });

    it('should parse frontmatter correctly', async () => {
      const note = await noteManager.readNote('test-note');

      expect(note.frontmatter.tags).toEqual(['test']);
      expect(note.frontmatter.category).toBe('general');
    });

    it('should include raw content', async () => {
      const note = await noteManager.readNote('test-note');

      expect(note.rawContent).toContain('---');
      expect(note.rawContent).toContain('title');
    });

    it('should handle notes with .md extension in slug', async () => {
      const note = await noteManager.readNote('test-note.md');

      expect(note.frontmatter.title).toBe('Test Note');
    });
  });

  describe('updateNote', () => {
    beforeEach(async () => {
      await noteManager.createNote('Original Title', {
        category: 'general',
        tags: ['original'],
      });
    });

    it('should update frontmatter', async () => {
      const updated = await noteManager.updateNote('original-title', {
        frontmatter: { title: 'Updated Title' },
      });

      expect(updated.frontmatter.title).toBe('Updated Title');
    });

    it('should update content', async () => {
      const newContent = '# New Content\n\nUpdated content here.';
      const updated = await noteManager.updateNote('original-title', {
        content: newContent,
      });

      expect(updated.content).toBe(newContent);
    });

    it('should update both frontmatter and content', async () => {
      const updated = await noteManager.updateNote('original-title', {
        frontmatter: { tags: ['updated', 'test'] },
        content: '# Updated\n\nNew content.',
      });

      expect(updated.frontmatter.tags).toEqual(['updated', 'test']);
      expect(updated.content).toBe('# Updated\n\nNew content.');
    });

    it('should update the updated timestamp', async () => {
      const original = await noteManager.readNote('original-title');

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await noteManager.updateNote('original-title', {
        frontmatter: { title: 'New' },
      });

      expect(updated.frontmatter.updated).not.toBe(original.frontmatter.updated);
    });

    it('should preserve unchanged fields', async () => {
      const updated = await noteManager.updateNote('original-title', {
        frontmatter: { title: 'New Title' },
      });

      expect(updated.frontmatter.category).toBe('general');
      expect(updated.frontmatter.created).toBeDefined();
    });

    it('should throw error for non-existent note', async () => {
      await expect(
        noteManager.updateNote('non-existent', {
          frontmatter: { title: 'New' },
        })
      ).rejects.toThrow('Note not found');
    });

    it('should write changes to disk', async () => {
      await noteManager.updateNote('original-title', {
        frontmatter: { title: 'Updated' },
      });

      const reread = await noteManager.readNote('original-title');
      expect(reread.frontmatter.title).toBe('Updated');
    });
  });

  describe('deleteNote', () => {
    beforeEach(async () => {
      await noteManager.createNote('To Delete', { category: 'general' });
    });

    it('should delete note by slug', async () => {
      await noteManager.deleteNote('to-delete');

      await expect(noteManager.readNote('to-delete')).rejects.toThrow(
        'Note not found'
      );
    });

    it('should delete note by path', async () => {
      const notePath = join(tempDir, 'notes', 'general', 'to-delete.md');
      await noteManager.deleteNote(notePath);

      await expect(noteManager.readNote('to-delete')).rejects.toThrow();
    });

    it('should throw error for non-existent note', async () => {
      await expect(noteManager.deleteNote('non-existent')).rejects.toThrow(
        'Note not found'
      );
    });

    it('should remove file from disk', async () => {
      const note = await noteManager.readNote('to-delete');
      await noteManager.deleteNote('to-delete');

      const { fileExists } = await import('../../../utils/fs.js');
      expect(fileExists(note.filePath)).toBe(false);
    });
  });

  describe('listNotes', () => {
    beforeEach(async () => {
      await noteManager.createNote('Note 1', {
        category: 'general',
        tags: ['tag1'],
      });
      await noteManager.createNote('Note 2', {
        category: 'blog',
        tags: ['tag2'],
      });
      await noteManager.createNote('Note 3', {
        category: 'general',
        tags: ['tag1', 'tag2'],
      });
    });

    it('should list all notes', async () => {
      const notes = await noteManager.listNotes();

      expect(notes.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by category', async () => {
      const notes = await noteManager.listNotes({ category: 'general' });

      expect(notes.length).toBe(2);
      expect(notes.every(n => n.frontmatter.category === 'general')).toBe(true);
    });

    it('should filter by tag', async () => {
      const notes = await noteManager.listNotes({ tag: 'tag1' });

      expect(notes.length).toBe(2);
      expect(notes.every(n => n.frontmatter.tags.includes('tag1'))).toBe(true);
    });

    it('should limit results', async () => {
      const notes = await noteManager.listNotes({ limit: 2 });

      expect(notes.length).toBe(2);
    });

    it('should sort by updated date descending', async () => {
      const notes = await noteManager.listNotes();

      for (let i = 1; i < notes.length; i++) {
        const prev = new Date(notes[i - 1].frontmatter.updated);
        const curr = new Date(notes[i].frontmatter.updated);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it('should return empty array when no notes match', async () => {
      const notes = await noteManager.listNotes({ tag: 'non-existent' });

      expect(notes).toEqual([]);
    });

    it('should filter by type', async () => {
      await noteManager.createNote('Blog Post', { type: 'blog' });
      const notes = await noteManager.listNotes({ type: 'blog' });

      expect(notes.length).toBeGreaterThanOrEqual(1);
      expect(notes.every(n => n.frontmatter.type === 'blog')).toBe(true);
    });
  });

  describe('findNoteBySlug', () => {
    beforeEach(async () => {
      await noteManager.createNote('Findable Note', { category: 'general' });
    });

    it('should find note by slug', async () => {
      const path = await noteManager.findNoteBySlug('findable-note');

      expect(path).toBeTruthy();
      expect(path).toContain('findable-note.md');
    });

    it('should return null for non-existent slug', async () => {
      const path = await noteManager.findNoteBySlug('non-existent');

      expect(path).toBeNull();
    });

    it('should search in both notes and blog directories', async () => {
      await noteManager.createNote('Blog Note', { type: 'blog' });

      const notePath = await noteManager.findNoteBySlug('findable-note');
      const blogPath = await noteManager.findNoteBySlug('blog-note');

      expect(notePath).toContain('notes');
      expect(blogPath).toContain('blog');
    });
  });

  describe('getAllTags', () => {
    beforeEach(async () => {
      await noteManager.createNote('Note 1', { tags: ['tag1', 'tag2'] });
      await noteManager.createNote('Note 2', { tags: ['tag1', 'tag3'] });
      await noteManager.createNote('Note 3', { tags: ['tag2'] });
    });

    it('should return all tags with counts', async () => {
      const tags = await noteManager.getAllTags();

      expect(tags.size).toBe(3);
      expect(tags.get('tag1')).toBe(2);
      expect(tags.get('tag2')).toBe(2);
      expect(tags.get('tag3')).toBe(1);
    });

    it('should return empty map when no notes', async () => {
      // Delete all notes
      const notes = await noteManager.listNotes();
      for (const note of notes) {
        await noteManager.deleteNote(note.slug);
      }

      const tags = await noteManager.getAllTags();

      expect(tags.size).toBe(0);
    });

    it('should handle notes with no tags', async () => {
      await noteManager.createNote('Untagged', { tags: [] });

      const tags = await noteManager.getAllTags();

      expect(tags).toBeDefined();
    });
  });

  describe('getAllCategories', () => {
    beforeEach(async () => {
      await noteManager.createNote('General Note', { category: 'general' });
      await noteManager.createNote('Blog Post', { category: 'blog' });
      await noteManager.createNote('Project', { category: 'projects' });
      await noteManager.createNote('Another Blog', { category: 'blog' });
    });

    it('should return all unique categories', async () => {
      const categories = await noteManager.getAllCategories();

      expect(categories.length).toBe(3);
      expect(categories).toContain('general');
      expect(categories).toContain('blog');
      expect(categories).toContain('projects');
    });

    it('should return sorted categories', async () => {
      const categories = await noteManager.getAllCategories();

      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });

    it('should not duplicate categories', async () => {
      const categories = await noteManager.getAllCategories();

      const unique = [...new Set(categories)];
      expect(categories).toEqual(unique);
    });
  });

  describe('renameTag', () => {
    beforeEach(async () => {
      await noteManager.createNote('Note 1', { tags: ['old-tag'] });
      await noteManager.createNote('Note 2', { tags: ['old-tag', 'keep'] });
      await noteManager.createNote('Note 3', { tags: ['other'] });
    });

    it('should rename tag across all notes', async () => {
      const count = await noteManager.renameTag('old-tag', 'new-tag');

      expect(count).toBe(2);

      const notes = await noteManager.listNotes({ tag: 'new-tag' });
      expect(notes.length).toBe(2);
    });

    it('should preserve other tags', async () => {
      await noteManager.renameTag('old-tag', 'new-tag');

      const note = await noteManager.readNote('note-2');
      expect(note.frontmatter.tags).toContain('new-tag');
      expect(note.frontmatter.tags).toContain('keep');
    });

    it('should return 0 for non-existent tag', async () => {
      const count = await noteManager.renameTag('non-existent', 'new');

      expect(count).toBe(0);
    });

    it('should update notes on disk', async () => {
      await noteManager.renameTag('old-tag', 'new-tag');

      const note = await noteManager.readNote('note-1');
      expect(note.frontmatter.tags).toEqual(['new-tag']);
    });
  });

  describe('moveNoteToCategory', () => {
    beforeEach(async () => {
      await noteManager.createNote('Movable Note', { category: 'general' });
    });

    it('should update category in frontmatter', async () => {
      const moved = await noteManager.moveNoteToCategory(
        'movable-note',
        'projects'
      );

      expect(moved.frontmatter.category).toBe('projects');
    });

    it('should move file to new category directory', async () => {
      const moved = await noteManager.moveNoteToCategory(
        'movable-note',
        'projects'
      );

      expect(moved.filePath).toContain('projects');
      expect(moved.filePath).not.toContain('general');
    });

    it('should delete old file', async () => {
      const original = await noteManager.readNote('movable-note');
      await noteManager.moveNoteToCategory('movable-note', 'projects');

      const { fileExists } = await import('../../../utils/fs.js');
      expect(fileExists(original.filePath)).toBe(false);
    });

    it('should preserve note content', async () => {
      await noteManager.moveNoteToCategory('movable-note', 'projects');

      const moved = await noteManager.readNote('movable-note');
      expect(moved.frontmatter.title).toBe('Movable Note');
    });

    it('should throw error for non-existent note', async () => {
      await expect(
        noteManager.moveNoteToCategory('non-existent', 'projects')
      ).rejects.toThrow('Note not found');
    });
  });

  describe('getDailyNote', () => {
    it('should create daily note if it does not exist', async () => {
      const date = new Date('2026-02-15');
      const { note, created } = await noteManager.getDailyNote(date);

      expect(created).toBe(true);
      expect(note.frontmatter.type).toBe('daily');
      expect(note.frontmatter.tags).toContain('daily');
    });

    it('should return existing daily note', async () => {
      const date = new Date('2026-02-15');
      await noteManager.getDailyNote(date);

      const { note, created } = await noteManager.getDailyNote(date);

      expect(created).toBe(false);
    });

    it('should create note with correct path structure', async () => {
      const date = new Date('2026-02-15');
      const { note } = await noteManager.getDailyNote(date);

      expect(note.filePath).toContain('2026');
      expect(note.filePath).toContain('02');
      expect(note.filePath).toContain('15.md');
    });

    it('should include default daily note sections', async () => {
      const date = new Date('2026-02-15');
      const { note } = await noteManager.getDailyNote(date);

      expect(note.content).toContain('Focus');
      expect(note.content).toContain('Notes');
      expect(note.content).toContain('Done');
      expect(note.content).toContain('Reflections');
    });

    it('should format date in title correctly', async () => {
      const date = new Date('2026-02-15');
      const { note } = await noteManager.getDailyNote(date);

      expect(note.frontmatter.title).toContain('Saturday');
      expect(note.frontmatter.title).toContain('February');
      expect(note.frontmatter.title).toContain('15');
      expect(note.frontmatter.title).toContain('2026');
    });
  });

  describe('appendToDailyNote', () => {
    it('should append content to existing daily note', async () => {
      const date = new Date('2026-02-15');
      await noteManager.getDailyNote(date);

      const updated = await noteManager.appendToDailyNote(date, 'New entry');

      expect(updated.content).toContain('New entry');
    });

    it('should include timestamp with appended content', async () => {
      const date = new Date('2026-02-15');
      const updated = await noteManager.appendToDailyNote(date, 'Test');

      expect(updated.content).toMatch(/\*\*\d{1,2}:\d{2}:\d{2}/);
    });

    it('should create daily note if it does not exist', async () => {
      const date = new Date('2026-02-15');
      const updated = await noteManager.appendToDailyNote(date, 'First entry');

      expect(updated.content).toContain('First entry');
    });

    it('should preserve existing content', async () => {
      const date = new Date('2026-02-15');
      const { note } = await noteManager.getDailyNote(date);
      const originalContent = note.content;

      await noteManager.appendToDailyNote(date, 'Additional');

      const updated = await noteManager.readNote(note.filePath);
      expect(updated.content).toContain(originalContent);
    });
  });

  describe('listDailyNotes', () => {
    beforeEach(async () => {
      await noteManager.getDailyNote(new Date('2026-02-10'));
      await noteManager.getDailyNote(new Date('2026-02-15'));
      await noteManager.getDailyNote(new Date('2026-02-20'));
    });

    it('should list all daily notes', async () => {
      const notes = await noteManager.listDailyNotes();

      expect(notes.length).toBe(3);
      expect(notes.every(n => n.frontmatter.type === 'daily')).toBe(true);
    });

    it('should filter by start date', async () => {
      const notes = await noteManager.listDailyNotes(new Date('2026-02-15'));

      expect(notes.length).toBe(2);
    });

    it('should filter by end date', async () => {
      const notes = await noteManager.listDailyNotes(
        undefined,
        new Date('2026-02-15')
      );

      expect(notes.length).toBe(2);
    });

    it('should filter by date range', async () => {
      const notes = await noteManager.listDailyNotes(
        new Date('2026-02-12'),
        new Date('2026-02-18')
      );

      expect(notes.length).toBe(1);
    });

    it('should sort by date descending', async () => {
      const notes = await noteManager.listDailyNotes();

      for (let i = 1; i < notes.length; i++) {
        const prev = new Date(notes[i - 1].frontmatter.date);
        const curr = new Date(notes[i].frontmatter.date);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it('should return empty array when no daily notes', async () => {
      const notes = await noteManager.listDailyNotes(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(notes).toEqual([]);
    });
  });
});
