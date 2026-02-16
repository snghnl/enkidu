import chalk from "chalk";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  logToFile?: boolean;
  logFilePath?: string;
  includeTimestamp?: boolean;
}

/**
 * Structured logging system with multiple log levels
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: this.parseLogLevel(process.env.ENKIDU_LOG_LEVEL) ?? LogLevel.INFO,
      logToFile: config.logToFile ?? false,
      logFilePath: config.logFilePath,
      includeTimestamp: config.includeTimestamp ?? true,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Parse log level from string
   */
  private parseLogLevel(level?: string): LogLevel | undefined {
    if (!level) return undefined;

    const levelMap: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
      silent: LogLevel.SILENT,
    };

    return levelMap[level.toLowerCase()];
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Enable/disable file logging
   */
  setFileLogging(enabled: boolean, filePath?: string): void {
    this.config.logToFile = enabled;
    if (filePath) {
      this.config.logFilePath = filePath;
    }
  }

  /**
   * Format log message with timestamp
   */
  private formatMessage(level: string, message: string): string {
    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] ${message}`;
    }
    return `[${level}] ${message}`;
  }

  /**
   * Write to log file
   */
  private writeToFile(message: string): void {
    if (!this.config.logToFile || !this.config.logFilePath) return;

    try {
      const logDir = dirname(this.config.logFilePath);
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }
      appendFileSync(this.config.logFilePath, message + "\n");
    } catch (error) {
      // Silently fail if we can't write to log file
    }
  }

  /**
   * Log debug message (detailed information for debugging)
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.level > LogLevel.DEBUG) return;

    const formattedMessage = this.formatMessage("DEBUG", message);
    console.log(chalk.gray(formattedMessage), ...args);
    this.writeToFile(
      `${formattedMessage} ${args.map((a) => JSON.stringify(a)).join(" ")}`,
    );
  }

  /**
   * Log info message (general information)
   */
  info(message: string, ...args: any[]): void {
    if (this.config.level > LogLevel.INFO) return;

    const formattedMessage = this.formatMessage("INFO", message);
    console.log(chalk.blue("ℹ"), message, ...args);
    this.writeToFile(
      `${formattedMessage} ${args.map((a) => JSON.stringify(a)).join(" ")}`,
    );
  }

  /**
   * Log success message (operation completed successfully)
   */
  success(message: string, ...args: any[]): void {
    if (this.config.level > LogLevel.INFO) return;

    const formattedMessage = this.formatMessage("SUCCESS", message);
    console.log(chalk.green("✓"), message, ...args);
    this.writeToFile(
      `${formattedMessage} ${args.map((a) => JSON.stringify(a)).join(" ")}`,
    );
  }

  /**
   * Log warning message (potential issues)
   */
  warn(message: string, ...args: any[]): void {
    if (this.config.level > LogLevel.WARN) return;

    const formattedMessage = this.formatMessage("WARN", message);
    console.warn(chalk.yellow("⚠"), message, ...args);
    this.writeToFile(
      `${formattedMessage} ${args.map((a) => JSON.stringify(a)).join(" ")}`,
    );
  }

  /**
   * Log error message (errors and failures)
   */
  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.config.level > LogLevel.ERROR) return;

    const formattedMessage = this.formatMessage("ERROR", message);
    console.error(chalk.red("✗"), message, ...args);

    if (error instanceof Error) {
      console.error(chalk.red(error.message));
      if (process.env.DEBUG) {
        console.error(chalk.gray(error.stack));
      }
      this.writeToFile(`${formattedMessage} ${error.message}\n${error.stack}`);
    } else if (error) {
      console.error(chalk.red(String(error)));
      this.writeToFile(`${formattedMessage} ${String(error)}`);
    }
  }

  /**
   * Log a step in a process
   */
  step(step: number, total: number, message: string): void {
    if (this.config.level > LogLevel.INFO) return;

    console.log(chalk.cyan(`[${step}/${total}]`), message);
  }

  /**
   * Create a sub-logger with prefix
   */
  createChild(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix);
  }
}

/**
 * Child logger with automatic prefix
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private prefix: string,
  ) {}

  private addPrefix(message: string): string {
    return `[${this.prefix}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    this.parent.debug(this.addPrefix(message), ...args);
  }

  info(message: string, ...args: any[]): void {
    this.parent.info(this.addPrefix(message), ...args);
  }

  success(message: string, ...args: any[]): void {
    this.parent.success(this.addPrefix(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.parent.warn(this.addPrefix(message), ...args);
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    this.parent.error(this.addPrefix(message), error, ...args);
  }

  step(step: number, total: number, message: string): void {
    this.parent.step(step, total, this.addPrefix(message));
  }
}

/**
 * Global logger instance
 */
export const logger = Logger.getInstance();

/**
 * Initialize logger with configuration
 */
export function initLogger(pkmRoot?: string): void {
  const instance = Logger.getInstance();
  const config: Partial<LoggerConfig> = {
    level:
      instance["parseLogLevel"](process.env.ENKIDU_LOG_LEVEL) ?? LogLevel.INFO,
    includeTimestamp: true,
  };

  if (pkmRoot) {
    config.logToFile = true;
    config.logFilePath = join(pkmRoot, ".enkidu", "logs", "enkidu.log");
  }

  Logger.getInstance(config);
}
