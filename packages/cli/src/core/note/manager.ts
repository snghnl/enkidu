import { join, basename, dirname, relative } from "path";
import {
  Note,
  NoteFrontmatter,
  NoteListOptions,
  NoteCreateOptions,
} from "../../types/note.js";
import {
  readFile,
  writeFile,
  deleteFile,
  fileExists,
  listFilesRecursive,
} from "../../utils/fs.js";
import { slugify, generateUniqueSlug } from "../../utils/slug.js";
import {
  parseFrontmatter,
  stringifyFrontmatter,
  createDefaultFrontmatter,
  updateFrontmatter,
} from "./frontmatter.js";
import { validateNoteTitle } from "./validator.js";
import { getConfigManager } from "../config/manager.js";

export class NoteManager {
  private config: any;
  private enkiduRoot: string;

  constructor(enkiduRoot: string) {
    this.enkiduRoot = enkiduRoot;
  }

  async initialize(): Promise<void> {
    const manager = getConfigManager();
    await manager.loadConfig(this.enkiduRoot);
    this.config = manager.getConfig();
  }

  /**
   * Create a new note
   */
  async createNote(
    title: string,
    options: NoteCreateOptions = {},
  ): Promise<Note> {
    // Validate title
    const validation = validateNoteTitle(title);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate slug
    const slug = slugify(title);

    // Determine category and path
    const category = options.category || this.config.notes.defaultCategory;
    const noteType = options.type || "note";

    // Build file path
    let notePath: string;
    if (noteType === "blog") {
      notePath = join(this.enkiduRoot, "blog", `${slug}.md`);
    } else if (noteType === "daily") {
      // Daily notes are handled separately
      throw new Error("Use daily note methods for creating daily notes");
    } else {
      notePath = join(this.enkiduRoot, "notes", category, `${slug}.md`);
    }

    // Check if note already exists
    if (fileExists(notePath)) {
      throw new Error(`Note already exists: ${slug}`);
    }

    // Create frontmatter
    const frontmatter = createDefaultFrontmatter(title, {
      category,
      type: noteType,
      tags: options.tags,
    });

    // Get template content (TODO: implement template loading)
    const templateName = options.template || this.config.notes.defaultTemplate;
    const content = `# ${title}\n\n`;

    // Write note
    const noteContent = stringifyFrontmatter(frontmatter, content);
    writeFile(notePath, noteContent);

    return {
      slug,
      filePath: notePath,
      frontmatter,
      content,
      rawContent: noteContent,
    };
  }

  /**
   * Read a note by slug or path
   */
  async readNote(slugOrPath: string): Promise<Note> {
    let notePath: string;

    // Check if it's already a path
    if (slugOrPath.includes("/") || slugOrPath.endsWith(".md")) {
      notePath = slugOrPath.startsWith("/")
        ? slugOrPath
        : join(this.enkiduRoot, slugOrPath);
    } else {
      // Search for note by slug
      const foundPath = await this.findNoteBySlug(slugOrPath);
      if (!foundPath) {
        throw new Error(`Note not found: ${slugOrPath}`);
      }
      notePath = foundPath;
    }

    if (!fileExists(notePath)) {
      throw new Error(`Note not found: ${slugOrPath}`);
    }

    const rawContent = readFile(notePath);
    const { frontmatter, content } = parseFrontmatter(rawContent);

    // Extract slug from filename
    const filename = basename(notePath, ".md");
    const slug = filename;

    return {
      slug,
      filePath: notePath,
      frontmatter,
      content,
      rawContent,
    };
  }

  /**
   * Update a note
   */
  async updateNote(
    slugOrPath: string,
    updates: {
      frontmatter?: Partial<NoteFrontmatter>;
      content?: string;
    },
  ): Promise<Note> {
    const note = await this.readNote(slugOrPath);

    // Update frontmatter
    let updatedFrontmatter = note.frontmatter;
    if (updates.frontmatter) {
      updatedFrontmatter = {
        ...note.frontmatter,
        ...updates.frontmatter,
        updated: new Date().toISOString(),
      };
    }

    // Update content
    const updatedContent =
      updates.content !== undefined ? updates.content : note.content;

    // Write updated note
    const rawContent = stringifyFrontmatter(updatedFrontmatter, updatedContent);
    writeFile(note.filePath, rawContent);

    return {
      ...note,
      frontmatter: updatedFrontmatter,
      content: updatedContent,
      rawContent,
    };
  }

  /**
   * Delete a note
   */
  async deleteNote(slugOrPath: string): Promise<void> {
    const note = await this.readNote(slugOrPath);
    deleteFile(note.filePath);
  }

  /**
   * List notes with filters
   */
  async listNotes(options: NoteListOptions = {}): Promise<Note[]> {
    const notes: Note[] = [];

    // Determine search paths
    const searchPaths: string[] = [];
    if (options.type === "blog") {
      searchPaths.push(join(this.enkiduRoot, "blog"));
    } else if (options.type === "daily") {
      searchPaths.push(join(this.enkiduRoot, "daily"));
    } else if (options.category) {
      searchPaths.push(join(this.enkiduRoot, "notes", options.category));
    } else {
      searchPaths.push(join(this.enkiduRoot, "notes"));
    }

    // Collect all markdown files
    for (const searchPath of searchPaths) {
      const files = listFilesRecursive(searchPath, ".md");

      for (const file of files) {
        try {
          const note = await this.readNote(file);

          // Apply filters
          if (options.tag && !note.frontmatter.tags.includes(options.tag)) {
            continue;
          }

          notes.push(note);
        } catch (error) {
          // Skip invalid notes
          console.warn(`Skipping invalid note: ${file}`);
        }
      }
    }

    // Sort by updated date (most recent first)
    notes.sort((a, b) => {
      return (
        new Date(b.frontmatter.updated).getTime() -
        new Date(a.frontmatter.updated).getTime()
      );
    });

    // Apply limit
    if (options.limit) {
      return notes.slice(0, options.limit);
    }

    return notes;
  }

