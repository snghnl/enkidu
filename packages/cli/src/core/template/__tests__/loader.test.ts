import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateLoader } from '../loader.js';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('TemplateLoader', () => {
  let testRoot: string;
  let loader: TemplateLoader;

  beforeEach(() => {
    // Create a temporary test directory
    testRoot = join(tmpdir(), `enkidu-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });
    loader = new TemplateLoader(testRoot);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe('listTemplates', () => {
    it('should list built-in templates', async () => {
      const templates = await loader.listTemplates();

      expect(templates.length).toBeGreaterThan(0);

      const builtInTemplates = templates.filter(t => t.isBuiltIn);
      expect(builtInTemplates.length).toBeGreaterThan(0);

      // Check for expected built-in templates
      const templateNames = builtInTemplates.map(t => t.name);
      expect(templateNames).toContain('daily-default');
      expect(templateNames).toContain('note-default');
    });

    it('should list custom templates when they exist', async () => {
      // Create a custom template
      const customTemplatesDir = join(testRoot, '.enkidu', 'templates');
      mkdirSync(customTemplatesDir, { recursive: true });

      const customContent = `<!-- My custom template -->
---
title: {{title}}
---

# {{title}}
`;
      writeFileSync(join(customTemplatesDir, 'my-template.md'), customContent);

      const templates = await loader.listTemplates();

      const customTemplates = templates.filter(t => !t.isBuiltIn);
      expect(customTemplates.length).toBe(1);
      expect(customTemplates[0].name).toBe('my-template');
      expect(customTemplates[0].description).toBe('My custom template');
    });

    it('should return empty custom list when .enkidu/templates does not exist', async () => {
      const templates = await loader.listTemplates();

      const customTemplates = templates.filter(t => !t.isBuiltIn);
      expect(customTemplates.length).toBe(0);
    });
  });

  describe('loadTemplate', () => {
    it('should load built-in template', async () => {
      const template = await loader.loadTemplate('note-default');

      expect(template.name).toBe('note-default');
      expect(template.isBuiltIn).toBe(true);
      expect(template.content).toContain('{{title}}');
      expect(template.description).toBeTruthy();
    });

    it('should load custom template', async () => {
      // Create a custom template
      const customTemplatesDir = join(testRoot, '.enkidu', 'templates');
      mkdirSync(customTemplatesDir, { recursive: true });

      const customContent = `---
title: {{title}}
---

# {{title}}
`;
      writeFileSync(join(customTemplatesDir, 'custom.md'), customContent);

      const template = await loader.loadTemplate('custom');

      expect(template.name).toBe('custom');
      expect(template.isBuiltIn).toBe(false);
      expect(template.content).toBe(customContent);
    });

    it('should prioritize custom templates over built-in', async () => {
      // Create a custom template with the same name as a built-in
      const customTemplatesDir = join(testRoot, '.enkidu', 'templates');
      mkdirSync(customTemplatesDir, { recursive: true });

      const customContent = `<!-- Custom override -->
---
title: {{title}}
---

# Custom {{title}}
`;
      writeFileSync(join(customTemplatesDir, 'note-default.md'), customContent);

      const template = await loader.loadTemplate('note-default');

      expect(template.isBuiltIn).toBe(false);
      expect(template.content).toContain('Custom override');
    });

    it('should throw error for non-existent template', async () => {
      await expect(loader.loadTemplate('non-existent')).rejects.toThrow(
        'Template "non-existent" not found'
      );
    });
  });

  describe('saveTemplate', () => {
    it('should save custom template', async () => {
      const content = `---
title: {{title}}
---

# {{title}}

My content`;

      await loader.saveTemplate('my-new-template', content, 'My description');

      // Verify it was saved
      const template = await loader.loadTemplate('my-new-template');
      expect(template.name).toBe('my-new-template');
      expect(template.isBuiltIn).toBe(false);
      expect(template.content).toContain('My description');
      expect(template.content).toContain('My content');
    });

    it('should create .enkidu/templates directory if it does not exist', async () => {
      const customTemplatesDir = join(testRoot, '.enkidu', 'templates');
      expect(existsSync(customTemplatesDir)).toBe(false);

      await loader.saveTemplate('test', '# Test', 'Test template');

      expect(existsSync(customTemplatesDir)).toBe(true);
    });
  });

  describe('copyToCustom', () => {
    it('should copy built-in template to custom', async () => {
      await loader.copyToCustom('note-default', 'my-note');

      const template = await loader.loadTemplate('my-note');
      expect(template.name).toBe('my-note');
      expect(template.isBuiltIn).toBe(false);

      const originalTemplate = await loader.loadTemplate('note-default');
      // Content should be similar (with description comment)
      expect(template.content).toContain('{{title}}');
    });

    it('should throw error when copying non-existent built-in template', async () => {
      await expect(loader.copyToCustom('non-existent', 'my-copy')).rejects.toThrow(
        'Built-in template "non-existent" not found'
      );
    });
  });

  describe('deleteTemplate', () => {
    it('should delete custom template', async () => {
      // Create a custom template first
      await loader.saveTemplate('to-delete', '# Delete me', 'Template to delete');

      // Verify it exists
      const template = await loader.loadTemplate('to-delete');
      expect(template.name).toBe('to-delete');

      // Delete it
      await loader.deleteTemplate('to-delete');

      // Verify it's gone
      await expect(loader.loadTemplate('to-delete')).rejects.toThrow();
    });

    it('should throw error when deleting non-existent template', async () => {
      await expect(loader.deleteTemplate('non-existent')).rejects.toThrow(
        'Custom template "non-existent" not found'
      );
    });

    it('should not delete built-in templates', async () => {
      // This test verifies the safety check
      // In practice, built-in templates won't be in the custom templates directory
      const customTemplatesDir = join(testRoot, '.enkidu', 'templates');
      mkdirSync(customTemplatesDir, { recursive: true });

      // The deleteTemplate method should only work on files in customTemplatesPath
      await expect(loader.deleteTemplate('note-default')).rejects.toThrow();
    });
  });
});
