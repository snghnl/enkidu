import { readFile, writeFile, readdir, unlink } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { Template } from "../../types/template.js";
import { ensureDir } from "../../utils/fs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Template loader for managing built-in and custom templates
 */
export class TemplateLoader {
  private builtInTemplatesPath: string;
  private customTemplatesPath: string;

  constructor(enkiduRoot: string) {
    // Built-in templates are in the package (dist/ -> templates/)
    this.builtInTemplatesPath = join(__dirname, "../templates");
    // Custom templates are in .enkidu/templates
    this.customTemplatesPath = join(enkiduRoot, ".enkidu", "templates");
  }

  /**
   * List all templates (built-in + custom)
   */
  async listTemplates(): Promise<Template[]> {
    const templates: Template[] = [];

    // Load built-in templates
    const builtInFiles = await this.getTemplateFiles(this.builtInTemplatesPath);
    for (const file of builtInFiles) {
      const template = await this.loadTemplateFile(
        join(this.builtInTemplatesPath, file),
        true,
      );
      templates.push(template);
    }

    // Load custom templates if directory exists
    if (existsSync(this.customTemplatesPath)) {
      const customFiles = await this.getTemplateFiles(this.customTemplatesPath);
      for (const file of customFiles) {
        const template = await this.loadTemplateFile(
          join(this.customTemplatesPath, file),
          false,
        );
        templates.push(template);
      }
    }

    return templates;
  }

  /**
   * Load template by name
   */
  async loadTemplate(name: string): Promise<Template> {
    // Try custom templates first
    const customPath = join(this.customTemplatesPath, `${name}.md`);
    if (existsSync(customPath)) {
      return this.loadTemplateFile(customPath, false);
    }

    // Try built-in templates
    const builtInPath = join(this.builtInTemplatesPath, `${name}.md`);
    if (existsSync(builtInPath)) {
      return this.loadTemplateFile(builtInPath, true);
    }

    throw new Error(`Template "${name}" not found`);
  }

  /**
   * Save custom template
   */
  async saveTemplate(
    name: string,
    content: string,
    description: string,
  ): Promise<void> {
    // Ensure custom templates directory exists
    await ensureDir(this.customTemplatesPath);

    const templatePath = join(this.customTemplatesPath, `${name}.md`);

    // Add description as comment at the top if provided
    let finalContent = content;
    if (description) {
      finalContent = `<!-- ${description} -->\n${content}`;
    }

    await writeFile(templatePath, finalContent, "utf-8");
  }

  /**
   * Copy built-in template to custom
   */
  async copyToCustom(builtInName: string, newName: string): Promise<void> {
    // Load the built-in template
    const builtInPath = join(this.builtInTemplatesPath, `${builtInName}.md`);
    if (!existsSync(builtInPath)) {
      throw new Error(`Built-in template "${builtInName}" not found`);
    }

    const template = await this.loadTemplateFile(builtInPath, true);

    // Save as custom template
    await this.saveTemplate(newName, template.content, template.description);
  }

  /**
   * Delete custom template
   */
  async deleteTemplate(name: string): Promise<void> {
    const templatePath = join(this.customTemplatesPath, `${name}.md`);

    if (!existsSync(templatePath)) {
      throw new Error(`Custom template "${name}" not found`);
    }

    // Check if it's in custom templates directory (safety check)
    if (!templatePath.startsWith(this.customTemplatesPath)) {
      throw new Error("Cannot delete built-in templates");
    }

    await unlink(templatePath);
  }

  /**
   * Get template files from a directory
   */
  private async getTemplateFiles(dirPath: string): Promise<string[]> {
    if (!existsSync(dirPath)) {
      return [];
    }

    const files = await readdir(dirPath);
    return files.filter((file) => file.endsWith(".md"));
  }

  /**
   * Load template file
   */
  private async loadTemplateFile(
    filePath: string,
    isBuiltIn: boolean,
  ): Promise<Template> {
    const content = await readFile(filePath, "utf-8");
    const name = this.getTemplateName(filePath);
    const description = this.extractDescription(content);

    return {
      name,
      description,
      content,
      isBuiltIn,
      path: filePath,
    };
  }

  /**
   * Extract template name from file path
   */
  private getTemplateName(filePath: string): string {
    const fileName = filePath.split("/").pop() || "";
    return fileName.replace(".md", "");
  }

  /**
   * Extract description from template content
   */
  private extractDescription(content: string): string {
    // Look for HTML comment at the start
    const commentMatch = content.match(/^<!--\s*(.+?)\s*-->/);
    if (commentMatch) {
      return commentMatch[1];
    }

    // Default descriptions based on common template names
    const descriptions: Record<string, string> = {
      "daily-default": "Daily note with Focus, Notes, Done, Reflections",
      "note-default": "Basic note template",
      "blog-post": "Blog post with Introduction, Content, Conclusion",
      project: "Project note with Goals, Tasks, Resources",
      meeting: "Meeting notes with Agenda, Action Items",
    };

    const name = this.getTemplateName(content);
    return descriptions[name] || "Custom template";
  }
}
