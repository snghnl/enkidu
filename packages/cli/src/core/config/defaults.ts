import { PkmConfig } from "../config/schema.js";
import { homedir } from "os";
import { join } from "path";

export function getDefaultConfig(rootDir?: string): PkmConfig {
  const pkmRoot = rootDir || join(homedir(), "enkidu");

  return {
    version: "1.0.0",
    rootDir: pkmRoot,
    editor: process.env.EDITOR || "vim",
    daily: {
      path: "daily",
      template: "daily-default",
      dateFormat: "YYYY/MM/DD.md",
      autoCreate: true,
      openInEditor: true,
    },
    notes: {
      defaultCategory: "misc",
      defaultTemplate: "note-default",
      slugify: true,
    },
    sync: {
      target: "",
      enabled: false,
      include: ["blog/**/*.md"],
      exclude: ["**/drafts/**"],
      publishField: "publish",
      transformFrontmatter: true,
      copyAssets: true,
      assetsPath: "",
    },
    search: {
      indexOnStartup: false,
      cacheEnabled: true,
    },
    ui: {
      theme: "default",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "HH:mm",
    },
  };
}
