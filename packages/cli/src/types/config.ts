export interface PkmConfig {
  version: string;
  rootDir: string;
  editor: string;
  daily: DailyConfig;
  notes: NotesConfig;
  sync: SyncConfig;
  search: SearchConfig;
  ui: UiConfig;
}

export interface DailyConfig {
  path: string;
  template: string;
  dateFormat: string;
  autoCreate: boolean;
  openInEditor: boolean;
}

export interface NotesConfig {
  defaultCategory: string;
  defaultTemplate: string;
  slugify: boolean;
}

export interface SyncConfig {
  target: string;
  enabled: boolean;
  include: string[];
  exclude: string[];
  publishField: string;
  transformFrontmatter: boolean;
  copyAssets: boolean;
  assetsPath: string;
}

export interface SearchConfig {
  indexOnStartup: boolean;
  cacheEnabled: boolean;
}

export interface UiConfig {
  theme: string;
  dateFormat: string;
  timeFormat: string;
}
