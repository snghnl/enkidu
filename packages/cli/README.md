# Enkidu CLI - Personal Knowledge Management

A powerful command-line interface for managing your personal knowledge, daily notes, and publishing to Docusaurus.

## Features

✅ **Implemented (v0.1.0)**
- 📝 **Daily Notes** - Create and manage daily journal entries
- 📚 **Note Management** - Full CRUD operations for notes with categories and tags
- 🏷️ **Tags & Categories** - Organize and filter your knowledge
- ⚙️ **Configuration** - Flexible configuration system
- 📁 **File-based Storage** - All notes stored as markdown files
- 🎨 **Templates** - Built-in templates with CLI management
- 🔗 **Wiki-style Linking** - Link notes together with `[[note-name]]` syntax and backlinks
- 📊 **Link Analysis** - Backlinks, broken link detection, and statistics
- 🔍 **Full-text Search** - Fast fuzzy search with Fuse.js, cached indexing, and filtering
- 📋 **Template Management** - List, validate, and manage templates via CLI

🚧 **Coming Next**
- 🔄 **Docusaurus Sync** - One-command publishing to your blog with link conversion
- 🧪 **Comprehensive Testing** - 85%+ test coverage across all features
- ✨ **UX Polish** - Better error messages, progress indicators, and logging

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

### 6. Wiki-style Linking

Link notes together using wiki-link syntax:

```markdown
# In your note content
Check out my [[project-ideas]] for inspiration.
Also see [[daily-routine|my daily routine]].
```

```bash
# Show backlinks to a note
enkidu link backlinks project-ideas

# Show outgoing links from a note
enkidu link show project-ideas

# Validate all links and find broken ones
enkidu link validate

# Get suggestions for broken links
enkidu link validate --fix

# Show link statistics
enkidu link stats
```

**Link Syntax:**
- `[[note-slug]]` - Basic link (will resolve to note)
- `[[note-slug|Display Text]]` - Link with custom display text
- `[[2026-02-16]]` - Link to daily note
- Case-insensitive matching with fuzzy suggestions

### 7. Full-text Search

Search across all your notes with fuzzy matching:

```bash
# Search all notes
enkidu search "react hooks"

# Filter by category
enkidu search "javascript" --category reference

# Filter by tags
enkidu search "tutorial" --tag react --tag typescript

# Limit results
enkidu search "API" --limit 5

# Rebuild search index
enkidu search --rebuild-index
```

**Search Features:**
- Fuzzy matching with Fuse.js
- Searches across title, content, tags, and category
- Weighted scoring (title > tags > category > content)
- Cached indexing for fast searches
- Auto-updates on note changes

### 8. Template Management

Manage and validate templates:

```bash
# List all available templates
enkidu template list

# Validate all templates
enkidu template validate

# Validate specific template
enkidu template validate daily-default
```

**Built-in Templates:**
- `daily-default` - Daily note structure
- `note-default` - Basic note template
- `blog-post` - Blog post format
- `project` - Project tracking
- `meeting` - Meeting notes

### 9. Configuration

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
  "version": "0.1.0",
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

### v0.1.0 ✅ **COMPLETED**
- [x] CLI infrastructure
- [x] Configuration system
- [x] Note CRUD operations
- [x] Daily notes
- [x] Tags and categories
- [x] Wiki-style linking
- [x] Link validation and backlinks
- [x] Full-text search with fuzzy matching
- [x] Template management CLI
- [x] Search indexing and caching

### v0.2.0 (Next - Quality & Polish)
- [ ] Comprehensive test suite (85%+ coverage)
- [ ] Error handling improvements
- [ ] Progress indicators and spinners
- [ ] Better user feedback and hints
- [ ] Logging system
- [ ] Performance optimization (lazy loading, parallel operations)
- [ ] Complete documentation

### v0.3.0 (Publishing & Sync)
- [ ] Docusaurus sync with link conversion
- [ ] Publishing workflow
- [ ] Link graph visualization
- [ ] Interactive search mode
- [ ] Custom template support
- [ ] Import/export functionality

### v1.0.0 (Future)
- [ ] Git integration
- [ ] Web UI
- [ ] Mobile companion app
- [ ] Cloud sync
- [ ] AI-powered features (suggestions, summarization)

## Contributing

This is currently a personal project. Contributions welcome after v0.1.0 release.

## License

MIT

## Author

Personal Knowledge Management CLI
