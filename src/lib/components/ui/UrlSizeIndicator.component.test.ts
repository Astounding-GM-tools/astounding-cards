// UrlSizeIndicator.component.test.ts - Integration test for UrlSizeIndicator component

import { describe, it, expect } from 'vitest';
import {
  calculateUrlSize,
  formatSizeInKB,
  getWarningLevel,
  getWarningMessage,
  getUrlSizeInfo,
  SIZE_THRESHOLDS,
  type WarningLevel,
  type UrlSizeInfo
} from './UrlSizeIndicator.svelte.ts';

describe('UrlSizeIndicator Component Integration', () => {
  it('should import all required extracted functions without errors', () => {
    // Verify all functions are available
    expect(calculateUrlSize).toBeDefined();
    expect(formatSizeInKB).toBeDefined();
    expect(getWarningLevel).toBeDefined();
    expect(getWarningMessage).toBeDefined();
    expect(getUrlSizeInfo).toBeDefined();
    expect(SIZE_THRESHOLDS).toBeDefined();
  });

  it('should calculate URL size correctly', () => {
    const testUrl = 'http://example.com/test';
    const size = calculateUrlSize(testUrl);
    
    // Should return a positive number
    expect(size).toBeGreaterThan(0);
    
    // Should be at least the string length
    expect(size).toBeGreaterThanOrEqual(testUrl.length);
  });

  it('should format size in KB correctly', () => {
    expect(formatSizeInKB(1024)).toBe('1.0');
    expect(formatSizeInKB(2048)).toBe('2.0');
    expect(formatSizeInKB(1536)).toBe('1.5');
    expect(formatSizeInKB(512)).toBe('0.5');
  });

  it('should determine warning level correctly', () => {
    expect(getWarningLevel(1000)).toBe('low');
    expect(getWarningLevel(SIZE_THRESHOLDS.MEDIUM - 1)).toBe('low');
    expect(getWarningLevel(SIZE_THRESHOLDS.MEDIUM)).toBe('low');
    expect(getWarningLevel(SIZE_THRESHOLDS.MEDIUM + 1)).toBe('medium');
    expect(getWarningLevel(SIZE_THRESHOLDS.HIGH - 1)).toBe('medium');
    expect(getWarningLevel(SIZE_THRESHOLDS.HIGH)).toBe('medium');
    expect(getWarningLevel(SIZE_THRESHOLDS.HIGH + 1)).toBe('high');
  });

  it('should provide correct warning messages', () => {
    expect(getWarningMessage('low')).toBe(null);
    expect(getWarningMessage('medium')).toBe('Approaching size limit');
    expect(getWarningMessage('high')).toBe('Near limit - consider creating new deck');
  });

  it('should provide complete URL size info', () => {
    const testUrl = 'http://example.com/test';
    const info = getUrlSizeInfo(testUrl);
    
    expect(info).toHaveProperty('urlSize');
    expect(info).toHaveProperty('sizeInKB');
    expect(info).toHaveProperty('warningLevel');
    
    expect(typeof info.urlSize).toBe('number');
    expect(typeof info.sizeInKB).toBe('string');
    expect(['low', 'medium', 'high']).toContain(info.warningLevel);
    
    // Should be consistent with individual function results
    expect(info.urlSize).toBe(calculateUrlSize(testUrl));
    expect(info.sizeInKB).toBe(formatSizeInKB(info.urlSize));
    expect(info.warningLevel).toBe(getWarningLevel(info.urlSize));
  });

  it('should have consistent size thresholds', () => {
    expect(SIZE_THRESHOLDS.MEDIUM).toBeLessThan(SIZE_THRESHOLDS.HIGH);
    expect(SIZE_THRESHOLDS.MEDIUM).toBe(25000);
    expect(SIZE_THRESHOLDS.HIGH).toBe(30000);
  });

  it('should handle edge cases', () => {
    // Empty URL
    const emptyInfo = getUrlSizeInfo('');
    expect(emptyInfo.urlSize).toBeGreaterThanOrEqual(0);
    expect(emptyInfo.warningLevel).toBe('low');
    
    // Very long URL that would trigger high warning
    const longUrl = 'http://example.com/' + 'x'.repeat(35000);
    const longInfo = getUrlSizeInfo(longUrl);
    expect(longInfo.warningLevel).toBe('high');
    expect(getWarningMessage(longInfo.warningLevel)).toBe('Near limit - consider creating new deck');
  });
});
