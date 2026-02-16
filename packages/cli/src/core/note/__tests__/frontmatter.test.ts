import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseFrontmatter,
  stringifyFrontmatter,
  updateFrontmatter,
  extractFrontmatter,
  hasFrontmatter,
  createDefaultFrontmatter,
} from '../frontmatter.js';
import type { NoteFrontmatter } from '../../../types/note.js';

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter', () => {
    const content = `---
title: "Test Note"
created: "2026-02-15T10:00:00Z"
updated: "2026-02-15T10:00:00Z"
tags: ["test", "sample"]
category: "general"
---

# Test Content

This is the body.`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter.title).toBe('Test Note');
    expect(result.frontmatter.tags).toEqual(['test', 'sample']);
    expect(result.frontmatter.category).toBe('general');
    expect(result.content.trim()).toBe('# Test Content\n\nThis is the body.');
  });

  it('should handle content without frontmatter', () => {
    const content = '# Just Content\n\nNo frontmatter here.';
    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe(content);
  });

  it('should handle empty frontmatter', () => {
    const content = `---
---

# Content`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({});
    expect(result.content.trim()).toBe('# Content');
  });

  it('should preserve content formatting', () => {
    const content = `---
title: "Test"
---

# Header

- List item 1
- List item 2

\`\`\`javascript
code block
\`\`\``;

    const result = parseFrontmatter(content);
    expect(result.content).toContain('# Header');
    expect(result.content).toContain('```javascript');
  });

  it('should handle various frontmatter data types', () => {
    const content = `---
title: "Test"
number: 42
boolean: true
array: [1, 2, 3]
object:
  key: value
---

Content`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toMatchObject({
      title: 'Test',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { key: 'value' },
    });
  });
});

describe('stringifyFrontmatter', () => {
  it('should create valid markdown with frontmatter', () => {
    const frontmatter: NoteFrontmatter = {
      title: 'Test Note',
      created: '2026-02-15T10:00:00Z',
      updated: '2026-02-15T10:00:00Z',
      tags: ['test'],
      category: 'general',
    };
    const content = '# Test Content';

    const result = stringifyFrontmatter(frontmatter, content);

    expect(result).toContain('---');
    expect(result).toContain('title: Test Note');
    expect(result).toContain('tags:');
    expect(result).toContain('# Test Content');
  });

  it('should handle empty frontmatter', () => {
    const frontmatter: any = {};
    const content = '# Content';

    const result = stringifyFrontmatter(frontmatter, content);

    expect(result).toContain('---');
    expect(result).toContain('# Content');
  });

  it('should handle empty content', () => {
    const frontmatter: NoteFrontmatter = {
      title: 'Test',
      created: '2026-02-15T10:00:00Z',
      updated: '2026-02-15T10:00:00Z',
      tags: [],
      category: 'general',
    };

    const result = stringifyFrontmatter(frontmatter, '');

    expect(result).toContain('title: Test');
  });

  it('should preserve array formatting', () => {
    const frontmatter: NoteFrontmatter = {
      title: 'Test',
      created: '2026-02-15T10:00:00Z',
      updated: '2026-02-15T10:00:00Z',
      tags: ['tag1', 'tag2', 'tag3'],
      category: 'general',
    };
    const content = 'Content';

    const result = stringifyFrontmatter(frontmatter, content);

    expect(result).toContain('tags:');
    frontmatter.tags?.forEach(tag => {
      expect(result).toContain(tag);
    });
  });
});

describe('updateFrontmatter', () => {
  const originalContent = `---
title: "Original Title"
created: "2026-02-15T10:00:00Z"
updated: "2026-02-15T10:00:00Z"
tags: ["old"]
category: "general"
---

# Original Content`;

  it('should update existing fields', () => {
    const result = updateFrontmatter(originalContent, {
      title: 'Updated Title',
    });

    expect(result).toContain('title: Updated Title');
    expect(result).not.toContain('Original Title');
  });

  it('should add new fields', () => {
    const result = updateFrontmatter(originalContent, {
      publish: true,
      author: 'Test Author',
    } as any);

    expect(result).toContain('publish: true');
    expect(result).toContain('author: Test Author');
  });

  it('should preserve unchanged fields', () => {
    const result = updateFrontmatter(originalContent, {
      title: 'Updated',
    });

    expect(result).toContain('category: general');
    expect(result).toContain('created:');
  });

  it('should preserve content', () => {
    const result = updateFrontmatter(originalContent, {
      title: 'Updated',
    });

    expect(result).toContain('# Original Content');
  });

  it('should handle updating arrays', () => {
    const result = updateFrontmatter(originalContent, {
      tags: ['new', 'tags'],
    });

    expect(result).toContain('new');
    expect(result).toContain('tags');
    expect(result).not.toContain('old');
  });

  it('should handle multiple updates', () => {
    const result = updateFrontmatter(originalContent, {
      title: 'New Title',
      category: 'blog',
      tags: ['updated'],
    });

    expect(result).toContain('title: New Title');
    expect(result).toContain('category: blog');
    expect(result).toContain('updated');
  });
});

