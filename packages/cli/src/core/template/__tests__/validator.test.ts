import { describe, it, expect } from 'vitest';
import { validateTemplate, checkRequiredSections, validateVariableNames } from '../validator.js';

describe('validateTemplate', () => {
  it('should validate a correct template', () => {
    const template = `---
title: {{title}}
created: {{date}}
tags: []
type: note
---

# {{title}}

Content goes here...
`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.variables).toContain('title');
    expect(result.variables).toContain('date');
  });

  it('should warn about missing frontmatter', () => {
    const template = `# {{title}}

Content without frontmatter...
`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Template does not contain frontmatter');
  });

  it('should detect invalid frontmatter structure', () => {
    const template = `---
title: {{title}}
created: {{date}}

# Missing closing ---

Content here...
`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid frontmatter structure'))).toBe(true);
  });

  it('should detect invalid variable syntax', () => {
    const template = `---
title: {{title}}
---

# {{title}

This has a {single} brace and {{valid}} syntax.
`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid variable syntax'))).toBe(true);
  });

  it('should warn about missing content after frontmatter', () => {
    const template = `---
title: {{title}}
---

`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('no content after frontmatter'))).toBe(true);
  });

  it('should warn about missing markdown heading', () => {
    const template = `---
title: {{title}}
---

Just plain text without a heading.
`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('does not contain a markdown heading'))).toBe(true);
  });

  it('should suggest common fields if missing', () => {
    const template = `---
custom: value
---

# Title
`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('Consider adding these common fields'))).toBe(true);
  });

  it('should extract template variables correctly', () => {
    const template = `---
title: {{title}}
date: {{date}}
slug: {{slug}}
---

# {{title}}

Created on {{date}} with slug {{slug}}.
`;

    const result = validateTemplate(template);

    expect(result.variables).toContain('title');
    expect(result.variables).toContain('date');
    expect(result.variables).toContain('slug');
    expect(result.variables.length).toBe(3);
  });

  it('should handle template with no variables', () => {
    const template = `---
title: Static Title
---

# Static Content

No variables here.
`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(true);
    expect(result.variables.length).toBe(0);
  });

  it('should detect invalid YAML syntax in frontmatter', () => {
    const template = `---
title: {{title}}
invalid line without colon
tags: []
---

# {{title}}
`;

    const result = validateTemplate(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid YAML syntax'))).toBe(true);
  });
});

describe('checkRequiredSections', () => {
  it('should return empty array when all required sections exist', () => {
    const content = `# Title

## Introduction

## Content

## Conclusion
`;

    const missingSections = checkRequiredSections(content, ['Introduction', 'Content', 'Conclusion']);

    expect(missingSections.length).toBe(0);
  });

  it('should detect missing required sections', () => {
    const content = `# Title

## Introduction

## Conclusion
`;

    const missingSections = checkRequiredSections(content, ['Introduction', 'Content', 'Conclusion']);

    expect(missingSections).toContain('Content');
    expect(missingSections.length).toBe(1);
  });

  it('should handle different heading levels', () => {
    const content = `# Title

### Introduction

#### Content
`;

    const missingSections = checkRequiredSections(content, ['Introduction', 'Content']);

    expect(missingSections.length).toBe(0);
  });
});

describe('validateVariableNames', () => {
  it('should accept valid variable names', () => {
    const variables = ['title', 'date', 'slug', 'myVar', 'my_var', 'var123'];

    const invalid = validateVariableNames(variables);

    expect(invalid.length).toBe(0);
  });

  it('should reject variable names starting with numbers', () => {
    const variables = ['123invalid', 'title', 'date'];

    const invalid = validateVariableNames(variables);

    expect(invalid).toContain('123invalid');
    expect(invalid.length).toBe(1);
  });

  it('should reject variable names with special characters', () => {
    const variables = ['my-var', 'my.var', 'my var', 'title'];

    const invalid = validateVariableNames(variables);

    expect(invalid).toContain('my-var');
    expect(invalid).toContain('my.var');
    expect(invalid).toContain('my var');
    expect(invalid.length).toBe(3);
  });

  it('should accept underscores but reject other special characters', () => {
    const variables = ['my_valid_var', 'my@invalid', 'another_valid'];

    const invalid = validateVariableNames(variables);

    expect(invalid).toContain('my@invalid');
    expect(invalid.length).toBe(1);
  });
});
