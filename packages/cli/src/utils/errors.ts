import chalk from "chalk";

/**
 * Error types with suggested actions
 */
export enum ErrorType {
  NOT_INITIALIZED = "NOT_INITIALIZED",
  NOT_FOUND = "NOT_FOUND",
  INVALID_INPUT = "INVALID_INPUT",
  FILE_SYSTEM = "FILE_SYSTEM",
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

/**
 * Enhanced error class with context and suggestions
 */
export class EnkiduError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType,
    public readonly suggestions: string[] = [],
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = "EnkiduError";
  }
}

/**
 * Error handler that displays formatted error messages with suggestions
 */
export class ErrorHandler {
  /**
   * Handle and display error with suggestions
   */
  static handle(error: unknown, exitCode = 1): never {
    console.error(); // Empty line for spacing

    if (error instanceof EnkiduError) {
      // Display the error message
      console.error(chalk.red("✗ Error:"), chalk.red(error.message));

      // Display context if available
      if (error.context && Object.keys(error.context).length > 0) {
        console.error(chalk.gray("\nContext:"));
        for (const [key, value] of Object.entries(error.context)) {
          console.error(chalk.gray(`  ${key}:`), value);
        }
      }

      // Display suggestions if available
      if (error.suggestions.length > 0) {
        console.error(chalk.yellow("\nSuggestions:"));
        for (const suggestion of error.suggestions) {
          console.error(chalk.yellow("  •"), suggestion);
        }
      }
    } else if (error instanceof Error) {
      // Standard error
      console.error(chalk.red("✗ Error:"), chalk.red(error.message));

      // Show stack trace in debug mode
      if (process.env.DEBUG) {
        console.error(chalk.gray("\nStack trace:"));
        console.error(chalk.gray(error.stack));
      }
    } else {
      // Unknown error
      console.error(chalk.red("✗ Unknown error:"), error);
    }

    console.error(); // Empty line for spacing
    process.exit(exitCode);
  }

  /**
   * Create a "not initialized" error
   */
  static notInitialized(): EnkiduError {
    return new EnkiduError(
      "Enkidu has not been initialized in this directory",
      ErrorType.NOT_INITIALIZED,
      [
        'Run "enkidu init" to initialize a new Enkidu workspace',
        "Navigate to an existing Enkidu workspace directory",
        "Check that you have a .enkidu folder in your workspace",
      ],
    );
  }

  /**
   * Create a "not found" error with suggestions
   */
  static notFound(
    itemType: string,
    identifier: string,
    suggestions: string[] = [],
  ): EnkiduError {
    return new EnkiduError(
      `${itemType} not found: ${identifier}`,
      ErrorType.NOT_FOUND,
      suggestions.length > 0
        ? suggestions
        : [
            `Check that the ${itemType.toLowerCase()} exists`,
            `Use "enkidu ${itemType.toLowerCase()} list" to see available ${itemType.toLowerCase()}s`,
            `Check for typos in the ${itemType.toLowerCase()} identifier`,
          ],
      { itemType, identifier },
    );
  }

  /**
   * Create an "invalid input" error
   */
  static invalidInput(
    field: string,
    value: any,
    requirements: string,
  ): EnkiduError {
    return new EnkiduError(
      `Invalid ${field}: ${value}`,
      ErrorType.INVALID_INPUT,
      [requirements, `Check the documentation for valid ${field} formats`],
      { field, value },
    );
  }

  /**
   * Create a "validation" error
   */
  static validation(message: string, issues: string[] = []): EnkiduError {
    return new EnkiduError(
      message,
      ErrorType.VALIDATION,
      issues.length > 0
        ? issues.map((issue) => `Fix: ${issue}`)
        : ["Check the input and try again"],
    );
  }

  /**
   * Create a "file system" error
   */
  static fileSystem(
    operation: string,
    path: string,
    reason?: string,
  ): EnkiduError {
    const suggestions = [
      "Check that you have the necessary permissions",
      "Ensure the path is correct",
    ];

    if (reason?.includes("ENOENT")) {
      suggestions.unshift("The file or directory does not exist");
    } else if (reason?.includes("EACCES")) {
      suggestions.unshift("You do not have permission to access this file");
    } else if (reason?.includes("EEXIST")) {
      suggestions.unshift("The file or directory already exists");
    }

    return new EnkiduError(
      `Failed to ${operation}: ${path}`,
      ErrorType.FILE_SYSTEM,
      suggestions,
      { operation, path, reason },
    );
  }

  /**
   * Wrap an async function with error handling
   */
  static wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    };
  }
}

/**
 * Common error messages and suggestions
 */
export const ErrorMessages = {
  NOT_INITIALIZED: 'Enkidu has not been initialized. Run "enkidu init" first.',

  INVALID_DATE: (value: string) =>
    `Invalid date format: ${value}. Expected format: YYYY-MM-DD`,

  INVALID_TYPE: (value: string, allowed: string[]) =>
    `Invalid type: ${value}. Must be one of: ${allowed.join(", ")}`,

  NOTE_NOT_FOUND: (slug: string) => `Note not found: ${slug}`,

  TEMPLATE_NOT_FOUND: (name: string) => `Template not found: ${name}`,

  INVALID_SLUG: (slug: string) =>
    `Invalid slug: ${slug}. Slugs must contain only lowercase letters, numbers, and hyphens.`,
};

/**
 * Helpful tips for common scenarios
 */
export const Tips = {
  FIRST_TIME: [
    chalk.cyan("Tip:"),
    "This is your first time using Enkidu!",
    "Try these commands to get started:",
    '  • enkidu note create "My First Note"',
    "  • enkidu daily",
    '  • enkidu search "keyword"',
  ].join("\n"),

  AFTER_CREATE: () =>
    [
      chalk.cyan("\nNext steps:"),
      `  • Edit your note: enkidu note edit`,
      `  • Add links: [[other-note]]`,
      `  • Search notes: enkidu search "keyword"`,
    ].join("\n"),

  SEARCH_NO_RESULTS: [
    chalk.cyan("\nTips:"),
    "  • Try different keywords",
    "  • Use broader search terms",
    "  • Check spelling",
    "  • Search without filters to see all results",
  ].join("\n"),

  LINK_BROKEN: [
    chalk.cyan("\nTo fix broken links:"),
    '  • Use "enkidu link validate --fix" for suggestions',
    "  • Check the note name spelling",
    "  • Ensure the linked note exists",
  ].join("\n"),
};
