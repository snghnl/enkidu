import { extractTemplateVariables } from "./engine.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
}

/**
 * Validate template structure
 */
export function validateTemplate(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const variables = extractTemplateVariables(content);

  // Check for frontmatter
  const hasFrontmatter = content.trimStart().startsWith("---");
  if (!hasFrontmatter) {
    warnings.push("Template does not contain frontmatter");
  } else {
    // Validate frontmatter structure
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      errors.push("Invalid frontmatter structure - missing closing ---");
    } else {
      const frontmatterContent = frontmatterMatch[1];

      // Check for basic YAML syntax errors
      const lines = frontmatterContent.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (
          line &&
          !line.startsWith("#") &&
          !line.includes(":") &&
          !line.startsWith("-")
        ) {
          errors.push(`Invalid YAML syntax at line ${i + 2}: "${line}"`);
        }
      }
    }
  }

  // Check for invalid variable syntax (single braces or unclosed double braces)
  const singleBracePattern =
    /(?<!\{)\{(?!\{)[^}]*\}(?!\})|(?<!\{)\{\{[^}]*\}(?!\})/g;
  const invalidVars = content.match(singleBracePattern);
  if (invalidVars && invalidVars.length > 0) {
    // Filter out valid cases like CSS or JSON examples
    const reallyInvalid = invalidVars.filter(
      (v) => !v.includes(":") && !v.includes(","),
    );
    if (reallyInvalid.length > 0) {
      errors.push(`Invalid variable syntax found: ${reallyInvalid.join(", ")}`);
    }
  }

  // Check for content after frontmatter
  if (hasFrontmatter) {
    const contentAfterFrontmatter = content
      .replace(/^---\n[\s\S]*?\n---\n/, "")
      .trim();
    if (!contentAfterFrontmatter) {
      warnings.push("Template has no content after frontmatter");
    }
  }

  // Check for markdown heading
  const hasHeading = /^#+ /.test(content.replace(/^---\n[\s\S]*?\n---\n/, ""));
  if (!hasHeading) {
    warnings.push("Template does not contain a markdown heading");
  }

  // Validate common required fields in frontmatter
  if (hasFrontmatter) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];

      // Check for common fields
      const commonFields = ["title", "date", "created", "tags", "type"];
      const missingFields = commonFields.filter((field) => {
        return !new RegExp(`^${field}:`, "m").test(frontmatter);
      });

      if (missingFields.length > 0) {
        warnings.push(
          `Consider adding these common fields: ${missingFields.join(", ")}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    variables,
  };
}

/**
 * Check if template has required sections
 */
export function checkRequiredSections(
  content: string,
  requiredSections: string[],
): string[] {
  const missingSections: string[] = [];

  for (const section of requiredSections) {
    const sectionRegex = new RegExp(`^##+ ${section}`, "m");
    if (!sectionRegex.test(content)) {
      missingSections.push(section);
    }
  }

  return missingSections;
}

/**
 * Validate variable names
 */
export function validateVariableNames(variables: string[]): string[] {
  const invalidVariables: string[] = [];
  const validNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;

  for (const variable of variables) {
    if (!validNameRegex.test(variable)) {
      invalidVariables.push(variable);
    }
  }

  return invalidVariables;
}