describe('extractFrontmatter', () => {
  it('should extract frontmatter without parsing content', () => {
    const content = `---
title: "Test Note"
created: "2026-02-15T10:00:00Z"
tags: ["test"]
---

# Large content...
${'x'.repeat(10000)}`;

    const result = extractFrontmatter(content);

    expect(result.title).toBe('Test Note');
    expect(result.tags).toEqual(['test']);
  });

  it('should return empty object for no frontmatter', () => {
    const content = '# Just content';
    const result = extractFrontmatter(content);

    expect(result).toEqual({});
  });

  it('should handle complex frontmatter', () => {
    const content = `---
title: "Test"
nested:
  key1: value1
  key2: value2
array: [1, 2, 3]
---

Content`;

    const result = extractFrontmatter(content);

    expect(result).toMatchObject({
      title: 'Test',
      nested: {
        key1: 'value1',
        key2: 'value2',
      },
      array: [1, 2, 3],
    });
  });
});

describe('hasFrontmatter', () => {
  it('should return true for content with frontmatter', () => {
    const content = `---
title: "Test"
---

Content`;

    expect(hasFrontmatter(content)).toBe(true);
  });

  it('should return false for content without frontmatter', () => {
    const content = '# Just content';
    expect(hasFrontmatter(content)).toBe(false);
  });

  it('should handle leading whitespace', () => {
    const content = `  ---
title: "Test"
---

Content`;

    expect(hasFrontmatter(content)).toBe(true);
  });

  it('should return false for --- in content but not at start', () => {
    const content = `# Content

---

More content`;

    expect(hasFrontmatter(content)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(hasFrontmatter('')).toBe(false);
  });

  it('should handle content that starts with newlines', () => {
    const content = `\n\n---
title: "Test"
---

Content`;

    expect(hasFrontmatter(content)).toBe(true);
  });
});

describe('createDefaultFrontmatter', () => {
  it('should create basic frontmatter with title', () => {
    const result = createDefaultFrontmatter('Test Note');

    expect(result.title).toBe('Test Note');
    expect(result.created).toBeDefined();
    expect(result.updated).toBeDefined();
    expect(result.tags).toEqual([]);
    expect(result.category).toBe('misc');
    expect(result.type).toBe('note');
    expect(result.publish).toBe(false);
  });

  it('should accept category option', () => {
    const result = createDefaultFrontmatter('Test', { category: 'blog' });

    expect(result.category).toBe('blog');
  });

  it('should accept type option', () => {
    const result = createDefaultFrontmatter('Test', { type: 'daily' });

    expect(result.type).toBe('daily');
  });

  it('should accept tags option', () => {
    const result = createDefaultFrontmatter('Test', {
      tags: ['tag1', 'tag2']
    });

    expect(result.tags).toEqual(['tag1', 'tag2']);
  });

  it('should accept multiple options', () => {
    const result = createDefaultFrontmatter('Test', {
      category: 'blog',
      type: 'blog',
      tags: ['writing', 'tech'],
    });

    expect(result.category).toBe('blog');
    expect(result.type).toBe('blog');
    expect(result.tags).toEqual(['writing', 'tech']);
  });

  it('should set created and updated to same time', () => {
    const result = createDefaultFrontmatter('Test');

    expect(result.created).toBe(result.updated);
  });

  it('should create valid ISO timestamps', () => {
    const result = createDefaultFrontmatter('Test');

    expect(() => new Date(result.created)).not.toThrow();
    expect(() => new Date(result.updated)).not.toThrow();
  });

  it('should handle empty title', () => {
    const result = createDefaultFrontmatter('');

    expect(result.title).toBe('');
  });

  it('should handle special characters in title', () => {
    const result = createDefaultFrontmatter('Test: Special & Characters!');

    expect(result.title).toBe('Test: Special & Characters!');
  });
});

describe('roundtrip operations', () => {
  it('should preserve data through parse and stringify cycle', () => {
    const original: NoteFrontmatter = {
      title: 'Test Note',
      created: '2026-02-15T10:00:00Z',
      updated: '2026-02-15T10:00:00Z',
      tags: ['test', 'sample'],
      category: 'general',
    };
    const content = '# Test Content';

    const stringified = stringifyFrontmatter(original, content);
    const parsed = parseFrontmatter(stringified);

    expect(parsed.frontmatter).toMatchObject(original);
    expect(parsed.content.trim()).toBe(content);
  });

  it('should preserve data through update operations', () => {
    const content = `---
title: "Original"
tags: ["tag1", "tag2"]
---

Content`;

    const updated1 = updateFrontmatter(content, { title: 'First Update' });
    const updated2 = updateFrontmatter(updated1, { title: 'Second Update' });

    const final = extractFrontmatter(updated2);

    expect(final.title).toBe('Second Update');
    expect(final.tags).toEqual(['tag1', 'tag2']);
  });
});