  /**
   * Find note by slug
   */
  async findNoteBySlug(slug: string): Promise<string | null> {
    const allFiles = [
      ...listFilesRecursive(join(this.enkiduRoot, "notes"), ".md"),
      ...listFilesRecursive(join(this.enkiduRoot, "blog"), ".md"),
    ];

    for (const file of allFiles) {
      const filename = basename(file, ".md");
      if (filename === slug) {
        return file;
      }
    }

    return null;
  }

  /**
   * Get all tags across all notes
   */
  async getAllTags(): Promise<Map<string, number>> {
    const notes = await this.listNotes();
    const tagCounts = new Map<string, number>();

    for (const note of notes) {
      for (const tag of note.frontmatter.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return tagCounts;
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<string[]> {
    const notes = await this.listNotes();
    const categories = new Set<string>();

    for (const note of notes) {
      categories.add(note.frontmatter.category);
    }

    return Array.from(categories).sort();
  }

  /**
   * Rename tag across all notes
   */
  async renameTag(oldTag: string, newTag: string): Promise<number> {
    const notes = await this.listNotes({ tag: oldTag });
    let count = 0;

    for (const note of notes) {
      const updatedTags = note.frontmatter.tags.map((t) =>
        t === oldTag ? newTag : t,
      );
      await this.updateNote(note.slug, {
        frontmatter: { tags: updatedTags },
      });
      count++;
    }

    return count;
  }

  /**
   * Move note to different category
   */
  async moveNoteToCategory(
    slugOrPath: string,
    newCategory: string,
  ): Promise<Note> {
    const note = await this.readNote(slugOrPath);

    // Update frontmatter
    const updatedNote = await this.updateNote(slugOrPath, {
      frontmatter: { category: newCategory },
    });

    // If it's not a blog post, move the file
    if (note.frontmatter.type === "note") {
      const newPath = join(
        this.enkiduRoot,
        "notes",
        newCategory,
        basename(note.filePath),
      );
      const content = readFile(note.filePath);
      writeFile(newPath, content);
      deleteFile(note.filePath);

      return {
        ...updatedNote,
        filePath: newPath,
      };
    }

    return updatedNote;
  }

  /**
   * Get or create daily note for a specific date
   */
  async getDailyNote(date: Date): Promise<{ note: Note; created: boolean }> {
    // Format date according to config
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // Build path: daily/YYYY/MM/DD.md
    const dailyPath = join(
      this.enkiduRoot,
      this.config.daily.path,
      `${year}`,
      month,
      `${day}.md`,
    );

    // Check if daily note exists
    if (fileExists(dailyPath)) {
      const note = await this.readNote(dailyPath);
      return { note, created: false };
    }

    // Create daily note
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];

    const frontmatter = {
      date: date.toISOString(),
      tags: ["daily"],
      type: "daily" as const,
      title: `${dayName}, ${monthName} ${day}, ${year}`,
      created: date.toISOString(),
      updated: date.toISOString(),
      category: "daily",
      publish: false,
    };

    const content = `# ${dayName}, ${monthName} ${day}, ${year}\n\n## 🎯 Focus\n- \n\n## 📝 Notes\n\n\n## ✅ Done\n\n\n## 💭 Reflections\n\n\n## 🔗 Links\n- \n`;

    const noteContent = stringifyFrontmatter(frontmatter, content);
    writeFile(dailyPath, noteContent);

    const note: Note = {
      slug: `${year}-${month}-${day}`,
      filePath: dailyPath,
      frontmatter,
      content,
      rawContent: noteContent,
    };

    return { note, created: true };
  }

  /**
   * Append content to daily note
   */
  async appendToDailyNote(date: Date, content: string): Promise<Note> {
    const { note } = await this.getDailyNote(date);

    // Append to content with timestamp
    const timestamp = new Date().toLocaleTimeString();
    const appendedContent = `${note.content}\n\n**${timestamp}**\n${content}\n`;

    return await this.updateNote(note.filePath, {
      content: appendedContent,
    });
  }

  /**
   * List daily notes for a date range
   */
  async listDailyNotes(startDate?: Date, endDate?: Date): Promise<Note[]> {
    const dailyPath = join(this.enkiduRoot, this.config.daily.path);
    const files = listFilesRecursive(dailyPath, ".md");
    const notes: Note[] = [];

    for (const file of files) {
      try {
        const note = await this.readNote(file);

        // Filter by date range if provided
        if (startDate || endDate) {
          const noteDate = new Date(note.frontmatter.date);
          if (startDate && noteDate < startDate) continue;
          if (endDate && noteDate > endDate) continue;
        }

        notes.push(note);
      } catch (error) {
        // Skip invalid notes
        console.warn(`Skipping invalid daily note: ${file}`);
      }
    }

    // Sort by date (most recent first)
    notes.sort((a, b) => {
      return (
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
      );
    });

    return notes;
  }
}
