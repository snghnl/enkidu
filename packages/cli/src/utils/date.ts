import { format, parse, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Parse date string or relative date (yesterday, tomorrow, today)
 */
export function parseDate(dateString: string): Date {
  const lower = dateString.toLowerCase();
  const today = new Date();

  switch (lower) {
    case 'today':
      return today;
    case 'yesterday':
      return subDays(today, 1);
    case 'tomorrow':
      return addDays(today, 1);
    default:
      // Try to parse as ISO date or various formats
      try {
        // Try YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return parse(dateString, 'yyyy-MM-dd', new Date());
        }
        // Try MM/DD/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
          return parse(dateString, 'MM/dd/yyyy', new Date());
        }
        // Try as ISO date
        return new Date(dateString);
      } catch {
        throw new Error(`Invalid date format: ${dateString}`);
      }
  }
}

/**
 * Format date for daily note filename
 */
export function formatDateForFilename(date: Date, pattern: string = 'YYYY/MM/DD.md'): string {
  // Convert custom pattern to date-fns format
  let fnsPattern = pattern
    .replace('YYYY', 'yyyy')
    .replace('MM', 'MM')
    .replace('DD', 'dd')
    .replace('.md', '');

  return format(date, fnsPattern) + '.md';
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date, pattern: string = 'YYYY-MM-DD'): string {
  const fnsPattern = pattern
    .replace('YYYY', 'yyyy')
    .replace('MM', 'MM')
    .replace('DD', 'dd')
    .replace('HH', 'HH')
    .replace('mm', 'mm')
    .replace('ss', 'ss');

  return format(date, fnsPattern);
}

/**
 * Get day name (Monday, Tuesday, etc.)
 */
export function getDayName(date: Date): string {
  return format(date, 'EEEE');
}

/**
 * Get month name (January, February, etc.)
 */
export function getMonthName(date: Date): string {
  return format(date, 'MMMM');
}

/**
 * Get week range for a given date
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * Get month range for a given date
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Parse month string (YYYY-MM)
 */
export function parseMonth(monthString: string): Date {
  if (!/^\d{4}-\d{2}$/.test(monthString)) {
    throw new Error(`Invalid month format: ${monthString}. Expected YYYY-MM`);
  }
  return parse(monthString, 'yyyy-MM', new Date());
}

/**
 * Get all dates in a week
 */
export function getDatesInWeek(date: Date): Date[] {
  const { start } = getWeekRange(date);
  const dates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    dates.push(addDays(start, i));
  }

  return dates;
}

/**
 * Get all dates in a month
 */
export function getDatesInMonth(date: Date): Date[] {
  const { start, end } = getMonthRange(date);
  const dates: Date[] = [];
  let current = start;

  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}
