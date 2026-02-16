# Changelog

All notable changes to Enkidu CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Wiki-style linking system with backlinks
- Full-text search with fuzzy matching
- Docusaurus sync integration
- Link graph visualization
- Template management commands
- Comprehensive test suite

## [1.0.0-alpha] - 2026-02-13

### Added
- Initial release of Enkidu CLI
- `enkidu init` - Initialize Enkidu directory structure
- `enkidu daily` - Daily note management
  - Create/open daily notes
  - Quick append functionality
  - List daily notes by month
- `enkidu note` - Full note management
  - Create notes with categories and tags
  - Edit existing notes
  - List notes with filters
  - Show note details
  - Delete notes
- `enkidu tag` - Tag management
  - List all tags with counts
  - Find notes by tag
  - Rename tags across all notes
- `enkidu category` - Category management
  - List all categories
  - Move notes between categories
- `enkidu config` - Configuration management
  - Get/set configuration values
  - List all configuration
  - Edit config file in editor
- Built-in templates:
  - daily-default
  - note-default
  - blog-post
  - project
  - meeting
- Filesystem-based storage (all markdown)
- YAML frontmatter support
- Monorepo structure with pnpm workspaces
- TypeScript support
- CLI built with Commander.js

### Technical Details
- Built with TypeScript 5.6
- Uses Commander.js for CLI framework
- gray-matter for frontmatter parsing
- date-fns for date manipulation
- Zod for configuration validation
- tsup for fast building
- ESM-only (Node 20+)

[Unreleased]: https://github.com/user/pkm-cli/compare/v1.0.0-alpha...HEAD
[1.0.0-alpha]: https://github.com/user/pkm-cli/releases/tag/v1.0.0-alpha
