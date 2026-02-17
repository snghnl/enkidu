import { cosmiconfig } from "cosmiconfig";
import { join, dirname } from "path";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  readdirSync,
} from "fs";
import { fileURLToPath } from "url";
import { EnkiduConfig, enkiduConfigSchema } from "./schema.js";
import { getDefaultConfig } from "./defaults.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_NAME = "enkidu";

export class ConfigManager {
  private config: EnkiduConfig | null = null;
  private configPath: string | null = null;

  /**
   * Load configuration from file or use defaults
   */
  async loadConfig(searchFrom?: string): Promise<EnkiduConfig> {
    const explorer = cosmiconfig(CONFIG_NAME, {
      searchPlaces: [
        ".enkidu/config.json",
        ".enkidu/config.yaml",
        ".enkidu/config.yml",
        ".enkidu/config.js",
        `${CONFIG_NAME}.config.json`,
        `${CONFIG_NAME}.config.js`,
      ],
    });

    try {
      const result = await explorer.search(searchFrom);

      if (result && result.config) {
        // Validate and merge with defaults
        const validated = enkiduConfigSchema.parse({
          ...getDefaultConfig(),
          ...result.config,
        });

        this.config = validated;
        this.configPath = result.filepath;
        return validated;
      }
    } catch (error) {
      // If config file exists but is invalid, throw error
      if (error instanceof Error) {
        throw new Error(`Invalid configuration: ${error.message}`);
      }
    }

    // No config found, return defaults
    const defaultConfig = getDefaultConfig();
    this.config = defaultConfig;
    return defaultConfig;
  }

  /**
   * Get current configuration
   */
  getConfig(): EnkiduConfig {
    if (!this.config) {
      throw new Error("Configuration not loaded. Call loadConfig() first.");
    }
    return this.config;
  }

  /**
   * Get configuration value by key path (e.g., 'daily.path')
   */
  getConfigValue(keyPath: string): any {
    const config = this.getConfig();
    const keys = keyPath.split(".");
    let value: any = config;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set configuration value by key path
   */
  async setConfigValue(keyPath: string, value: any): Promise<void> {
    const config = this.getConfig();
    const keys = keyPath.split(".");
    let current: any = config;

    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    // Set the value
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;

    // Validate the updated config
    const validated = enkiduConfigSchema.parse(config);
    this.config = validated;

    // Save to file
    await this.saveConfig();
  }

  /**
   * Save configuration to file
   */
  async saveConfig(customPath?: string): Promise<void> {
    const config = this.getConfig();
    const targetPath =
      customPath ||
      this.configPath ||
      join(config.rootDir, ".enkidu", "config.json");

    // Ensure directory exists
    const dir = join(targetPath, "..");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write config as pretty JSON
    writeFileSync(targetPath, JSON.stringify(config, null, 2), "utf-8");
    this.configPath = targetPath;
  }

  /**
   * Initialize a new Enkidu configuration
   */
  async initConfig(
    rootDir: string,
    options: Partial<EnkiduConfig> = {},
  ): Promise<EnkiduConfig> {
    const defaultConfig = getDefaultConfig(rootDir);
    const newConfig = enkiduConfigSchema.parse({
      ...defaultConfig,
      ...options,
      rootDir, // Ensure rootDir is set correctly
    });

    this.config = newConfig;

    // Create directory structure
    const dirs = [
      rootDir,
      join(rootDir, ".enkidu"),
      join(rootDir, ".enkidu", "templates"),
      join(rootDir, ".enkidu", "cache"),
      join(rootDir, "daily"),
      join(rootDir, "notes"),
      join(rootDir, "blog"),
      join(rootDir, "attachments"),
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    // Copy built-in templates to .enkidu/templates/
    await this.copyBuiltInTemplates(rootDir);

    // Save config
    await this.saveConfig(join(rootDir, ".enkidu", "config.json"));

    return newConfig;
  }

  /**
   * Copy built-in templates to user's .enkidu/templates directory
   */
  private async copyBuiltInTemplates(rootDir: string): Promise<void> {
    const builtInTemplatesPath = join(__dirname, "../templates");
    const customTemplatesPath = join(rootDir, ".enkidu", "templates");

    // Ensure templates directory exists
    if (!existsSync(customTemplatesPath)) {
      mkdirSync(customTemplatesPath, { recursive: true });
    }

    // Check if built-in templates directory exists
    if (!existsSync(builtInTemplatesPath)) {
      return; // Skip if templates directory doesn't exist
    }

    // Copy all .md files from built-in templates
    const templateFiles = readdirSync(builtInTemplatesPath).filter((file) =>
      file.endsWith(".md"),
    );

    for (const file of templateFiles) {
      const sourcePath = join(builtInTemplatesPath, file);
      const destPath = join(customTemplatesPath, file);

      // Only copy if destination doesn't exist (don't overwrite user templates)
      if (!existsSync(destPath)) {
        copyFileSync(sourcePath, destPath);
      }
    }
  }

  /**
   * Check if Enkidu is initialized in a directory
   */
  static isInitialized(dir: string): boolean {
    return existsSync(join(dir, ".enkidu", "config.json"));
  }

  /**
   * Find Enkidu root directory by searching upwards
   */
  static findEnkiduRoot(startDir: string = process.cwd()): string | null {
    let currentDir = startDir;
    const root = "/";

    while (currentDir !== root) {
      if (this.isInitialized(currentDir)) {
        return currentDir;
      }
      const parentDir = join(currentDir, "..");
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }

    return null;
  }

  /**
   * Static helper to load configuration (convenience method)
   */
  static async load(searchFrom?: string): Promise<EnkiduConfig> {
    const manager = getConfigManager();
    return await manager.loadConfig(searchFrom);
  }
}

// Singleton instance
let configManager: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager();
  }
  return configManager;
}
