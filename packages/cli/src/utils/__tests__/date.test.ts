import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDateForFilename,
  formatDateForDisplay,
  getDayName,
  getMonthName,
  getWeekRange,
  getMonthRange,
  parseMonth,
  getDatesInWeek,
  getDatesInMonth,
} from '../date.js';

describe('parseDate', () => {
  it('should parse "today"', () => {
    const result = parseDate('today');
    const today = new Date();
    expect(result.getDate()).toBe(today.getDate());
    expect(result.getMonth()).toBe(today.getMonth());
    expect(result.getFullYear()).toBe(today.getFullYear());
  });

  it('should parse "yesterday"', () => {
    const result = parseDate('yesterday');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(result.getDate()).toBe(yesterday.getDate());
  });

  it('should parse "tomorrow"', () => {
    const result = parseDate('tomorrow');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.getDate()).toBe(tomorrow.getDate());
  });

  it('should parse YYYY-MM-DD format', () => {
    const result = parseDate('2026-02-15');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // 0-indexed
    expect(result.getDate()).toBe(15);
  });

  it('should parse MM/DD/YYYY format', () => {
    const result = parseDate('02/15/2026');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(15);
  });

  it('should be case insensitive for relative dates', () => {
    expect(parseDate('TODAY')).toBeDefined();
    expect(parseDate('Yesterday')).toBeDefined();
    expect(parseDate('TOMORROW')).toBeDefined();
  });

  it('should throw error for invalid date format', () => {
    expect(() => parseDate('invalid-date')).toThrow('Invalid date format');
    expect(() => parseDate('13/45/2026')).toThrow();
  });

  it('should parse ISO date strings', () => {
    const result = parseDate('2026-02-15T10:30:00Z');
    expect(result).toBeInstanceOf(Date);
  });
});

describe('formatDateForFilename', () => {
  const testDate = new Date('2026-02-15T10:30:00');

  it('should format with default pattern', () => {
    const result = formatDateForFilename(testDate);
    expect(result).toBe('2026/02/15.md');
  });

  it('should format with custom pattern YYYY-MM-DD', () => {
    const result = formatDateForFilename(testDate, 'YYYY-MM-DD.md');
    expect(result).toBe('2026-02-15.md');
  });

  it('should format with year/month pattern', () => {
    const result = formatDateForFilename(testDate, 'YYYY/MM.md');
    expect(result).toBe('2026/02.md');
  });

  it('should always append .md extension', () => {
    const result = formatDateForFilename(testDate, 'YYYY/MM/DD');
    expect(result).toMatch(/\.md$/);
  });
});

describe('formatDateForDisplay', () => {
  const testDate = new Date('2026-02-15T10:30:45');

  it('should format with default pattern YYYY-MM-DD', () => {
    const result = formatDateForDisplay(testDate);
    expect(result).toBe('2026-02-15');
  });

  it('should format with custom pattern', () => {
    const result = formatDateForDisplay(testDate, 'MM/DD/YYYY');
    expect(result).toBe('02/15/2026');
  });

  it('should handle time patterns', () => {
    const result = formatDateForDisplay(testDate, 'YYYY-MM-DD HH:mm:ss');
    expect(result).toBe('2026-02-15 10:30:45');
  });

  it('should handle year-only pattern', () => {
    const result = formatDateForDisplay(testDate, 'YYYY');
    expect(result).toBe('2026');
  });
});

describe('getDayName', () => {
  it('should return correct day names', () => {
    expect(getDayName(new Date('2026-02-16'))).toBe('Monday');
    expect(getDayName(new Date('2026-02-15'))).toBe('Sunday');
    expect(getDayName(new Date('2026-02-14'))).toBe('Saturday');
  });

  it('should return full day name', () => {
    const result = getDayName(new Date('2026-02-16'));
    expect(result).not.toBe('Mon');
    expect(result).toBe('Monday');
  });
});

describe('getMonthName', () => {
  it('should return correct month names', () => {
    expect(getMonthName(new Date('2026-01-15'))).toBe('January');
    expect(getMonthName(new Date('2026-02-15'))).toBe('February');
    expect(getMonthName(new Date('2026-12-15'))).toBe('December');
  });

  it('should return full month name', () => {
    const result = getMonthName(new Date('2026-02-15'));
    expect(result).not.toBe('Feb');
    expect(result).toBe('February');
  });
});

