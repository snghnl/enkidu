import { ConfigManager, getConfigManager } from "../core/config/manager.js";
import { NoteManager } from "../core/note/manager.js";
import { ErrorHandler } from "./errors.js";
import { initLogger } from "./logger.js";

/**
 * Initialize a command with common setup
 * Returns configured managers
 */
export async function initializeCommand(): Promise<{
  enkiduRoot: string;
  configManager: ReturnType<typeof getConfigManager>;
  noteManager: NoteManager;
}> {
  const enkiduRoot = ConfigManager.findEnkiduRoot();

  if (!enkiduRoot) {
    throw ErrorHandler.notInitialized();
  }

  // Initialize logger for this workspace
  initLogger(enkiduRoot);

  const configManager = getConfigManager();
  await configManager.loadConfig(enkiduRoot);

  const noteManager = new NoteManager(enkiduRoot);
  await noteManager.initialize();

  return { enkiduRoot, configManager, noteManager };
}

/**
 * Validate date string in YYYY-MM-DD format
 */
export function validateDate(dateStr: string, fieldName = "date"): Date {
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    throw ErrorHandler.invalidInput(
      fieldName,
      dateStr,
      "Date must be in format: YYYY-MM-DD",
    );
  }

  return date;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName = "value",
): T {
  if (!allowedValues.includes(value as T)) {
    throw ErrorHandler.invalidInput(
      fieldName,
      value,
      `Must be one of: ${allowedValues.join(", ")}`,
    );
  }

  return value as T;
}

/**
 * Parse integer with validation
 */
export function parseInteger(
  value: string,
  fieldName = "number",
  options?: { min?: number; max?: number },
): number {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw ErrorHandler.invalidInput(
      fieldName,
      value,
      "Must be a valid integer",
    );
  }

  if (options?.min !== undefined && num < options.min) {
    throw ErrorHandler.invalidInput(
      fieldName,
      value,
      `Must be at least ${options.min}`,
    );
  }

  if (options?.max !== undefined && num > options.max) {
    throw ErrorHandler.invalidInput(
      fieldName,
      value,
      `Must be at most ${options.max}`,
    );
  }

  return num;
}
