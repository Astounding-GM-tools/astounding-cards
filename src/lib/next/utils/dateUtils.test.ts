import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime } from './dateUtils.js';

describe('formatTime', () => {
  beforeEach(() => {
    // Reset to a consistent test time: January 1, 2024, 12:00:00 UTC
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    
    // Mock navigator.languages for consistent US locale formatting
    Object.defineProperty(global, 'navigator', {
      value: {
        languages: ['en-US']
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('date format', () => {
    it('formats current date', () => {
      const now = Date.now();
      const result = formatTime(now, 'date');
      expect(result).toBe('Jan 1, 2024');
    });

    it('formats past date', () => {
      const pastDate = new Date('2023-12-25T10:30:00Z').getTime();
      const result = formatTime(pastDate, 'date');
      expect(result).toBe('Dec 25, 2023');
    });

    it('formats Date object as timestamp', () => {
      const dateObj = new Date('2023-06-15T14:22:33Z');
      const result = formatTime(dateObj.getTime(), 'date');
      expect(result).toBe('Jun 15, 2023');
    });
  });

  describe('dateTime format (default)', () => {
    it('formats current dateTime', () => {
      const now = Date.now();
      const result = formatTime(now, 'dateTime');
      expect(result).toBe('Jan 1, 2024, 01:00 PM');
    });

    it('formats current dateTime without format (uses default)', () => {
      const now = Date.now();
      const result = formatTime(now); // No format specified, should default to dateTime
      expect(result).toBe('Jan 1, 2024, 01:00 PM');
    });

    it('formats past dateTime', () => {
      const pastDateTime = new Date('2023-07-04T16:20:00Z').getTime();
      const result = formatTime(pastDateTime, 'dateTime');
      expect(result).toBe('Jul 4, 2023, 06:20 PM');
    });

    it('formats morning time', () => {
      const morningTime = new Date('2024-01-01T08:30:00Z').getTime();
      const result = formatTime(morningTime, 'dateTime');
      expect(result).toBe('Jan 1, 2024, 09:30 AM');
    });

    it('formats evening time', () => {
      const eveningTime = new Date('2024-01-01T20:45:00Z').getTime();
      const result = formatTime(eveningTime, 'dateTime');
      expect(result).toBe('Jan 1, 2024, 09:45 PM');
    });
  });

  describe('timeAgo format - verbose (default)', () => {
    it('shows "Just now" for current time', () => {
      const now = Date.now();
      const result = formatTime(now, 'timeAgo');
      expect(result).toBe('Just now');
    });

    it('shows "Just now" for 30 seconds ago', () => {
      const thirtySecondsAgo = Date.now() - (30 * 1000);
      const result = formatTime(thirtySecondsAgo, 'timeAgo');
      expect(result).toBe('Just now');
    });

    it('shows minutes for 2 minutes ago', () => {
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
      const result = formatTime(twoMinutesAgo, 'timeAgo');
      expect(result).toBe('2 minutes ago');
    });

    it('shows "1 minute ago" for singular', () => {
      const oneMinuteAgo = Date.now() - (1 * 60 * 1000);
      const result = formatTime(oneMinuteAgo, 'timeAgo');
      expect(result).toBe('1 minute ago');
    });

    it('shows hours for 3 hours ago', () => {
      const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
      const result = formatTime(threeHoursAgo, 'timeAgo');
      expect(result).toBe('3 hours ago');
    });

    it('shows "1 hour ago" for singular', () => {
      const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000);
      const result = formatTime(oneHourAgo, 'timeAgo');
      expect(result).toBe('1 hour ago');
    });

    it('shows hours ago for same day', () => {
      // 8 hours ago - should show as "8 hours ago" since it's verbose mode
      const eightHoursAgo = Date.now() - (8 * 60 * 60 * 1000);
      const result = formatTime(eightHoursAgo, 'timeAgo');
      expect(result).toBe('8 hours ago');
    });

    it('shows "2 days ago" for different day', () => {
      // 2 days ago - shows as "2 days ago" in verbose mode (not date format)
      const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
      const result = formatTime(twoDaysAgo, 'timeAgo');
      expect(result).toBe('2 days ago');
    });

    it('shows date for previous year', () => {
      // Date from previous year
      const lastYear = new Date('2023-06-15T10:00:00Z').getTime();
      const result = formatTime(lastYear, 'timeAgo');
      expect(result).toBe('Jun 15, 2023');
    });
  });

  describe('timeAgo format - compact', () => {
    it('shows "Just now" for current time', () => {
      const now = Date.now();
      const result = formatTime(now, 'timeAgo', { compact: true });
      expect(result).toBe('Just now');
    });

    it('shows "Just now" for 30 seconds ago', () => {
      const thirtySecondsAgo = Date.now() - (30 * 1000);
      const result = formatTime(thirtySecondsAgo, 'timeAgo', { compact: true });
      expect(result).toBe('Just now');
    });

    it('shows compact minutes for 2 minutes ago', () => {
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
      const result = formatTime(twoMinutesAgo, 'timeAgo', { compact: true });
      expect(result).toBe('2m ago');
    });

    it('shows compact hours for 3 hours ago', () => {
      const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
      const result = formatTime(threeHoursAgo, 'timeAgo', { compact: true });
      expect(result).toBe('3h ago');
    });

    it('shows compact hours for same day (not time)', () => {
      // 8 hours ago - shows as "8h ago" in compact mode (not time)
      const eightHoursAgo = Date.now() - (8 * 60 * 60 * 1000);
      const result = formatTime(eightHoursAgo, 'timeAgo', { compact: true });
      expect(result).toBe('8h ago');
    });

    it('shows date for different day', () => {
      // 2 days ago
      const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
      const result = formatTime(twoDaysAgo, 'timeAgo', { compact: true });
      expect(result).toBe('Dec 30');
    });
  });

  describe('edge cases and error handling', () => {
    it('handles invalid timestamp gracefully', () => {
      const result = formatTime(NaN, 'date');
      expect(result).toBe('Invalid Date');
    });

    it('handles negative timestamp', () => {
      const negativeTime = -1000;
      const result = formatTime(negativeTime, 'date');
      expect(result).toBe('Jan 1, 1970'); // Negative timestamps formatted in US locale
    });

    it('handles very large timestamp', () => {
      const largeTime = 9999999999999; // Year 2286
      const result = formatTime(largeTime, 'date');
      expect(result).toContain('2286'); // Should contain the year
    });

    it('defaults to dateTime format for unknown format', () => {
      // @ts-expect-error Testing invalid format
      const result = formatTime(Date.now(), 'invalid');
      expect(result).toBe('Jan 1, 2024, 01:00 PM'); // Defaults to dateTime format
    });
  });

  describe('cross-format consistency', () => {
    it('produces consistent results for same timestamp across formats', () => {
      const timestamp = new Date('2023-08-15T14:30:45Z').getTime();
      
      const dateResult = formatTime(timestamp, 'date');
      const dateTimeResult = formatTime(timestamp, 'dateTime');
      
      expect(dateResult).toBe('Aug 15, 2023');
      expect(dateTimeResult).toBe('Aug 15, 2023, 04:30 PM'); // Adjusted for timezone
      expect(dateTimeResult).toContain(dateResult);
    });
  });

  describe('boundary conditions for timeAgo', () => {
    it('handles exactly 1 minute boundary', () => {
      const exactlyOneMinute = Date.now() - (60 * 1000);
      const result = formatTime(exactlyOneMinute, 'timeAgo');
      expect(result).toBe('1 minute ago');
    });

    it('handles exactly 1 hour boundary', () => {
      const exactlyOneHour = Date.now() - (60 * 60 * 1000);
      const result = formatTime(exactlyOneHour, 'timeAgo');
      expect(result).toBe('1 hour ago');
    });

    it('handles exactly 24 hours boundary', () => {
      // Exactly 24 hours ago should show as "1 day ago"
      const exactly24Hours = Date.now() - (24 * 60 * 60 * 1000);
      const result = formatTime(exactly24Hours, 'timeAgo');
      expect(result).toBe('1 day ago');
    });

    it('handles new year boundary', () => {
      // Test crossing year boundary - about 12 hours ago from Jan 1 to Dec 31 previous year
      const lastYearEnd = new Date('2023-12-31T23:59:59Z').getTime();
      const result = formatTime(lastYearEnd, 'timeAgo');
      expect(result).toBe('12 hours ago'); // It's actually about 12 hours ago, not days
    });
  });

  describe('locale awareness', () => {
    it('uses system locale for formatting', () => {
      // This test verifies that the function uses toLocaleDateString/toLocaleTimeString
      const timestamp = new Date('2023-12-25T15:30:00Z').getTime();
      
      const dateResult = formatTime(timestamp, 'date');
      const dateTimeResult = formatTime(timestamp, 'dateTime');
      
      // These should be valid date/time strings 
      expect(dateResult).toMatch(/Dec 25, 2023/);
      expect(dateTimeResult).toMatch(/Dec 25, 2023/);
      expect(dateResult).not.toBe('Invalid Date');
      expect(dateTimeResult).not.toBe('Invalid Date');
    });
  });

  describe('performance and type safety', () => {
    it('accepts timestamps as numbers', () => {
      const timestamp = 1690712130000; // July 30, 2023, 10:15:30 UTC
      const result = formatTime(timestamp, 'date');
      expect(result).toBe('Jul 30, 2023');
    });

    it('handles large batch of operations efficiently', () => {
      // Test that function can handle many calls without issues
      const timestamps = Array.from({ length: 100 }, (_, i) => 
        Date.now() - (i * 60 * 1000) // Every minute back
      );
      
      const results = timestamps.map(ts => formatTime(ts, 'timeAgo'));
      
      expect(results).toHaveLength(100);
      expect(results[0]).toBe('Just now');
      expect(results[1]).toBe('1 minute ago');
      expect(results[59]).toBe('59 minutes ago');
    });
  });
});
