# Enkidu CLI - Personal Knowledge Management

A powerful command-line interface for managing your personal knowledge, daily notes, and publishing to Docusaurus.

## Features

✅ **Implemented (v1.0.0-alpha)**
- 📝 **Daily Notes** - Create and manage daily journal entries
- 📚 **Note Management** - Full CRUD operations for notes with categories and tags
- 🏷️ **Tags & Categories** - Organize and filter your knowledge
- ⚙️ **Configuration** - Flexible configuration system
- 📁 **File-based Storage** - All notes stored as markdown files
- 🎨 **Templates** - Built-in templates for different note types

🚧 **Coming Soon**
- 🔗 **Wiki-style Linking** - Link notes together with `[[note-name]]` syntax
- 🔍 **Full-text Search** - Fast fuzzy search across all notes
- 🔄 **Docusaurus Sync** - One-command publishing to your blog
- 📊 **Link Graph** - Visualize connections between notes

## Installation

### Development

```bash
# Clone the repository
cd /path/to/projects/me

# Install dependencies
pnpm install

# Build the CLI
cd packages/cli
pnpm build

# Link globally (optional)
pnpm link --global

# Or run directly
node dist/cli.js --help
```

## Quick Start

### 1. Initialize PKM

```bash
enkidu init
```

This will:
- Create the Enkidu directory structure
- Set up configuration file
- Copy built-in templates

### 2. Create Your First Daily Note

```bash
# Open today's daily note
enkidu daily

# Open yesterday's note
enkidu daily yesterday

# Open specific date
enkidu daily 2026-02-10

# Quick append to today
enkidu daily append "Quick thought to capture"
```

### 3. Create Notes

```bash
# Create a general note
enkidu note create "My First Note"

# Create in specific category
enkidu note create "Project Ideas" --category projects

# Create a blog post
enkidu note create "My Blog Post" --blog

# Add tags
enkidu note create "Learning React" --tag react --tag javascript
```

### 4. Manage Notes

```bash
# List all notes
enkidu note list

# Filter by category
enkidu note list --category projects

# Filter by tag
enkidu note list --tag javascript

# Show note details
enkidu note show my-first-note

# Edit note
enkidu note edit my-first-note

# Delete note
enkidu note delete my-first-note
```

### 5. Work with Tags & Categories

```bash
# List all tags
enkidu tag list

# Find notes by tag
enkidu tag find javascript

# Rename tag across all notes
enkidu tag rename old-tag new-tag

# List categories
enkidu category list

# Move note to different category
enkidu category move my-note projects
```

### 6. Configuration

```bash
# View all config
enkidu config list

# Get specific value
enkidu config get editor

# Set value
enkidu config set editor "code"

# Open config in editor
enkidu config edit
```

## Directory Structure

When you run `enkidu init`, the following structure is created:

```
~/enkidu/                     # Your Enkidu root directory
├── .enkidu/
│   ├── config.json        # Configuration
│   ├── templates/         # Custom templates
│   └── cache/             # Index cache
├── daily/                 # Daily notes
│   └── 2026/
│       └── 02/
│           └── 13.md
├── notes/                 # General notes
│   ├── projects/
│   ├── reference/
│   ├── ideas/
│   └── misc/
├── blog/                  # Blog posts (publishable)
└── attachments/           # Images, files
```

## Note Frontmatter

Every note has YAML frontmatter:

```markdown
---
title: My Note
created: 2026-02-13T10:00:00Z
updated: 2026-02-13T11:30:00Z
tags: [javascript, learning]
category: reference
type: note
publish: false
---

# My Note

Content goes here...
```

## Templates

Built-in templates available:

- **daily-default** - Daily note with sections (Focus, Notes, Done, Reflections)
- **note-default** - Basic note template
- **blog-post** - Blog post with Introduction/Content/Conclusion
- **project** - Project note with Overview, Goals, Tasks, Resources
- **meeting** - Meeting notes with Agenda, Notes, Action Items

Use templates when creating notes:

```bash
enkidu note create "Sprint Planning" --template meeting
```

## Configuration

Default configuration (`~/.enkidu/config.json` or `~/enkidu/.enkidu/config.json`):

```json
{
  "version": "1.0.0",
  "rootDir": "~/enkidu",
  "editor": "vim",
  "daily": {
    "path": "daily",
    "template": "daily-default",
    "dateFormat": "YYYY/MM/DD.md",
    "autoCreate": true,
    "openInEditor": true
  },
  "notes": {
    "defaultCategory": "misc",
    "defaultTemplate": "note-default",
    "slugify": true
  },
  "sync": {
    "target": "",
    "enabled": false
  }
}
```

## Development

### Project Structure

```
packages/cli/
├── src/
│   ├── cli.ts              # Entry point
│   ├── commands/           # Command implementations
│   ├── core/               # Business logic
│   │   ├── config/         # Configuration management
│   │   ├── note/           # Note operations
│   │   ├── link/           # Linking system (TODO)
│   │   ├── search/         # Search (TODO)
│   │   └── sync/           # Docusaurus sync (TODO)
│   ├── utils/              # Utilities
│   └── types/              # TypeScript types
├── templates/              # Built-in templates
└── tests/                  # Tests
```

### Building

```bash
# Development (watch mode)
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## Roadmap

### v1.0.0 (MVP)
- [x] CLI infrastructure
- [x] Configuration system
- [x] Note CRUD operations
- [x] Daily notes
- [x] Tags and categories
- [ ] Wiki-style linking
- [ ] Search functionality
- [ ] Docusaurus sync
- [ ] Documentation
- [ ] Tests (>80% coverage)

### v1.1.0
- [ ] Link graph visualization
- [ ] Interactive search
- [ ] Custom templates
- [ ] Import/export
- [ ] Git integration

### v2.0.0
- [ ] Web UI
- [ ] Mobile companion app
- [ ] Cloud sync
- [ ] AI features

## Contributing

This is currently a personal project. Contributions welcome after v1.0.0 release.

## License

MIT

## Author

Personal Knowledge Management CLI
