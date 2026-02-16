import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import type { Note, NoteFrontmatter } from "../types/note.js";
import type { Template } from "../types/template.js";
import type { EnkiduConfig } from "../types/config.js";

/**
 * Test fixtures and utilities for creating test data
 */

export class TestFixtures {
  private tempDir: string;

  constructor(tempDir: string) {
    this.tempDir = tempDir;
  }

  /**
   * Create a temporary test directory structure
   */
  static createTempDir(prefix = "enkidu-test-"): string {
    const tempDir = join(process.cwd(), "test-temp", `${prefix}${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Clean up temporary directory
   */
  static cleanup(tempDir: string): void {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Initialize Enkidu directory structure
   */
  initEnkiduStructure(): void {
    const dirs = [
      "notes",
      "notes/blog",
      "notes/projects",
      "notes/daily",
      "notes/daily/2026",
      "notes/daily/2026/02",
      "templates",
      ".enkidu",
    ];

    dirs.forEach((dir) => {
      mkdirSync(join(this.tempDir, dir), { recursive: true });
    });
  }

  /**
   * Create a test config file
   */
  createConfig(config: Partial<EnkiduConfig> = {}): void {
    const defaultConfig: EnkiduConfig = {
      version: "1.0.0",
      enkidu: {
        notesDir: "notes",
        templatesDir: "templates",
        ...config.enkidu,
      },
      daily: {
        enabled: true,
        directory: "notes/daily",
        template: "daily-default",
        filenameFormat: "YYYY/MM/YYYY-MM-DD",
        ...config.daily,
      },
      notes: {
        defaultCategory: "general",
        categories: ["blog", "projects", "daily"],
        requireCategory: false,
        ...config.notes,
      },
      sync: {
        enabled: false,
        target: "docusaurus",
        docusaurusRoot: "../website",
        publishedOnly: true,
        convertWikiLinks: true,
        ...config.sync,
      },
      search: {
        threshold: 0.3,
        minMatchLength: 2,
        cacheEnabled: true,
        ...config.search,
      },
      ui: {
        editor: "vim",
        colors: true,
        verbose: false,
        ...config.ui,
      },
    };

    const configPath = join(this.tempDir, ".enkidu", "config.json");
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  }

  /**
   * Create a test note file
   */
  createNote(options: {
    slug: string;
    category?: string;
    frontmatter?: Partial<NoteFrontmatter>;
    content?: string;
  }): string {
    const {
      slug,
      category = "general",
      frontmatter = {},
      content = "Test note content.",
    } = options;

    const defaultFrontmatter: NoteFrontmatter = {
      title: frontmatter.title || slug.replace(/-/g, " "),
      created: frontmatter.created || new Date().toISOString(),
      updated: frontmatter.updated || new Date().toISOString(),
      tags: frontmatter.tags || [],
      category: frontmatter.category || category,
      ...frontmatter,
    };

    const frontmatterStr = Object.entries(defaultFrontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
        } else if (typeof value === "string") {
          return `${key}: "${value}"`;
        } else {
          return `${key}: ${value}`;
        }
      })
      .join("\n");

    const noteContent = `---\n${frontmatterStr}\n---\n\n${content}`;
    const notePath = join(this.tempDir, "notes", category, `${slug}.md`);

    mkdirSync(join(this.tempDir, "notes", category), { recursive: true });
    writeFileSync(notePath, noteContent);

    return notePath;
  }

  /**
   * Create a daily note
   */
  createDailyNote(
    date: string,
    content = "# Daily Note\n\nTest content.",
  ): string {
    const [year, month] = date.split("-");
    const dailyDir = join(this.tempDir, "notes/daily", year, month);
    mkdirSync(dailyDir, { recursive: true });

    const frontmatter = {
      title: `Daily Note - ${date}`,
      created: new Date(date).toISOString(),
      updated: new Date(date).toISOString(),
      tags: ["daily"],
      category: "daily",
    };

    const frontmatterStr = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
        }
        return `${key}: "${value}"`;
      })
      .join("\n");

    const noteContent = `---\n${frontmatterStr}\n---\n\n${content}`;
    const notePath = join(dailyDir, `${date}.md`);
    writeFileSync(notePath, noteContent);

    return notePath;
  }

  /**
   * Create a test template
   */
  createTemplate(options: {
    name: string;
    frontmatter?: Record<string, any>;
    content?: string;
    isCustom?: boolean;
  }): string {
    const {
      name,
      frontmatter = {},
      content = "# {{title}}\n\nCreated: {{created}}",
      isCustom = false,
    } = options;

    const defaultFrontmatter = {
      title: "{{title}}",
      created: "{{created}}",
      updated: "{{updated}}",
      tags: [],
      category: "{{category}}",
      ...frontmatter,
    };

    const frontmatterStr = Object.entries(defaultFrontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
        }
        return `${key}: "${value}"`;
      })
      .join("\n");

    const templateContent = `---\n${frontmatterStr}\n---\n\n${content}`;
    const templatePath = join(
      this.tempDir,
      "templates",
      isCustom ? "custom" : "",
      `${name}.md`,
    );

    const templateDir = join(
      this.tempDir,
      "templates",
      isCustom ? "custom" : "",
    );
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(templatePath, templateContent);

    return templatePath;
  }

  /**
   * Get the temp directory path
   */
  getPath(relativePath = ""): string {
    return relativePath ? join(this.tempDir, relativePath) : this.tempDir;
  }
}

/**
 * Sample note fixtures for testing
 */
export const sampleNotes = {
  basicNote: {
    slug: "basic-note",
    frontmatter: {
      title: "Basic Note",
      tags: ["test", "sample"],
      category: "general",
    },
    content: "This is a basic test note.",
  },

  blogPost: {
    slug: "my-blog-post",
    frontmatter: {
      title: "My Blog Post",
      tags: ["blog", "writing"],
      category: "blog",
      published: true,
      publishedDate: "2026-02-15",
    },
    content:
      "# My Blog Post\n\nThis is a blog post with [[wiki-links]] to other notes.",
  },

  projectNote: {
    slug: "project-alpha",
    frontmatter: {
      title: "Project Alpha",
      tags: ["project", "work"],
      category: "projects",
      status: "in-progress",
    },
    content:
      "# Project Alpha\n\n## Overview\n\nLinks to [[basic-note]] and [[my-blog-post]].",
  },

  noteWithBrokenLinks: {
    slug: "broken-links",
    frontmatter: {
      title: "Note with Broken Links",
      tags: ["test"],
      category: "general",
    },
    content:
      "This note has [[non-existent-note]] and [[another-missing-note|Missing]].",
  },
};

/**
 * Sample templates for testing
 */
export const sampleTemplates = {
  basic: {
    name: "basic",
    frontmatter: {
      title: "{{title}}",
      created: "{{created}}",
      updated: "{{updated}}",
      tags: [],
    },
    content:
      "# {{title}}\n\nCreated on {{created}}.\n\n## Content\n\nYour content here.",
  },

  meeting: {
    name: "meeting",
    frontmatter: {
      title: "{{title}}",
      created: "{{created}}",
      tags: ["meeting"],
      category: "meetings",
      attendees: [],
    },
    content: `# {{title}}

**Date:** {{created}}
**Attendees:**

## Agenda

1.

## Notes

## Action Items

- [ ] `,
  },
};

/**
 * Sample config variations
 */
export const sampleConfigs = {
  minimal: {
    version: "1.0.0",
    enkidu: {
      notesDir: "notes",
      templatesDir: "templates",
    },
  },

  withSync: {
    version: "1.0.0",
    enkidu: {
      notesDir: "notes",
      templatesDir: "templates",
    },
    sync: {
      enabled: true,
      target: "docusaurus" as const,
      docusaurusRoot: "../website",
      publishedOnly: true,
      convertWikiLinks: true,
    },
  },
};
