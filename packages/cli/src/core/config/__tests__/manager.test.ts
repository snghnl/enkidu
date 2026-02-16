import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "path";
import { ConfigManager } from "../manager.js";
import { TestFixtures } from "../../../__test-utils__/fixtures.js";
import { fileExists, readFile, writeFile } from "../../../utils/fs.js";

describe("ConfigManager", () => {
  let tempDir: string;
  let fixtures: TestFixtures;
  let configManager: ConfigManager;

  beforeEach(() => {
    tempDir = TestFixtures.createTempDir("config-manager-");
    fixtures = new TestFixtures(tempDir);
    configManager = new ConfigManager();
  });

  afterEach(() => {
    TestFixtures.cleanup(tempDir);
  });

  describe("loadConfig", () => {
    it("should load config from .enkidu/config.json", async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig();

      const config = await configManager.loadConfig(tempDir);

      expect(config).toBeDefined();
      expect(config.version).toBe("1.0.0");
    });

    it("should return defaults when no config file exists", async () => {
      const config = await configManager.loadConfig(tempDir);

      expect(config).toBeDefined();
      expect(config.enkidu).toBeDefined();
      expect(config.daily).toBeDefined();
    });

    it("should merge custom config with defaults", async () => {
      fixtures.initEnkiduStructure();
      const partialConfig = {
        version: "1.0.0",
        enkidu: {
          notesDir: "custom-notes",
        },
      };

      const configPath = join(tempDir, ".enkidu", "config.json");
      writeFile(configPath, JSON.stringify(partialConfig));

      const config = await configManager.loadConfig(tempDir);

      expect(config.enkidu.notesDir).toBe("custom-notes");
      expect(config.daily).toBeDefined(); // Default should be present
    });

    it("should throw error for invalid config", async () => {
      fixtures.initEnkiduStructure();
      const invalidConfig = {
        version: "invalid",
        enkidu: "not-an-object",
      };

      const configPath = join(tempDir, ".enkidu", "config.json");
      writeFile(configPath, JSON.stringify(invalidConfig));

      await expect(configManager.loadConfig(tempDir)).rejects.toThrow(
        "Invalid configuration",
      );
    });

    it("should validate config schema", async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig({
        enkidu: {
          notesDir: "notes",
          templatesDir: "templates",
        },
      });

      const config = await configManager.loadConfig(tempDir);

      expect(config.enkidu.notesDir).toBe("notes");
      expect(config.enkidu.templatesDir).toBe("templates");
    });

    it("should search from specified directory", async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig();

      const subDir = join(tempDir, "notes", "blog");
      const config = await configManager.loadConfig(subDir);

      expect(config).toBeDefined();
    });
  });

  describe("getConfig", () => {
    it("should return loaded config", async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig();

      await configManager.loadConfig(tempDir);
      const config = configManager.getConfig();

      expect(config).toBeDefined();
      expect(config.version).toBe("1.0.0");
    });

    it("should throw error if config not loaded", () => {
      expect(() => configManager.getConfig()).toThrow(
        "Configuration not loaded",
      );
    });

    it("should return same instance on multiple calls", async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig();

      await configManager.loadConfig(tempDir);
      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();

      expect(config1).toBe(config2);
    });
  });

  describe("getConfigValue", () => {
    beforeEach(async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig({
        daily: {
          enabled: true,
          directory: "notes/daily",
          template: "daily-default",
        },
      });
      await configManager.loadConfig(tempDir);
    });

    it("should get nested config value", () => {
      const value = configManager.getConfigValue("daily.enabled");

      expect(value).toBe(true);
    });

    it("should get top-level config value", () => {
      const value = configManager.getConfigValue("version");

      expect(value).toBe("1.0.0");
    });

    it("should return undefined for non-existent key", () => {
      const value = configManager.getConfigValue("non.existent.key");

      expect(value).toBeUndefined();
    });

    it("should get object values", () => {
      const value = configManager.getConfigValue("daily");

      expect(value).toBeTypeOf("object");
      expect(value.enabled).toBe(true);
    });

    it("should handle deep nesting", () => {
      const value = configManager.getConfigValue("daily.directory");

      expect(value).toBe("notes/daily");
    });
  });

  describe("setConfigValue", () => {
    beforeEach(async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig();
      await configManager.loadConfig(tempDir);
    });

    it("should set nested config value", async () => {
      await configManager.setConfigValue("daily.enabled", false);

      const value = configManager.getConfigValue("daily.enabled");
      expect(value).toBe(false);
    });

    it("should set top-level config value", async () => {
      await configManager.setConfigValue("version", "2.0.0");

      const value = configManager.getConfigValue("version");
      expect(value).toBe("2.0.0");
    });

    it("should persist changes to file", async () => {
      await configManager.setConfigValue("daily.enabled", false);

      const configPath = join(tempDir, ".enkidu", "config.json");
      const fileContent = readFile(configPath);
      const parsedConfig = JSON.parse(fileContent);

      expect(parsedConfig.daily.enabled).toBe(false);
    });

    it("should validate config after update", async () => {
      await expect(
        configManager.setConfigValue("version", 123), // Invalid type
      ).rejects.toThrow();
    });

    it("should create nested objects if needed", async () => {
      await configManager.setConfigValue("newSection.newKey", "value");

      const value = configManager.getConfigValue("newSection.newKey");
      expect(value).toBe("value");
    });
  });

  describe("saveConfig", () => {
    beforeEach(async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig();
      await configManager.loadConfig(tempDir);
    });

    it("should save config to default path", async () => {
      await configManager.setConfigValue("daily.enabled", false);
      await configManager.saveConfig();

      const configPath = join(tempDir, ".enkidu", "config.json");
      expect(fileExists(configPath)).toBe(true);
    });

    it("should save config to custom path", async () => {
      const customPath = join(tempDir, "custom-config.json");
      await configManager.saveConfig(customPath);

      expect(fileExists(customPath)).toBe(true);
    });

    it("should create directories if needed", async () => {
      const customPath = join(tempDir, "deep", "nested", "config.json");
      await configManager.saveConfig(customPath);

      expect(fileExists(customPath)).toBe(true);
    });

    it("should save as pretty JSON", async () => {
      await configManager.saveConfig();

      const configPath = join(tempDir, ".enkidu", "config.json");
      const content = readFile(configPath);

      expect(content).toContain("\n");
      expect(content).toContain("  "); // Indentation
    });

    it("should preserve all config values", async () => {
      const originalConfig = configManager.getConfig();
      await configManager.saveConfig();

      const newManager = new ConfigManager();
      await newManager.loadConfig(tempDir);
      const loadedConfig = newManager.getConfig();

      expect(loadedConfig.version).toBe(originalConfig.version);
      expect(loadedConfig.enkidu).toEqual(originalConfig.enkidu);
    });
  });

  describe("initConfig", () => {
    it("should initialize new config", async () => {
      const config = await configManager.initConfig(tempDir);

      expect(config).toBeDefined();
      expect(config.enkidu).toBeDefined();
    });

    it("should create directory structure", async () => {
      await configManager.initConfig(tempDir);

      expect(fileExists(join(tempDir, ".enkidu"))).toBe(true);
      expect(fileExists(join(tempDir, "notes"))).toBe(true);
      expect(fileExists(join(tempDir, "daily"))).toBe(true);
      expect(fileExists(join(tempDir, "blog"))).toBe(true);
    });

    it("should create config file", async () => {
      await configManager.initConfig(tempDir);

      const configPath = join(tempDir, ".enkidu", "config.json");
      expect(fileExists(configPath)).toBe(true);
    });

    it("should accept custom options", async () => {
      const config = await configManager.initConfig(tempDir, {
        enkidu: {
          notesDir: "custom-notes",
          templatesDir: "custom-templates",
        },
      });

      expect(config.enkidu.notesDir).toBe("custom-notes");
    });

    it("should set rootDir correctly", async () => {
      const config = await configManager.initConfig(tempDir);

      expect(config.rootDir).toBe(tempDir);
    });

    it("should not overwrite existing directories", async () => {
      const existingDir = join(tempDir, "notes");
      fixtures.initEnkiduStructure();
      writeFile(join(existingDir, "test.md"), "existing");

      await configManager.initConfig(tempDir);

      expect(fileExists(join(existingDir, "test.md"))).toBe(true);
    });

    it("should create template directory", async () => {
      await configManager.initConfig(tempDir);

      expect(fileExists(join(tempDir, ".enkidu", "templates"))).toBe(true);
    });

    it("should create cache directory", async () => {
      await configManager.initConfig(tempDir);

      expect(fileExists(join(tempDir, ".enkidu", "cache"))).toBe(true);
    });

    it("should create category directories", async () => {
      await configManager.initConfig(tempDir);

      expect(fileExists(join(tempDir, "notes", "projects"))).toBe(true);
      expect(fileExists(join(tempDir, "notes", "reference"))).toBe(true);
      expect(fileExists(join(tempDir, "notes", "ideas"))).toBe(true);
    });
  });

  describe("isInitialized", () => {
    it("should return true when initialized", async () => {
      await configManager.initConfig(tempDir);

      expect(ConfigManager.isInitialized(tempDir)).toBe(true);
    });

    it("should return false when not initialized", () => {
      expect(ConfigManager.isInitialized(tempDir)).toBe(false);
    });

    it("should check for config file existence", async () => {
      fixtures.initEnkiduStructure();

      expect(ConfigManager.isInitialized(tempDir)).toBe(false);

      fixtures.createConfig();

      expect(ConfigManager.isInitialized(tempDir)).toBe(true);
    });
  });

  describe("findEnkiduRoot", () => {
    it("should find root in current directory", async () => {
      await configManager.initConfig(tempDir);

      const root = ConfigManager.findEnkiduRoot(tempDir);

      expect(root).toBe(tempDir);
    });

    it("should find root in parent directory", async () => {
      await configManager.initConfig(tempDir);
      const subDir = join(tempDir, "notes", "blog");

      const root = ConfigManager.findEnkiduRoot(subDir);

      expect(root).toBe(tempDir);
    });

    it("should find root in deep nested directory", async () => {
      await configManager.initConfig(tempDir);
      const deepDir = join(tempDir, "notes", "projects", "sub", "deep");
      fixtures.initEnkiduStructure();

      const root = ConfigManager.findEnkiduRoot(deepDir);

      expect(root).toBe(tempDir);
    });

    it("should return null when no root found", () => {
      const root = ConfigManager.findEnkiduRoot(tempDir);

      expect(root).toBeNull();
    });

    it("should use process.cwd() by default", async () => {
      // Note: This test depends on current working directory
      const root = ConfigManager.findEnkiduRoot();

      expect(root === null || typeof root === "string").toBe(true);
    });

    it("should stop at filesystem root", () => {
      const root = ConfigManager.findEnkiduRoot("/tmp/non-existent-path-xyz");

      expect(root).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle config with all optional fields", async () => {
      fixtures.initEnkiduStructure();
      const minimalConfig = {
        version: "1.0.0",
        enkidu: {
          notesDir: "notes",
          templatesDir: "templates",
        },
      };

      const configPath = join(tempDir, ".enkidu", "config.json");
      writeFile(configPath, JSON.stringify(minimalConfig));

      const config = await configManager.loadConfig(tempDir);

      expect(config).toBeDefined();
      expect(config.daily).toBeDefined(); // Should have defaults
    });

    it("should handle empty config object", async () => {
      fixtures.initEnkiduStructure();
      const configPath = join(tempDir, ".enkidu", "config.json");
      writeFile(configPath, "{}");

      await expect(configManager.loadConfig(tempDir)).rejects.toThrow();
    });

    it("should handle malformed JSON", async () => {
      fixtures.initEnkiduStructure();
      const configPath = join(tempDir, ".enkidu", "config.json");
      writeFile(configPath, "{ invalid json }");

      await expect(configManager.loadConfig(tempDir)).rejects.toThrow();
    });

    it("should handle concurrent operations", async () => {
      fixtures.initEnkiduStructure();
      fixtures.createConfig();

      await configManager.loadConfig(tempDir);

      await Promise.all([
        configManager.setConfigValue("daily.enabled", false),
        configManager.setConfigValue("ui.colors", false),
      ]);

      expect(configManager.getConfigValue("daily.enabled")).toBe(false);
      expect(configManager.getConfigValue("ui.colors")).toBe(false);
    });
  });
});
