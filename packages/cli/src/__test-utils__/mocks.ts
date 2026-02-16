import { vi } from 'vitest';

/**
 * Mock utilities for testing
 */

/**
 * Mock console methods to suppress output during tests
 */
export function mockConsole() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };
}

/**
 * Restore console methods
 */
export function restoreConsole(mocks: ReturnType<typeof mockConsole>) {
  Object.values(mocks).forEach((mock) => mock.mockRestore());
}

/**
 * Mock editor opening
 */
export function mockEditor() {
  return vi.fn().mockResolvedValue(undefined);
}

/**
 * Mock inquirer prompts
 */
export function mockInquirer(answers: Record<string, any>) {
  return {
    prompt: vi.fn().mockResolvedValue(answers),
  };
}

/**
 * Mock date for consistent testing
 */
export function mockDate(dateString: string) {
  const fixedDate = new Date(dateString);
  const original = global.Date;

  global.Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(fixedDate);
      } else {
        super(...args);
      }
    }

    static now() {
      return fixedDate.getTime();
    }
  } as any;

  return () => {
    global.Date = original;
  };
}

/**
 * Mock process.exit to prevent test termination
 */
export function mockProcessExit() {
  const original = process.exit;
  const mock = vi.fn() as any;
  process.exit = mock;

  return {
    mock,
    restore: () => {
      process.exit = original;
    },
  };
}

/**
 * Create a mock file system error
 */
export function createFsError(code: string, message: string) {
  const error: any = new Error(message);
  error.code = code;
  return error;
}
