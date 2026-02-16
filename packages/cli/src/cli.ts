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

const program = new Command();

program
  .name("enkidu")
  .description(
    "Enkidu - Personal Knowledge Management CLI - Manage notes, daily journals, and publish to Docusaurus",
  )
  .version("1.0.0");

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
