# Changelog

All notable changes to Enkidu will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - v0.1.1 Error Handling & UX Polish

#### Error Handling
- **Structured error handling system** (`utils/errors.ts`)
  - Typed error categories (NOT_INITIALIZED, NOT_FOUND, INVALID_INPUT, etc.)
  - Automatic suggestion generation based on error type
  - Context information for debugging
  - Consistent error formatting across all commands
  - `ErrorHandler` class with helper methods for common error scenarios

#### Logging System
- **Multi-level logging system** (`utils/logger.ts`)
  - Five log levels: DEBUG, INFO, WARN, ERROR, SILENT
  - Automatic file logging to `.enkidu/logs/enkidu.log` in workspace
  - Environment variable configuration via `ENKIDU_LOG_LEVEL`
  - Colored console output for better readability
  - Child loggers with automatic prefixes
  - Timestamp support for log entries

#### Progress Indicators
- **Spinner and progress indicators** (`utils/spinner.ts`)
  - Simple spinner for single operations using ora
  - Multi-step progress indicators with step tracking
  - Success/failure/warning states
  - Auto-cleanup on completion
  - Helper functions for common patterns

#### User Prompts
- **Interactive prompts system** (`utils/prompts.ts`)
  - Confirmation prompts with warning support
  - Selection lists (single and multi-select)
  - Text input with validation
  - Destructive action warnings with extra safety
  - Pre-configured common prompts (delete, select editor, etc.)

#### Command Helpers
- **Reusable command utilities** (`utils/command-helpers.ts`)
  - Unified command initialization pattern
  - Input validation helpers (dates, enums, integers)
  - Type-safe validation functions
  - DRY command setup

#### Command Updates
- **Updated `note` command** - Full implementation with all new utilities
  - Better error messages with suggestions
  - Progress spinners for operations
  - Improved confirmation prompts for deletions
  - Colorful, informative output
  - Helpful tips when no notes found

- **Updated `search` command** - Enhanced search experience
  - Multi-step progress indicators
  - Input validation with helpful errors
  - Improved result display with colors
  - Search tips when no results found
  - Better date and filter validation

- **Updated `init` command** - Improved initialization flow
  - Interactive setup wizard with better prompts
  - Multi-step progress tracking
  - Clearer success messages
  - Helpful next steps

#### Documentation
- **Comprehensive examples** (`docs/error-handling-examples.md`)
  - Usage examples for all utilities
  - Common patterns and recipes
  - API documentation
  - Migration guide for updating commands

- **Utilities README** (`packages/cli/src/utils/README.md`)
  - Complete API reference
  - Design principles
  - Testing guidelines
  - Migration checklist

### Changed

- Error messages now include actionable suggestions
- All long-running operations show progress indicators
- Destructive actions now require explicit confirmation
- Console output is more colorful and organized
- Logging can be controlled via `ENKIDU_LOG_LEVEL` environment variable

### Technical Details

**New Files:**
- `src/utils/errors.ts` - Error handling system
- `src/utils/logger.ts` - Logging system
- `src/utils/spinner.ts` - Progress indicators
- `src/utils/prompts.ts` - User interaction
- `src/utils/command-helpers.ts` - Common patterns
- `src/utils/README.md` - Utilities documentation
- `docs/error-handling-examples.md` - Examples and guides

**Modified Files:**
- `src/commands/note.ts` - Integrated all new utilities
- `src/commands/search.ts` - Added progress indicators and better errors
- `src/commands/init.ts` - Enhanced initialization flow
- `src/cli.ts` - Initialize logger on startup
- `spec/v0.1.0-completion-status.md` - Marked features as completed

**Dependencies:**
- All required dependencies (ora, inquirer, chalk) were already installed
- No new dependencies added

**Testing:**
- Project builds successfully with `pnpm build`
- TypeScript compilation passes (existing test failures are pre-existing)
- All new utilities are ready for use in commands

## [0.1.0] - 2026-02-16

### Added

#### Core Features
- **Wiki-style linking system** with backlinks support
- **Full-text search** with fuzzy matching and filtering
- **Template management** with validation
- Comprehensive test suite with 85%+ coverage
- Test utilities and fixtures

#### CLI Commands
- `enkidu init` - Initialize workspace
- `enkidu note create/edit/show/list/delete` - Note management
- `enkidu daily` - Daily notes
- `enkidu search` - Full-text search
- `enkidu link show/backlinks/validate/stats` - Link management
- `enkidu template list/validate` - Template management
- `enkidu config` - Configuration management
- `enkidu tag` - Tag management
- `enkidu category` - Category management
- `enkidu sync` - Docusaurus synchronization

### Technical
- TypeScript with strict mode
- Monorepo with pnpm workspaces
- Vitest for testing
- Commander for CLI
- Fuse.js for search
- Gray-matter for frontmatter

---

## Version Roadmap

### v0.1.1 (Current) - Quality & Polish
- ✅ Error handling & UX polish
- 🔄 Performance optimization
- 🔄 Enhanced documentation

### v0.2.0 - Publishing
- Docusaurus sync enhancements
- Link graph visualization
- Interactive search mode

### v1.0.0 - Production
- Git integration
- Cloud sync
- Advanced features
