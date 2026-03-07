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
export function getDefaultVariables(
  title: string,
  timezone?: string,
): TemplateVariables {
  const now = new Date();
  const tz =
    timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  return {
    title,
    date: `${year}-${month}-${day}T${hour}:${minute}:${second}`,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    year,
    month,
    day,
    time: `${hour}:${minute}`,
  };
}
