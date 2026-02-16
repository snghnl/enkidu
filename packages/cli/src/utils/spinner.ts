import ora, { Ora, Options as OraOptions } from 'ora';
import chalk from 'chalk';

/**
 * Spinner manager for progress indicators
 */
export class SpinnerManager {
  private spinner: Ora | null = null;

  /**
   * Start a spinner with a message
   */
  start(text: string, options?: OraOptions): Ora {
    this.spinner = ora({
      text,
      ...options,
    }).start();
    return this.spinner;
  }

  /**
   * Update spinner text
   */
  update(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  /**
   * Mark spinner as successful
   */
  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  /**
   * Mark spinner as failed
   */
  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  /**
   * Mark spinner as warning
   */
  warn(text?: string): void {
    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner without marking status
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Check if spinner is currently active
   */
  isActive(): boolean {
    return this.spinner !== null;
  }

  /**
   * Get current spinner instance
   */
  getInstance(): Ora | null {
    return this.spinner;
  }
}

/**
 * Progress indicator for multi-step operations
 */
export class ProgressIndicator {
  private currentStep = 0;
  private spinner: SpinnerManager;

  constructor(
    private steps: string[],
    private totalSteps?: number
  ) {
    this.spinner = new SpinnerManager();
    this.totalSteps = totalSteps ?? steps.length;
  }

  /**
   * Start the progress indicator
   */
  start(): void {
    this.nextStep();
  }

  /**
   * Move to next step
   */
  nextStep(customMessage?: string): void {
    this.currentStep++;

    if (this.currentStep > this.totalSteps!) {
      return;
    }

    const message = customMessage ?? this.steps[this.currentStep - 1];
    const progress = chalk.cyan(`[${this.currentStep}/${this.totalSteps}]`);

    if (this.spinner.isActive()) {
      this.spinner.succeed();
    }

    this.spinner.start(`${progress} ${message}`);
  }

  /**
   * Update current step message
   */
  update(message: string): void {
    const progress = chalk.cyan(`[${this.currentStep}/${this.totalSteps}]`);
    this.spinner.update(`${progress} ${message}`);
  }

  /**
   * Complete the progress indicator successfully
   */
  complete(message?: string): void {
    this.spinner.succeed(message ?? chalk.green('Done!'));
  }

  /**
   * Fail the progress indicator
   */
  fail(message?: string): void {
    this.spinner.fail(message ?? chalk.red('Failed'));
  }

  /**
   * Stop the progress indicator
   */
  stop(): void {
    this.spinner.stop();
  }
}

/**
 * Helper functions for common spinner patterns
 */
export const spinner = {
  /**
   * Run an async operation with a spinner
   */
  async run<T>(
    text: string,
    operation: () => Promise<T>,
    options?: {
      successText?: string;
      failText?: string;
    }
  ): Promise<T> {
    const spinnerManager = new SpinnerManager();
    spinnerManager.start(text);

    try {
      const result = await operation();
      spinnerManager.succeed(options?.successText);
      return result;
    } catch (error) {
      spinnerManager.fail(options?.failText);
      throw error;
    }
  },

  /**
   * Create a simple spinner
   */
  create(text: string, options?: OraOptions): SpinnerManager {
    const spinnerManager = new SpinnerManager();
    spinnerManager.start(text, options);
    return spinnerManager;
  },

  /**
   * Create a progress indicator for multiple steps
   */
  progress(steps: string[]): ProgressIndicator {
    return new ProgressIndicator(steps);
  },
};

/**
 * Example usage:
 *
 * // Simple spinner
 * const result = await spinner.run(
 *   'Loading notes...',
 *   async () => await noteManager.listNotes(),
 *   { successText: 'Notes loaded!' }
 * );
 *
 * // Multi-step progress
 * const progress = spinner.progress([
 *   'Reading configuration',
 *   'Building search index',
 *   'Caching results',
 * ]);
 * progress.start();
 * await doStep1();
 * progress.nextStep();
 * await doStep2();
 * progress.nextStep();
 * await doStep3();
 * progress.complete();
 *
 * // Manual control
 * const s = spinner.create('Processing...');
 * await doWork();
 * s.update('Almost done...');
 * await moreWork();
 * s.succeed('Done!');
 */
