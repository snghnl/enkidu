#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { configCommand } from "./commands/config.js";
import { dailyCommand } from "./commands/daily.js";
import { noteCommand } from "./commands/note.js";
import { tagCommand } from "./commands/tag.js";
import { categoryCommand } from "./commands/category.js";
import { syncCommand } from "./commands/sync.js";
import { searchCommand } from "./commands/search.js";
import { linkCommand } from "./commands/link.js";
import { templateCommand } from "./commands/template.js";
import { ConfigManager } from "./core/config/manager.js";
import { initLogger } from "./utils/logger.js";

// Initialize logger if we're in a workspace
const pkmRoot = ConfigManager.findPkmRoot();
if (pkmRoot) {
  initLogger(pkmRoot);
}

const program = new Command();

program
  .name("enkidu")
  .description(
    "Enkidu - Personal Knowledge Management CLI - Manage notes, daily journals, and publish to Docusaurus",
  )
  .version("0.1.0");

// Add implemented commands
program.addCommand(initCommand);
program.addCommand(configCommand);
program.addCommand(dailyCommand);
program.addCommand(noteCommand);
program.addCommand(tagCommand);
program.addCommand(categoryCommand);
program.addCommand(syncCommand);
program.addCommand(searchCommand);
program.addCommand(linkCommand);
program.addCommand(templateCommand);

program.parse();
