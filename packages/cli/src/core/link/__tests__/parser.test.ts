import { describe, it, expect } from 'vitest';
import {
  extractWikiLinks,
  parseWikiLink,
  replaceWikiLinks,
  isValidWikiLink,
  createWikiLink,
} from '../parser.js';

describe('extractWikiLinks', () => {
  it('should extract simple wiki-link', () => {
    const content = 'This is a [[note]] link.';
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('note');
    expect(links[0].raw).toBe('[[note]]');
    expect(links[0].displayText).toBeUndefined();
  });

  it('should extract wiki-link with display text', () => {
    const content = 'Check [[note|Display Text]] here.';
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('note');
    expect(links[0].displayText).toBe('Display Text');
  });

  it('should extract multiple wiki-links', () => {
    const content = '[[first]] and [[second]] and [[third|Third]]';
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(3);
    expect(links[0].target).toBe('first');
    expect(links[1].target).toBe('second');
    expect(links[2].target).toBe('third');
    expect(links[2].displayText).toBe('Third');
  });

  it('should track line numbers', () => {
    const content = `Line 1
Line 2 with [[link]]
Line 3`;
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0].line).toBe(2);
  });

  it('should track character positions', () => {
    const content = 'Start [[note]] End';
    const links = extractWikiLinks(content);

    expect(links[0].startIndex).toBe(6);
    expect(links[0].endIndex).toBe(14);
  });

  it('should handle wiki-links at start of line', () => {
    const content = '[[note]] is first';
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0].startIndex).toBe(0);
  });

  it('should handle wiki-links at end of line', () => {
    const content = 'End with [[note]]';
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0].endIndex).toBe(17);
  });

  it('should handle empty content', () => {
    const links = extractWikiLinks('');

    expect(links).toHaveLength(0);
  });

  it('should handle content without wiki-links', () => {
    const content = 'Regular markdown [text](url)';
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(0);
  });

  it('should trim whitespace in target', () => {
    const content = '[[  note  ]]';
    const links = extractWikiLinks(content);

    expect(links[0].target).toBe('note');
  });

  it('should trim whitespace in display text', () => {
    const content = '[[note|  Display  ]]';
    const links = extractWikiLinks(content);

    expect(links[0].displayText).toBe('Display');
  });

  it('should handle wiki-links with hyphens', () => {
    const content = '[[my-note-name]]';
    const links = extractWikiLinks(content);

    expect(links[0].target).toBe('my-note-name');
  });

  it('should handle wiki-links with underscores', () => {
    const content = '[[my_note_name]]';
    const links = extractWikiLinks(content);

    expect(links[0].target).toBe('my_note_name');
  });

  it('should handle wiki-links with numbers', () => {
    const content = '[[note-123]]';
    const links = extractWikiLinks(content);

    expect(links[0].target).toBe('note-123');
  });

  it('should handle date-style links', () => {
    const content = '[[2026-02-15]]';
    const links = extractWikiLinks(content);

    expect(links[0].target).toBe('2026-02-15');
  });

  it('should handle multiple links on same line', () => {
    const content = '[[first]] text [[second]]';
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(2);
    expect(links[0].target).toBe('first');
    expect(links[1].target).toBe('second');
  });

  it('should handle adjacent wiki-links', () => {
    const content = '[[first]][[second]]';
    const links = extractWikiLinks(content);

    expect(links).toHaveLength(2);
  });

  it('should handle wiki-links in code blocks', () => {
    const content = '`[[not-a-link]]`';
    const links = extractWikiLinks(content);

    // Note: Parser doesn't distinguish code blocks, so it still extracts
    expect(links).toHaveLength(1);
  });

  it('should handle nested brackets correctly', () => {
    const content = '[[note-[test]]]';
    const links = extractWikiLinks(content);

    // This should not match due to nested brackets
    expect(links).toHaveLength(0);
  });

  it('should handle multiline content', () => {
    const content = `# Title

First paragraph with [[link1]].

Second paragraph with [[link2]].

Third with [[link3|Display]].`;

    const links = extractWikiLinks(content);

    expect(links).toHaveLength(3);
    expect(links[0].line).toBe(3);
    expect(links[1].line).toBe(5);
    expect(links[2].line).toBe(7);
  });
});

describe('parseWikiLink', () => {
  it('should parse simple wiki-link', () => {
    const link = parseWikiLink('[[note]]');

    expect(link).toBeTruthy();
    expect(link?.target).toBe('note');
    expect(link?.raw).toBe('[[note]]');
  });

  it('should parse wiki-link with display text', () => {
    const link = parseWikiLink('[[note|Display]]');

    expect(link).toBeTruthy();
    expect(link?.target).toBe('note');
    expect(link?.displayText).toBe('Display');
  });

  it('should return null for invalid format', () => {
    expect(parseWikiLink('[note]')).toBeNull();
    expect(parseWikiLink('[[note')).toBeNull();
    expect(parseWikiLink('note]]')).toBeNull();
    expect(parseWikiLink('note')).toBeNull();
  });

  it('should handle whitespace', () => {
    const link = parseWikiLink('[[  note  ]]');

    expect(link?.target).toBe('note');
  });

  it('should return null for empty string', () => {
    expect(parseWikiLink('')).toBeNull();
  });

  it('should parse only first link if multiple', () => {
    const link = parseWikiLink('[[first]][[second]]');

    expect(link?.target).toBe('first');
  });
});

