import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigManager } from '../core/config/manager.js';
import { TemplateLoader } from '../core/template/loader.js';
import { validateTemplate } from '../core/template/validator.js';
import { openInEditor } from '../utils/editor.js';

export const templateCommand = new Command('template')
  .description('Manage templates (list, show, create, copy, edit, delete)')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all available templates')
      .action(async () => {
        try {
          const config = await ConfigManager.load();
          const loader = new TemplateLoader(config.rootDir);
          const templates = await loader.listTemplates();

          // Group templates by type
          const builtIn = templates.filter(t => t.isBuiltIn);
          const custom = templates.filter(t => !t.isBuiltIn);

          // Display built-in templates
          if (builtIn.length > 0) {
            console.log(chalk.bold.cyan('\n📦 Built-in Templates:'));
            for (const template of builtIn) {
              console.log(
                `  ${chalk.green(template.name.padEnd(20))} - ${chalk.gray(template.description)}`
              );
            }
          }

          // Display custom templates
          if (custom.length > 0) {
            console.log(chalk.bold.magenta('\n✨ Custom Templates:'));
            for (const template of custom) {
              console.log(
                `  ${chalk.green(template.name.padEnd(20))} - ${chalk.gray(template.description)}`
              );
            }
          }

          if (templates.length === 0) {
            console.log(chalk.yellow('\nNo templates found.'));
          }

          console.log(); // Empty line for spacing
        } catch (error) {
          console.error(chalk.red('Error listing templates:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .description('Show template content')
      .argument('<name>', 'Template name')
      .action(async (name: string) => {
        try {
          const config = await ConfigManager.load();
          const loader = new TemplateLoader(config.rootDir);
          const template = await loader.loadTemplate(name);

          console.log(chalk.bold.cyan(`\n📄 Template: ${template.name}`));
          console.log(chalk.gray(`   ${template.description}`));
          console.log(chalk.gray(`   Type: ${template.isBuiltIn ? 'Built-in' : 'Custom'}`));
          console.log(chalk.gray(`   Path: ${template.path}\n`));

          // Display content with syntax highlighting
          console.log(chalk.dim('─'.repeat(60)));
          console.log(template.content);
          console.log(chalk.dim('─'.repeat(60)));

          // Validate and show variables
          const validation = validateTemplate(template.content);
          if (validation.variables.length > 0) {
            console.log(chalk.bold.yellow('\n🔧 Variables:'));
            console.log(`   ${validation.variables.map(v => `{{${v}}}`).join(', ')}`);
          }

          if (validation.warnings.length > 0) {
            console.log(chalk.bold.yellow('\n⚠️  Warnings:'));
            validation.warnings.forEach(w => console.log(`   ${chalk.yellow('•')} ${w}`));
          }

          console.log(); // Empty line for spacing
        } catch (error) {
          console.error(chalk.red(`Error showing template "${name}":`), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('create')
      .description('Create a new custom template interactively')
      .argument('<name>', 'Template name')
      .option('-d, --description <description>', 'Template description')
      .option('-b, --based-on <template>', 'Base template to start from')
      .action(async (name: string, options: { description?: string; basedOn?: string }) => {
        try {
          const config = await ConfigManager.load();
          const loader = new TemplateLoader(config.rootDir);

          // Check if template already exists
          try {
            await loader.loadTemplate(name);
            console.error(chalk.red(`Template "${name}" already exists. Use 'edit' to modify it.`));
            process.exit(1);
          } catch {
            // Template doesn't exist, continue
          }

          let baseContent = '';
          let description = options.description || '';

          // If based on another template, load it
          if (options.basedOn) {
            try {
              const baseTemplate = await loader.loadTemplate(options.basedOn);
              baseContent = baseTemplate.content;
              console.log(chalk.cyan(`\n✨ Creating template based on: ${options.basedOn}`));
            } catch (error) {
              console.error(chalk.red(`Base template "${options.basedOn}" not found.`));
              process.exit(1);
            }
          } else {
            // Default template structure
            baseContent = `---
title: {{title}}
created: {{date}}
updated: {{date}}
tags: []
type: note
---

# {{title}}

Content goes here...
`;
          }

          // Prompt for description if not provided
          if (!description) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'description',
                message: 'Template description:',
                default: 'Custom template',
              },
            ]);
            description = answers.description;
          }

          // Open in editor for customization
          console.log(chalk.cyan('\n📝 Opening editor to customize template...\n'));
          const editedContent = await openInEditor(baseContent, config.editor);

          if (!editedContent || editedContent.trim() === '') {
            console.error(chalk.red('Template creation cancelled - no content provided.'));
            process.exit(1);
          }

          // Validate template
          const validation = validateTemplate(editedContent);
          if (!validation.valid) {
            console.error(chalk.red('\n❌ Template validation failed:'));
            validation.errors.forEach(e => console.error(`   ${chalk.red('•')} ${e}`));
            process.exit(1);
          }

          if (validation.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️  Template warnings:'));
            validation.warnings.forEach(w => console.log(`   ${chalk.yellow('•')} ${w}`));
          }

          // Save template
          await loader.saveTemplate(name, editedContent, description);
          console.log(chalk.green(`\n✅ Template "${name}" created successfully!`));

          if (validation.variables.length > 0) {
            console.log(chalk.cyan('\n🔧 Available variables:'));
            console.log(`   ${validation.variables.map(v => `{{${v}}}`).join(', ')}`);
          }

          console.log(); // Empty line for spacing
        } catch (error) {
          console.error(chalk.red('Error creating template:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('copy')
      .description('Copy a built-in template to customize')
      .argument('<source>', 'Source template name (built-in)')
      .argument('<destination>', 'Destination template name')
      .action(async (source: string, destination: string) => {
        try {
          const config = await ConfigManager.load();
          const loader = new TemplateLoader(config.rootDir);

          // Check if destination already exists
          try {
            await loader.loadTemplate(destination);
            console.error(chalk.red(`Template "${destination}" already exists.`));
            process.exit(1);
          } catch {
            // Destination doesn't exist, continue
          }

          // Copy template
          await loader.copyToCustom(source, destination);
          console.log(chalk.green(`\n✅ Template "${source}" copied to "${destination}"`));
          console.log(chalk.cyan(`   You can now edit it with: enkidu template edit ${destination}\n`));
        } catch (error) {
          console.error(chalk.red('Error copying template:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('edit')
      .description('Edit a custom template')
      .argument('<name>', 'Template name')
      .action(async (name: string) => {
        try {
          const config = await ConfigManager.load();
          const loader = new TemplateLoader(config.rootDir);

          // Load template
          const template = await loader.loadTemplate(name);

          // Check if it's a built-in template
          if (template.isBuiltIn) {
            console.error(
              chalk.red(`Cannot edit built-in template "${name}".`),
              chalk.cyan(`\nUse: enkidu template copy ${name} my-${name}`)
            );
            process.exit(1);
          }

          // Open in editor
          console.log(chalk.cyan('\n📝 Opening template in editor...\n'));
          const editedContent = await openInEditor(template.content, config.editor);

          if (!editedContent || editedContent.trim() === '') {
            console.error(chalk.red('Edit cancelled - no content provided.'));
            process.exit(1);
          }

          // Check if content changed
          if (editedContent === template.content) {
            console.log(chalk.yellow('No changes made.'));
            return;
          }

          // Validate template
          const validation = validateTemplate(editedContent);
          if (!validation.valid) {
            console.error(chalk.red('\n❌ Template validation failed:'));
            validation.errors.forEach(e => console.error(`   ${chalk.red('•')} ${e}`));
            process.exit(1);
          }

          if (validation.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️  Template warnings:'));
            validation.warnings.forEach(w => console.log(`   ${chalk.yellow('•')} ${w}`));
          }

          // Save template
          await loader.saveTemplate(name, editedContent, template.description);
          console.log(chalk.green(`\n✅ Template "${name}" updated successfully!\n`));
        } catch (error) {
          console.error(chalk.red('Error editing template:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('delete')
      .alias('rm')
      .description('Delete a custom template')
      .argument('<name>', 'Template name')
      .option('-f, --force', 'Skip confirmation prompt')
      .action(async (name: string, options: { force?: boolean }) => {
        try {
          const config = await ConfigManager.load();
          const loader = new TemplateLoader(config.rootDir);

          // Load template to check if it exists and is custom
          const template = await loader.loadTemplate(name);

          if (template.isBuiltIn) {
            console.error(chalk.red(`Cannot delete built-in template "${name}".`));
            process.exit(1);
          }

          // Confirm deletion unless --force
          if (!options.force) {
            const answers = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to delete template "${name}"?`,
                default: false,
              },
            ]);

            if (!answers.confirm) {
              console.log(chalk.yellow('Deletion cancelled.'));
              return;
            }
          }

          // Delete template
          await loader.deleteTemplate(name);
          console.log(chalk.green(`\n✅ Template "${name}" deleted successfully!\n`));
        } catch (error) {
          console.error(chalk.red('Error deleting template:'), error);
          process.exit(1);
        }
      })
  );
