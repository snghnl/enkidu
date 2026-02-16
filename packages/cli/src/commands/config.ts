import { Command } from "commander";
import { getConfigManager } from "../core/config/manager.js";
import { execa } from "execa";

export const configCommand = new Command("config")
  .description("Manage Enkidu configuration")
  .addCommand(
    new Command("get")
      .description("Get a configuration value")
      .argument("<key>", "Configuration key (e.g., daily.path)")
      .action(async (key: string) => {
        try {
          const manager = getConfigManager();
          await manager.loadConfig();
          const value = manager.getConfigValue(key);

          if (value === undefined) {
            console.error(`Configuration key "${key}" not found`);
            process.exit(1);
          }

          if (typeof value === "object") {
            console.log(JSON.stringify(value, null, 2));
          } else {
            console.log(value);
          }
        } catch (error) {
          console.error(
            "Error getting config:",
            error instanceof Error ? error.message : error,
          );
          process.exit(1);
        }
      }),
  )
  .addCommand(
    new Command("set")
      .description("Set a configuration value")
      .argument("<key>", "Configuration key (e.g., daily.path)")
      .argument("<value>", "Value to set")
      .action(async (key: string, value: string) => {
        try {
          const manager = getConfigManager();
          await manager.loadConfig();

          // Try to parse value as JSON, fallback to string
          let parsedValue: any = value;
          try {
            parsedValue = JSON.parse(value);
          } catch {
            // Keep as string
          }

          await manager.setConfigValue(key, parsedValue);
          console.log(`✓ Set ${key} = ${value}`);
        } catch (error) {
          console.error(
            "Error setting config:",
            error instanceof Error ? error.message : error,
          );
          process.exit(1);
        }
      }),
  )
  .addCommand(
    new Command("list")
      .description("List all configuration values")
      .action(async () => {
        try {
          const manager = getConfigManager();
          await manager.loadConfig();
          const config = manager.getConfig();

          console.log(JSON.stringify(config, null, 2));
        } catch (error) {
          console.error(
            "Error listing config:",
            error instanceof Error ? error.message : error,
          );
          process.exit(1);
        }
      }),
  )
  .addCommand(
    new Command("edit")
      .description("Open configuration file in editor")
      .action(async () => {
        try {
          const manager = getConfigManager();
          await manager.loadConfig();
          const config = manager.getConfig();
          const editor = config.editor || process.env.EDITOR || "vim";

          // Get config file path
          const configPath = `${config.rootDir}/.enkidu/config.json`;

          // Open in editor
          await execa(editor, [configPath], { stdio: "inherit" });
        } catch (error) {
          console.error(
            "Error opening config editor:",
            error instanceof Error ? error.message : error,
          );
          process.exit(1);
        }
      }),
  );