describe('replaceWikiLinks', () => {
  it('should replace simple wiki-link', () => {
    const content = 'Text [[note]] end';
    const result = replaceWikiLinks(content, (link) => `[${link.target}]`);

    expect(result).toBe('Text [note] end');
  });

  it('should replace multiple wiki-links', () => {
    const content = '[[first]] and [[second]]';
    const result = replaceWikiLinks(content, (link) => `[${link.target}]`);

    expect(result).toBe('[first] and [second]');
  });

  it('should use display text in replacement', () => {
    const content = '[[note|Display]]';
    const result = replaceWikiLinks(
      content,
      (link) => `[${link.displayText || link.target}]`
    );

    expect(result).toBe('[Display]');
  });

  it('should handle empty content', () => {
    const result = replaceWikiLinks('', (link) => link.target);

    expect(result).toBe('');
  });

  it('should preserve content without links', () => {
    const content = 'No links here';
    const result = replaceWikiLinks(content, (link) => link.target);

    expect(result).toBe(content);
  });

  it('should handle adjacent replacements', () => {
    const content = '[[first]][[second]]';
    const result = replaceWikiLinks(content, (link) => link.target);

    expect(result).toBe('firstsecond');
  });

  it('should handle multiline replacements', () => {
    const content = `Line 1 [[link1]]
Line 2 [[link2]]`;
    const result = replaceWikiLinks(content, (link) => `<${link.target}>`);

    expect(result).toBe(`Line 1 <link1>
Line 2 <link2>`);
  });

  it('should convert to markdown links', () => {
    const content = '[[my-note|My Note]]';
    const result = replaceWikiLinks(
      content,
      (link) => `[${link.displayText || link.target}](${link.target}.md)`
    );

    expect(result).toBe('[My Note](my-note.md)');
  });

  it('should handle removal of links', () => {
    const content = 'Before [[link]] after';
    const result = replaceWikiLinks(content, () => '');

    expect(result).toBe('Before  after');
  });

  it('should handle expanding links', () => {
    const content = '[[note]]';
    const result = replaceWikiLinks(
      content,
      (link) => `This is a link to ${link.target}`
    );

    expect(result).toBe('This is a link to note');
  });
});

describe('isValidWikiLink', () => {
  it('should validate correct wiki-link', () => {
    expect(isValidWikiLink('[[note]]')).toBe(true);
    expect(isValidWikiLink('[[note|Display]]')).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidWikiLink('[note]')).toBe(false);
    expect(isValidWikiLink('[[note')).toBe(false);
    expect(isValidWikiLink('note]]')).toBe(false);
    expect(isValidWikiLink('note')).toBe(false);
  });

  it('should reject text with link inside', () => {
    expect(isValidWikiLink('text [[note]] text')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidWikiLink('')).toBe(false);
  });

  it('should validate links with special characters', () => {
    expect(isValidWikiLink('[[my-note-123]]')).toBe(true);
    expect(isValidWikiLink('[[2026-02-15]]')).toBe(true);
  });

  it('should reject nested brackets', () => {
    expect(isValidWikiLink('[[note[test]]]')).toBe(false);
  });

  it('should validate with whitespace', () => {
    expect(isValidWikiLink('[[  note  ]]')).toBe(true);
  });
});

describe('createWikiLink', () => {
  it('should create simple wiki-link', () => {
    const result = createWikiLink('note');

    expect(result).toBe('[[note]]');
  });

  it('should create wiki-link with display text', () => {
    const result = createWikiLink('note', 'Display Text');

    expect(result).toBe('[[note|Display Text]]');
  });

  it('should handle empty display text', () => {
    const result = createWikiLink('note', '');

    expect(result).toBe('[[note|]]');
  });

  it('should handle targets with hyphens', () => {
    const result = createWikiLink('my-note');

    expect(result).toBe('[[my-note]]');
  });

  it('should handle date targets', () => {
    const result = createWikiLink('2026-02-15', 'Today');

    expect(result).toBe('[[2026-02-15|Today]]');
  });

  it('should create valid wiki-links', () => {
    const link = createWikiLink('test');
    expect(isValidWikiLink(link)).toBe(true);

    const linkWithDisplay = createWikiLink('test', 'Test');
    expect(isValidWikiLink(linkWithDisplay)).toBe(true);
  });

  it('should handle special characters in target', () => {
    const result = createWikiLink('note_123-test');

    expect(result).toBe('[[note_123-test]]');
  });

  it('should handle special characters in display text', () => {
    const result = createWikiLink('note', 'Display: Text!');

    expect(result).toBe('[[note|Display: Text!]]');
  });
});

describe('roundtrip operations', () => {
  it('should parse created wiki-link', () => {
    const created = createWikiLink('note', 'Display');
    const parsed = parseWikiLink(created);

    expect(parsed?.target).toBe('note');
    expect(parsed?.displayText).toBe('Display');
  });

  it('should extract created wiki-links from content', () => {
    const link1 = createWikiLink('note1');
    const link2 = createWikiLink('note2', 'Display');
    const content = `Text ${link1} and ${link2} end`;

    const extracted = extractWikiLinks(content);

    expect(extracted).toHaveLength(2);
    expect(extracted[0].target).toBe('note1');
    expect(extracted[1].target).toBe('note2');
    expect(extracted[1].displayText).toBe('Display');
  });

  it('should replace and recreate links', () => {
    const content = '[[note1]] and [[note2|Display]]';

    const replaced = replaceWikiLinks(content, (link) =>
      createWikiLink(link.target.toUpperCase(), link.displayText)
    );

    const extracted = extractWikiLinks(replaced);

    expect(extracted[0].target).toBe('NOTE1');
    expect(extracted[1].target).toBe('NOTE2');
    expect(extracted[1].displayText).toBe('Display');
  });
});
