import { TemplateVariables } from "../../types/template.js";

/**
 * Replace template variables in content
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  let rendered = template;

  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(placeholder, String(value));
  }

  return rendered;
}

/**
 * Extract variables from template
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /{{\s*(\w+)\s*}}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Get default template variables
 */
export function getDefaultVariables(title: string): TemplateVariables {
  const now = new Date();

  return {
    title,
    date: now.toISOString(),
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    year: now.getFullYear().toString(),
    month: String(now.getMonth() + 1).padStart(2, "0"),
    day: String(now.getDate()).padStart(2, "0"),
    time: now.toLocaleTimeString(),
  };
}