describe('getWeekRange', () => {
  it('should return week starting on Monday', () => {
    const date = new Date('2026-02-15'); // Sunday
    const { start, end } = getWeekRange(date);

    expect(getDayName(start)).toBe('Monday');
    expect(getDayName(end)).toBe('Sunday');
  });

  it('should span 7 days', () => {
    const date = new Date('2026-02-15');
    const { start, end } = getWeekRange(date);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(6); // 6 days difference (7 days total)
  });

  it('should include the given date', () => {
    const date = new Date('2026-02-15');
    const { start, end } = getWeekRange(date);

    expect(date >= start && date <= end).toBe(true);
  });

  it('should work for dates at start of week', () => {
    const monday = new Date('2026-02-16'); // Monday
    const { start } = getWeekRange(monday);

    expect(start.getDate()).toBe(monday.getDate());
  });
});

describe('getMonthRange', () => {
  it('should return first and last day of month', () => {
    const date = new Date('2026-02-15');
    const { start, end } = getMonthRange(date);

    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(28); // February 2026 has 28 days
  });

  it('should handle months with 31 days', () => {
    const date = new Date('2026-01-15');
    const { end } = getMonthRange(date);

    expect(end.getDate()).toBe(31);
  });

  it('should handle months with 30 days', () => {
    const date = new Date('2026-04-15');
    const { end } = getMonthRange(date);

    expect(end.getDate()).toBe(30);
  });

  it('should handle leap years', () => {
    const date = new Date('2024-02-15'); // 2024 is a leap year
    const { end } = getMonthRange(date);

    expect(end.getDate()).toBe(29);
  });

  it('should include the given date', () => {
    const date = new Date('2026-02-15');
    const { start, end } = getMonthRange(date);

    expect(date >= start && date <= end).toBe(true);
  });
});

describe('parseMonth', () => {
  it('should parse YYYY-MM format', () => {
    const result = parseMonth('2026-02');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // 0-indexed
  });

  it('should throw error for invalid format', () => {
    expect(() => parseMonth('2026-2')).toThrow('Invalid month format');
    expect(() => parseMonth('2026/02')).toThrow('Invalid month format');
    expect(() => parseMonth('02-2026')).toThrow('Invalid month format');
  });

  it('should throw error for invalid month numbers', () => {
    expect(() => parseMonth('2026-13')).toThrow();
    expect(() => parseMonth('2026-00')).toThrow();
  });

  it('should handle all valid months', () => {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const result = parseMonth(`2026-${monthStr}`);
      expect(result.getMonth()).toBe(month - 1);
    }
  });
});

describe('getDatesInWeek', () => {
  it('should return 7 dates', () => {
    const date = new Date('2026-02-15');
    const dates = getDatesInWeek(date);

    expect(dates).toHaveLength(7);
  });

  it('should start on Monday', () => {
    const date = new Date('2026-02-15'); // Sunday
    const dates = getDatesInWeek(date);

    expect(getDayName(dates[0])).toBe('Monday');
  });

  it('should end on Sunday', () => {
    const date = new Date('2026-02-15');
    const dates = getDatesInWeek(date);

    expect(getDayName(dates[6])).toBe('Sunday');
  });

  it('should contain consecutive dates', () => {
    const date = new Date('2026-02-15');
    const dates = getDatesInWeek(date);

    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime();
      const dayInMs = 1000 * 60 * 60 * 24;
      expect(diff).toBe(dayInMs);
    }
  });

  it('should include the given date', () => {
    const date = new Date('2026-02-15');
    const dates = getDatesInWeek(date);

    const found = dates.some(
      d => d.toDateString() === date.toDateString()
    );
    expect(found).toBe(true);
  });
});

describe('getDatesInMonth', () => {
  it('should return correct number of dates for February', () => {
    const date = new Date('2026-02-15');
    const dates = getDatesInMonth(date);

    expect(dates).toHaveLength(28);
  });

  it('should return 31 dates for January', () => {
    const date = new Date('2026-01-15');
    const dates = getDatesInMonth(date);

    expect(dates).toHaveLength(31);
  });

  it('should return 30 dates for April', () => {
    const date = new Date('2026-04-15');
    const dates = getDatesInMonth(date);

    expect(dates).toHaveLength(30);
  });

  it('should handle leap years', () => {
    const date = new Date('2024-02-15');
    const dates = getDatesInMonth(date);

    expect(dates).toHaveLength(29);
  });

  it('should start with the first day of month', () => {
    const date = new Date('2026-02-15');
    const dates = getDatesInMonth(date);

    expect(dates[0].getDate()).toBe(1);
  });

  it('should end with the last day of month', () => {
    const date = new Date('2026-02-15');
    const dates = getDatesInMonth(date);

    expect(dates[dates.length - 1].getDate()).toBe(28);
  });

  it('should contain consecutive dates', () => {
    const date = new Date('2026-02-15');
    const dates = getDatesInMonth(date);

    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getDate()).toBe(dates[i - 1].getDate() + 1);
    }
  });
});
