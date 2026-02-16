# Getting Started with Enkidu CLI

Welcome to Enkidu CLI - your personal knowledge management system!

## Installation

### From Source (Current)

```bash
# Navigate to the project
cd /path/to/projects/me

# Install dependencies
pnpm install

# Build the CLI
cd packages/cli
pnpm build

# Link globally (makes 'enkidu' available everywhere)
pnpm link --global

# Test it
enkidu --version
```

## First Steps

### 1. Initialize Your Enkidu

```bash
enkidu init
```

You'll be prompted for:
- **Enkidu directory** - Where to store your notes (default: `~/enkidu`)
- **Editor** - Your preferred text editor (default: from `$EDITOR` or `vim`)
- **Docusaurus path** - Optional: Path to your Docusaurus blog directory

This creates:
```
~/enkidu/
├── .enkidu/
│   ├── config.json
│   ├── templates/
│   └── cache/
├── daily/
├── notes/
│   ├── projects/
│   ├── reference/
│   ├── ideas/
│   └── misc/
├── blog/
└── attachments/
```

### 2. Create Your First Daily Note

```bash
# Open today's note
enkidu daily
```

This creates a daily note with sections:
- 🎯 Focus
- 📝 Notes
- ✅ Done
- 💭 Reflections
- 🔗 Links

Your configured editor opens automatically!

### 3. Quick Capture

Throughout the day, append thoughts without opening editor:

```bash
enkidu daily append "Had a great idea for the project"
enkidu daily append "Meeting notes: discuss timeline"
```

### 4. Create Notes

```bash
# General note
enkidu note create "My Learning Notes"

# Project note
enkidu note create "New Website Project" --category projects

# Add tags
enkidu note create "React Hooks Guide" --category reference --tag react --tag javascript

# Blog post
enkidu note create "Getting Started with TypeScript" --blog
```

### 5. Organize with Tags

```bash
# See all tags
enkidu tag list

# Find notes by tag
enkidu tag find react

# Rename a tag everywhere
enkidu tag rename old-name new-name
```

### 6. Browse Your Notes

```bash
# List all notes
enkidu note list

# Filter by category
enkidu note list --category projects

# Filter by tag
enkidu note list --tag javascript

# Limit results
enkidu note list --limit 5
```

### 7. Edit and View Notes

```bash
# View note details
enkidu note show my-note

# Edit note
enkidu note edit my-note
```

## Publishing to Docusaurus

### Setup Sync

```bash
enkidu sync config
```

Configure:
- Blog directory path (e.g., `/path/to/docusaurus/blog`)
- Assets directory (e.g., `/path/to/docusaurus/static/img`)
- Enable sync
- Enable frontmatter transformation
- Enable asset copying

### Mark Notes for Publishing

Edit a note and set `publish: true` in frontmatter:

```markdown
---
title: My Blog Post
created: 2026-02-13T10:00:00Z
tags: [javascript, tutorial]
category: blog
type: blog
publish: true    👈 Add this!
---

# My Blog Post

Content...
```

### Preview Sync

```bash
# Dry run - see what would be synced
enkidu sync --dry-run
```

### Sync Notes

```bash
# Sync all publishable notes
enkidu sync

# Sync specific note
enkidu sync my-blog-post
```

### Check Status

```bash
# See which notes are publishable
enkidu sync status
```

## Daily Workflow Examples

### Morning Routine

```bash
# Open today's daily note
enkidu daily

# Add your focus for the day under "🎯 Focus"
# Plan your tasks
```

### During the Day

```bash
# Quick captures
enkidu daily append "Bug fix idea: check cache invalidation"
enkidu daily append "Meeting with Sarah - approved new feature"

# Create project notes as needed
enkidu note create "Feature: Dark Mode" --category projects --tag ui --tag feature
```

### Evening Review

```bash
# Open today's note
enkidu daily

# Fill in:
# - ✅ Done (what you accomplished)
# - 💭 Reflections (thoughts, learnings)
# - 🔗 Links (related notes)

# Look at previous days for context
enkidu daily yesterday
enkidu daily list --month 2026-02
```

### Weekly Review

```bash
# List daily notes from this week
enkidu daily list

# Review tags
enkidu tag list

# Review categories
enkidu category list

# Find notes to publish
enkidu sync status
```

## Tips & Tricks

### 1. Date Navigation

```bash
enkidu daily                  # Today
enkidu daily yesterday        # Yesterday
enkidu daily tomorrow         # Tomorrow
enkidu daily 2026-02-10      # Specific date
```

### 2. Quick Note Lookup

```bash
# By slug
enkidu note show my-note

# By tag
enkidu tag find important

# Recent notes
enkidu note list --limit 10
```

### 3. Batch Operations

```bash
# Rename tag across all notes
enkidu tag rename temp-tag permanent-tag

# Move note to different category
enkidu category move my-note projects
```

### 4. Configuration

```bash
# View all config
enkidu config list

# Change editor
enkidu config set editor "code"

# Get specific value
enkidu config get daily.template

# Edit config file directly
enkidu config edit
```

### 5. Templates

Use different templates when creating notes:

```bash
enkidu note create "Sprint Planning" --template meeting
enkidu note create "New Feature" --template project
```

## Advanced Usage

### Custom Templates

1. Copy a template from `~/.enkidu/templates/`
2. Edit it with your custom structure
3. Use it: `enkidu note create "Note" --template my-custom-template`

### Frontmatter Fields

Standard fields:
```yaml
---
title: Note Title
created: 2026-02-13T10:00:00Z
updated: 2026-02-13T11:30:00Z
tags: [tag1, tag2]
category: projects
type: note  # or: daily, blog
publish: false  # Set to true to sync to Docusaurus
---
```

Custom fields (preserved in sync):
```yaml
---
# ... standard fields ...
author: Your Name
status: draft
priority: high
---
```

### Linking Notes

While wiki-style linking (`[[note-name]]`) is not yet implemented, you can use markdown links:

```markdown
See also: [My Other Note](../reference/my-other-note.md)
```

## Troubleshooting

### Enkidu not initialized

```bash
Error: Enkidu not initialized. Run "enkidu init" first.
```

**Solution**: Run `enkidu init` in your desired directory.

### Editor not opening

**Solution**: Set editor explicitly:
```bash
enkidu config set editor "code"  # or vim, nano, emacs, etc.
```

### Sync target not found

```bash
Error: Sync target directory does not exist
```

**Solution**: Check your Docusaurus path:
```bash
enkidu config get sync.target
enkidu sync config  # Reconfigure
```

### Note not found

**Solution**: List notes to find the correct slug:
```bash
enkidu note list
```

## Next Steps

- Explore the [README](./README.md) for full command reference
- Check [CHANGELOG](./CHANGELOG.md) for updates
- Review [IMPLEMENTATION_STATUS](./IMPLEMENTATION_STATUS.md) for roadmap

## Support

This is currently a personal project. For issues or questions:
- Check existing documentation
- Review the code in `packages/cli/src/`
- Open an issue (after v1.0.0 release)

Happy note-taking! 📝
