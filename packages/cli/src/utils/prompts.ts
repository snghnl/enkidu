import inquirer from "inquirer";
import chalk from "chalk";

/**
 * Confirmation prompt options
 */
export interface ConfirmOptions {
  message: string;
  default?: boolean;
  warning?: boolean;
}

/**
 * Select prompt options
 */
export interface SelectOptions {
  message: string;
  choices: Array<string | { name: string; value: any; description?: string }>;
  default?: any;
}

/**
 * Input prompt options
 */
export interface InputOptions {
  message: string;
  default?: string;
  validate?: (input: string) => boolean | string;
}

/**
 * Prompt utilities for user interaction
 */
export class Prompts {
  /**
   * Ask for confirmation
   */
  static async confirm(options: ConfirmOptions): Promise<boolean> {
    const message = options.warning
      ? chalk.yellow(`⚠  ${options.message}`)
      : options.message;

    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message,
        default: options.default ?? false,
      },
    ]);

    return confirmed;
  }

  /**
   * Ask user to select from a list
   */
  static async select<T = string>(options: SelectOptions): Promise<T> {
    // If default is provided and choices contain objects with values,
    // find the index of the choice with matching value
    let defaultIndex: number | undefined = undefined;

    if (options.default !== undefined && Array.isArray(options.choices)) {
      const index = options.choices.findIndex((choice) => {
        if (
          typeof choice === "object" &&
          choice !== null &&
          "value" in choice
        ) {
          return choice.value === options.default;
        }
        return choice === options.default;
      });

      if (index !== -1) {
        defaultIndex = index;
      }
    }

    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message: options.message,
        choices: options.choices,
        default: defaultIndex,
      },
    ]);

    return selected;
  }

  /**
   * Ask user for text input
   */
  static async input(options: InputOptions): Promise<string> {
    const promptConfig: any = {
      type: "input",
      name: "value",
      message: options.message,
      default: options.default,
    };

    // Only add validate if it's provided
    if (options.validate) {
      promptConfig.validate = options.validate;
    }

    const { value } = await inquirer.prompt([promptConfig]);

    return value;
  }

  /**
   * Ask user for multiple selections
   */
  static async multiSelect<T = string>(options: SelectOptions): Promise<T[]> {
    const { selected } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selected",
        message: options.message,
        choices: options.choices,
      },
    ]);

    return selected;
  }

  /**
   * Confirm a destructive action with extra warning
   */
  static async confirmDestructive(
    action: string,
    target: string,
    details?: string,
  ): Promise<boolean> {
    console.log(chalk.yellow("\n⚠  Destructive Action Warning"));
    console.log(chalk.white(`   Action: ${action}`));
    console.log(chalk.white(`   Target: ${target}`));
    if (details) {
      console.log(chalk.gray(`   ${details}`));
    }
    console.log();

    return this.confirm({
      message: `Are you sure you want to ${action}?`,
      default: false,
      warning: true,
    });
  }

  /**
   * Show a list and ask user to select one
   */
  static async selectFromList<
    T extends { id: string; name: string; description?: string },
  >(
    items: T[],
    options: {
      message: string;
      emptyMessage?: string;
      formatItem?: (item: T) => string;
    },
  ): Promise<T | null> {
    if (items.length === 0) {
      console.log(chalk.yellow(options.emptyMessage ?? "No items available."));
      return null;
    }

    const choices = items.map((item) => ({
      name: options.formatItem ? options.formatItem(item) : item.name,
      value: item,
      short: item.name,
    }));

    return this.select<T>({
      message: options.message,
      choices,
    });
  }

  /**
   * Ask for confirmation with a typed verification
   */
  static async confirmWithVerification(
    message: string,
    verificationWord: string,
  ): Promise<boolean> {
    console.log(chalk.yellow(`\n⚠  ${message}`));
    console.log(chalk.gray(`   Type "${verificationWord}" to confirm.`));
    console.log();

    const input = await this.input({
      message: "Type the verification word:",
      validate: (value) => {
        if (value !== verificationWord) {
          return `Please type "${verificationWord}" to confirm`;
        }
        return true;
      },
    });

    return input === verificationWord;
  }
}

/**
 * Pre-configured prompts for common scenarios
 */
export const prompts = {
  /**
   * Confirm deletion of a note
   */
  async confirmDelete(itemName: string, itemType = "note"): Promise<boolean> {
    return Prompts.confirmDestructive(
      `delete this ${itemType}`,
      itemName,
      "This action cannot be undone.",
    );
  },

  /**
   * Confirm overwrite of existing file
   */
  async confirmOverwrite(filePath: string): Promise<boolean> {
    return Prompts.confirm({
      message: `File already exists: ${filePath}. Overwrite?`,
      default: false,
      warning: true,
    });
  },

  /**
   * Select a template
   */
  async selectTemplate(templates: string[]): Promise<string | null> {
    if (templates.length === 0) {
      console.log(chalk.yellow("No templates available."));
      return null;
    }

    return Prompts.select({
      message: "Select a template:",
      choices: templates,
    });
  },

  /**
   * Select an editor
   */
  async selectEditor(): Promise<string> {
    return Prompts.select({
      message: "Select your preferred editor:",
      choices: [
        { name: "VS Code", value: "code" },
        { name: "Vim", value: "vim" },
        { name: "Neovim", value: "nvim" },
        { name: "Nano", value: "nano" },
        { name: "Emacs", value: "emacs" },
        { name: "System default", value: "default" },
      ],
      default: "code",
    });
  },

  /**
   * Ask for note title
   */
  async askTitle(defaultTitle?: string): Promise<string> {
    return Prompts.input({
      message: "Note title:",
      default: defaultTitle,
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return "Title cannot be empty";
        }
        return true;
      },
    });
  },

  /**
   * Ask for category
   */
  async askCategory(categories: string[]): Promise<string> {
    const choices = [
      ...categories,
      { name: chalk.gray("+ New category"), value: "__new__" },
    ];

    const selected = await Prompts.select({
      message: "Select category:",
      choices,
    });

    if (selected === "__new__") {
      return Prompts.input({
        message: "Enter new category name:",
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return "Category cannot be empty";
          }
          if (!/^[a-z0-9-]+$/.test(value)) {
            return "Category must contain only lowercase letters, numbers, and hyphens";
          }
          return true;
        },
      });
    }

    return selected;
  },

  /**
   * Ask for tags
   */
  async askTags(availableTags: string[] = []): Promise<string[]> {
    if (availableTags.length === 0) {
      const input = await Prompts.input({
        message: "Tags (comma-separated):",
        default: "",
      });
      return input
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    const choices = [
      ...availableTags.map((tag) => ({ name: tag, value: tag })),
      { name: chalk.gray("+ Add new tags"), value: "__new__" },
    ];

    const selected = await Prompts.multiSelect<string>({
      message: "Select tags:",
      choices,
    });

    if (selected.includes("__new__")) {
      const newTags = await Prompts.input({
        message: "Enter new tags (comma-separated):",
        default: "",
      });
      const additional = newTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      return [...selected.filter((t) => t !== "__new__"), ...additional];
    }

    return selected;
  },
};
