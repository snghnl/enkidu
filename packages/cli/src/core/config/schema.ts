import { z } from 'zod';

export const dailyConfigSchema = z.object({
  path: z.string().default('daily'),
  template: z.string().default('daily-default'),
  dateFormat: z.string().default('YYYY/MM/DD.md'),
  autoCreate: z.boolean().default(true),
  openInEditor: z.boolean().default(true),
});

export const notesConfigSchema = z.object({
  defaultCategory: z.string().default('misc'),
  defaultTemplate: z.string().default('note-default'),
  slugify: z.boolean().default(true),
});

export const syncConfigSchema = z.object({
  target: z.string().default(''),
  enabled: z.boolean().default(false),
  include: z.array(z.string()).default(['blog/**/*.md']),
  exclude: z.array(z.string()).default(['**/drafts/**']),
  publishField: z.string().default('publish'),
  transformFrontmatter: z.boolean().default(true),
  copyAssets: z.boolean().default(true),
  assetsPath: z.string().default(''),
});

export const searchConfigSchema = z.object({
  indexOnStartup: z.boolean().default(false),
  cacheEnabled: z.boolean().default(true),
});

export const uiConfigSchema = z.object({
  theme: z.string().default('default'),
  dateFormat: z.string().default('YYYY-MM-DD'),
  timeFormat: z.string().default('HH:mm'),
});

export const pkmConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  rootDir: z.string(),
  editor: z.string().default(''),
  daily: dailyConfigSchema,
  notes: notesConfigSchema,
  sync: syncConfigSchema,
  search: searchConfigSchema,
  ui: uiConfigSchema,
});

export type PkmConfig = z.infer<typeof pkmConfigSchema>;
