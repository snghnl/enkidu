import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { rmSync } from 'fs';
import {
  readFile,
  writeFile,
  deleteFile,
  fileExists,
  ensureDir,
  listFilesRecursive,
  listFiles,
  copyFile,
} from '../fs.js';

describe('fs utilities', () => {
  const testDir = join(process.cwd(), 'test-temp-fs');

  beforeEach(() => {
    ensureDir(testDir);
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('writeFile', () => {
    it('should write content to file', () => {
      const filePath = join(testDir, 'test.txt');
      writeFile(filePath, 'Hello World');

      expect(fileExists(filePath)).toBe(true);
      expect(readFile(filePath)).toBe('Hello World');
    });

    it('should create parent directories if needed', () => {
      const filePath = join(testDir, 'nested', 'deep', 'file.txt');
      writeFile(filePath, 'Content');

      expect(fileExists(filePath)).toBe(true);
    });

    it('should overwrite existing file', () => {
      const filePath = join(testDir, 'test.txt');
      writeFile(filePath, 'First');
      writeFile(filePath, 'Second');

      expect(readFile(filePath)).toBe('Second');
    });

    it('should handle empty content', () => {
      const filePath = join(testDir, 'empty.txt');
      writeFile(filePath, '');

      expect(fileExists(filePath)).toBe(true);
      expect(readFile(filePath)).toBe('');
    });

    it('should handle special characters', () => {
      const filePath = join(testDir, 'special.txt');
      const content = 'Special: 你好 🎉 \n\t\r';
      writeFile(filePath, content);

      expect(readFile(filePath)).toBe(content);
    });
  });

  describe('readFile', () => {
    it('should read file content', () => {
      const filePath = join(testDir, 'test.txt');
      writeFile(filePath, 'Test Content');

      expect(readFile(filePath)).toBe('Test Content');
    });

    it('should throw error for non-existent file', () => {
      const filePath = join(testDir, 'non-existent.txt');

      expect(() => readFile(filePath)).toThrow('File not found');
    });

    it('should handle multiline content', () => {
      const filePath = join(testDir, 'multiline.txt');
      const content = 'Line 1\nLine 2\nLine 3';
      writeFile(filePath, content);

      expect(readFile(filePath)).toBe(content);
    });

    it('should preserve UTF-8 encoding', () => {
      const filePath = join(testDir, 'utf8.txt');
      const content = '你好世界 🌍';
      writeFile(filePath, content);

      expect(readFile(filePath)).toBe(content);
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', () => {
      const filePath = join(testDir, 'test.txt');
      writeFile(filePath, 'Content');

      deleteFile(filePath);

      expect(fileExists(filePath)).toBe(false);
    });

    it('should not throw error for non-existent file', () => {
      const filePath = join(testDir, 'non-existent.txt');

      expect(() => deleteFile(filePath)).not.toThrow();
    });

    it('should allow deletion multiple times', () => {
      const filePath = join(testDir, 'test.txt');
      writeFile(filePath, 'Content');

      deleteFile(filePath);
      deleteFile(filePath);

      expect(fileExists(filePath)).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      const filePath = join(testDir, 'test.txt');
      writeFile(filePath, 'Content');

      expect(fileExists(filePath)).toBe(true);
    });

    it('should return false for non-existent file', () => {
      const filePath = join(testDir, 'non-existent.txt');

      expect(fileExists(filePath)).toBe(false);
    });

    it('should return true for directories', () => {
      const dirPath = join(testDir, 'subdir');
      ensureDir(dirPath);

      expect(fileExists(dirPath)).toBe(true);
    });

    it('should return false after deletion', () => {
      const filePath = join(testDir, 'test.txt');
      writeFile(filePath, 'Content');
      deleteFile(filePath);

      expect(fileExists(filePath)).toBe(false);
    });
  });

  describe('ensureDir', () => {
    it('should create directory if it does not exist', () => {
      const dirPath = join(testDir, 'newdir');
      ensureDir(dirPath);

      expect(fileExists(dirPath)).toBe(true);
    });

    it('should not throw error if directory exists', () => {
      const dirPath = join(testDir, 'existingdir');
      ensureDir(dirPath);

      expect(() => ensureDir(dirPath)).not.toThrow();
    });

    it('should create nested directories', () => {
      const dirPath = join(testDir, 'nested', 'deep', 'directory');
      ensureDir(dirPath);

      expect(fileExists(dirPath)).toBe(true);
    });

    it('should allow creating multiple directories', () => {
      ensureDir(join(testDir, 'dir1'));
      ensureDir(join(testDir, 'dir2'));
      ensureDir(join(testDir, 'dir3'));

      expect(fileExists(join(testDir, 'dir1'))).toBe(true);
      expect(fileExists(join(testDir, 'dir2'))).toBe(true);
      expect(fileExists(join(testDir, 'dir3'))).toBe(true);
    });
  });

  describe('listFiles', () => {
    beforeEach(() => {
      writeFile(join(testDir, 'file1.txt'), 'Content 1');
      writeFile(join(testDir, 'file2.txt'), 'Content 2');
      writeFile(join(testDir, 'file3.md'), 'Content 3');
      ensureDir(join(testDir, 'subdir'));
      writeFile(join(testDir, 'subdir', 'nested.txt'), 'Nested');
    });

    it('should list all files in directory', () => {
      const files = listFiles(testDir);

      expect(files).toHaveLength(3);
      expect(files.some(f => f.includes('file1.txt'))).toBe(true);
      expect(files.some(f => f.includes('file2.txt'))).toBe(true);
      expect(files.some(f => f.includes('file3.md'))).toBe(true);
    });

    it('should filter by extension', () => {
      const files = listFiles(testDir, '.txt');

      expect(files).toHaveLength(2);
      expect(files.every(f => f.endsWith('.txt'))).toBe(true);
    });

    it('should not include subdirectory files', () => {
      const files = listFiles(testDir);

      expect(files.some(f => f.includes('nested.txt'))).toBe(false);
    });

    it('should return empty array for non-existent directory', () => {
      const files = listFiles(join(testDir, 'non-existent'));

      expect(files).toEqual([]);
    });

    it('should return empty array for empty directory', () => {
      const emptyDir = join(testDir, 'empty');
      ensureDir(emptyDir);

      const files = listFiles(emptyDir);

      expect(files).toEqual([]);
    });
  });

  describe('listFilesRecursive', () => {
    beforeEach(() => {
      writeFile(join(testDir, 'root.txt'), 'Root');
      writeFile(join(testDir, 'root.md'), 'Root MD');
      ensureDir(join(testDir, 'subdir1'));
      writeFile(join(testDir, 'subdir1', 'file1.txt'), 'File 1');
      ensureDir(join(testDir, 'subdir2'));
      writeFile(join(testDir, 'subdir2', 'file2.txt'), 'File 2');
      ensureDir(join(testDir, 'subdir1', 'nested'));
      writeFile(join(testDir, 'subdir1', 'nested', 'deep.txt'), 'Deep');
    });

    it('should list all files recursively', () => {
      const files = listFilesRecursive(testDir);

      expect(files.length).toBeGreaterThanOrEqual(5);
      expect(files.some(f => f.includes('root.txt'))).toBe(true);
      expect(files.some(f => f.includes('file1.txt'))).toBe(true);
      expect(files.some(f => f.includes('file2.txt'))).toBe(true);
      expect(files.some(f => f.includes('deep.txt'))).toBe(true);
    });

    it('should filter by extension recursively', () => {
      const files = listFilesRecursive(testDir, '.txt');

      expect(files.length).toBe(4);
      expect(files.every(f => f.endsWith('.txt'))).toBe(true);
    });

    it('should return empty array for non-existent directory', () => {
      const files = listFilesRecursive(join(testDir, 'non-existent'));

      expect(files).toEqual([]);
    });

    it('should handle deeply nested structures', () => {
      const deepPath = join(testDir, 'a', 'b', 'c', 'd');
      ensureDir(deepPath);
      writeFile(join(deepPath, 'deep.txt'), 'Deep content');

      const files = listFilesRecursive(testDir, '.txt');

      expect(files.some(f => f.includes(join('a', 'b', 'c', 'd', 'deep.txt')))).toBe(true);
    });

    it('should return all files when no extension specified', () => {
      const txtFiles = listFilesRecursive(testDir, '.txt');
      const mdFiles = listFilesRecursive(testDir, '.md');
      const allFiles = listFilesRecursive(testDir);

      expect(allFiles.length).toBe(txtFiles.length + mdFiles.length);
    });
  });

  describe('copyFile', () => {
    it('should copy file content', () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');

      writeFile(source, 'Original Content');
      copyFile(source, dest);

      expect(readFile(dest)).toBe('Original Content');
    });

    it('should create destination directories if needed', () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'nested', 'deep', 'dest.txt');

      writeFile(source, 'Content');
      copyFile(source, dest);

      expect(fileExists(dest)).toBe(true);
      expect(readFile(dest)).toBe('Content');
    });

    it('should overwrite existing destination', () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');

      writeFile(source, 'New Content');
      writeFile(dest, 'Old Content');
      copyFile(source, dest);

      expect(readFile(dest)).toBe('New Content');
    });

    it('should preserve file content exactly', () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');
      const content = 'Multi\nLine\nContent\nWith Special: 🎉';

      writeFile(source, content);
      copyFile(source, dest);

      expect(readFile(dest)).toBe(content);
      expect(readFile(dest)).toBe(readFile(source));
    });

    it('should throw error for non-existent source', () => {
      const source = join(testDir, 'non-existent.txt');
      const dest = join(testDir, 'dest.txt');

      expect(() => copyFile(source, dest)).toThrow('File not found');
    });

    it('should handle copying to same directory with different name', () => {
      const source = join(testDir, 'original.txt');
      const dest = join(testDir, 'copy.txt');

      writeFile(source, 'Content');
      copyFile(source, dest);

      expect(fileExists(source)).toBe(true);
      expect(fileExists(dest)).toBe(true);
      expect(readFile(source)).toBe(readFile(dest));
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle files with special characters in names', () => {
      const filePath = join(testDir, 'file-with_special.chars.txt');
      writeFile(filePath, 'Content');

      expect(fileExists(filePath)).toBe(true);
      expect(readFile(filePath)).toBe('Content');
    });

    it('should handle large file content', () => {
      const filePath = join(testDir, 'large.txt');
      const largeContent = 'x'.repeat(100000);

      writeFile(filePath, largeContent);

      expect(readFile(filePath)).toBe(largeContent);
    });

    it('should handle concurrent operations', () => {
      const file1 = join(testDir, 'file1.txt');
      const file2 = join(testDir, 'file2.txt');
      const file3 = join(testDir, 'file3.txt');

      writeFile(file1, 'Content 1');
      writeFile(file2, 'Content 2');
      writeFile(file3, 'Content 3');

      expect(readFile(file1)).toBe('Content 1');
      expect(readFile(file2)).toBe('Content 2');
      expect(readFile(file3)).toBe('Content 3');
    });
  });
});
