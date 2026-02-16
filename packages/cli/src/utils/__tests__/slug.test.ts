import { describe, it, expect } from 'vitest';
import { slugify, deslugify, generateUniqueSlug } from '../slug.js';

describe('slugify', () => {
  it('should convert text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('UPPERCASE TEXT')).toBe('uppercase-text');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('multiple   spaces   here')).toBe('multiple-spaces-here');
    expect(slugify('single space')).toBe('single-space');
  });

  it('should remove special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld');
    expect(slugify('test#tag$here%')).toBe('testtag here');
    expect(slugify('a&b|c')).toBe('abc');
  });

  it('should handle underscores', () => {
    expect(slugify('hello_world')).toBe('hello-world');
    expect(slugify('multiple___underscores')).toBe('multiple-underscores');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(slugify('-leading')).toBe('leading');
    expect(slugify('trailing-')).toBe('trailing');
    expect(slugify('--both--')).toBe('both');
  });

  it('should handle empty strings', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('should handle numbers', () => {
    expect(slugify('test 123')).toBe('test-123');
    expect(slugify('2024-01-15')).toBe('2024-01-15');
  });

  it('should handle complex real-world examples', () => {
    expect(slugify('My First Blog Post!')).toBe('my-first-blog-post');
    expect(slugify('JavaScript: The Good Parts')).toBe('javascript-the-good-parts');
    expect(slugify('C++ Programming Guide')).toBe('c-programming-guide');
  });

  it('should handle unicode characters', () => {
    expect(slugify('café')).toBe('caf');
    expect(slugify('über cool')).toBe('ber-cool');
  });

  it('should collapse multiple hyphens', () => {
    expect(slugify('word---word')).toBe('word-word');
    expect(slugify('a - b - c')).toBe('a-b-c');
  });
});

describe('deslugify', () => {
  it('should convert hyphens to spaces', () => {
    expect(deslugify('hello-world')).toBe('Hello World');
    expect(deslugify('my-blog-post')).toBe('My Blog Post');
  });

  it('should capitalize first letter of each word', () => {
    expect(deslugify('javascript-guide')).toBe('Javascript Guide');
    expect(deslugify('test')).toBe('Test');
  });

  it('should handle single words', () => {
    expect(deslugify('hello')).toBe('Hello');
  });

  it('should handle empty strings', () => {
    expect(deslugify('')).toBe('');
  });

  it('should handle slugs with numbers', () => {
    expect(deslugify('test-123')).toBe('Test 123');
    expect(deslugify('2024-01-15')).toBe('2024 01 15');
  });

  it('should be inverse of slugify for simple cases', () => {
    const original = 'Hello World';
    expect(deslugify(slugify(original))).toBe(original);
  });
});

describe('generateUniqueSlug', () => {
  it('should return base slug if not in existing slugs', () => {
    const result = generateUniqueSlug('test-slug', ['other-slug', 'another-slug']);
    expect(result).toBe('test-slug');
  });

  it('should append -1 if base slug exists', () => {
    const result = generateUniqueSlug('test-slug', ['test-slug']);
    expect(result).toBe('test-slug-1');
  });

  it('should increment number until unique', () => {
    const existing = ['test-slug', 'test-slug-1', 'test-slug-2'];
    const result = generateUniqueSlug('test-slug', existing);
    expect(result).toBe('test-slug-3');
  });

  it('should handle empty existing slugs array', () => {
    const result = generateUniqueSlug('test-slug', []);
    expect(result).toBe('test-slug');
  });

  it('should handle gaps in numbering', () => {
    const existing = ['test-slug', 'test-slug-1', 'test-slug-5'];
    const result = generateUniqueSlug('test-slug', existing);
    expect(result).toBe('test-slug-2');
  });

  it('should work with already numbered base slugs', () => {
    const existing = ['post-1'];
    const result = generateUniqueSlug('post-1', existing);
    expect(result).toBe('post-1-1');
  });

  it('should handle large number of duplicates', () => {
    const existing = Array.from({ length: 100 }, (_, i) =>
      i === 0 ? 'popular-slug' : `popular-slug-${i}`
    );
    const result = generateUniqueSlug('popular-slug', existing);
    expect(result).toBe('popular-slug-100');
  });
});
