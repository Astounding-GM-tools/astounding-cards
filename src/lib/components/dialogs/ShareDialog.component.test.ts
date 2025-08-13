/**
 * Integration test for the refactored ShareDialog component
 * Ensures the component still works correctly after logic extraction
 */

import { describe, it, expect } from 'vitest';

// Import the extracted logic to verify it's accessible
import {
  initializeShareDialogState,
  calculateDeckStats,
  getBrowserSupport,
  getUrlSizeStatus,
  handleShare,
  BROWSER_LIMITS,
  type ShareDialogState
} from './ShareDialog.svelte.ts';

describe('ShareDialog Component Integration', () => {
  it('should import all extracted logic functions without errors', () => {
    // Test that all main functions are available
    expect(typeof initializeShareDialogState).toBe('function');
    expect(typeof calculateDeckStats).toBe('function');
    expect(typeof getBrowserSupport).toBe('function');
    expect(typeof getUrlSizeStatus).toBe('function');
    expect(typeof handleShare).toBe('function');
    expect(typeof BROWSER_LIMITS).toBe('object');
  });

  it('should maintain proper TypeScript types for ShareDialogState', () => {
    const state: ShareDialogState = {
      activeTab: 'share',
      showMigration: false,
      urlSize: 1024,
      blobCount: 2,
      missingImageCount: 1,
      migrationNeeded: true
    };

    // These should compile without TypeScript errors
    expect(state.activeTab).toBe('share');
    expect(state.showMigration).toBe(false);
    expect(state.urlSize).toBe(1024);
    expect(state.blobCount).toBe(2);
    expect(state.missingImageCount).toBe(1);
    expect(state.migrationNeeded).toBe(true);
  });

  it('should work correctly with the extracted logic workflow', () => {
    // Initialize state
    let state = initializeShareDialogState();
    expect(state.activeTab).toBe('share');
    expect(state.showMigration).toBe(false);
    expect(state.migrationNeeded).toBe(false);

    // Test tab switching
    state = { ...state, activeTab: 'backup' };
    expect(state.activeTab).toBe('backup');

    // Test migration dialog
    state = { ...state, showMigration: true };
    expect(state.showMigration).toBe(true);

    // Test migration needed workflow
    state = { ...state, blobCount: 2, migrationNeeded: true };
    expect(state.blobCount).toBe(2);
    expect(state.migrationNeeded).toBe(true);
  });

  it('should provide correct browser limits', () => {
    expect(BROWSER_LIMITS['Chrome/Edge']).toBeGreaterThan(0);
    expect(BROWSER_LIMITS['Firefox']).toBeGreaterThan(0);
    expect(BROWSER_LIMITS['Safari']).toBeGreaterThan(0);
    
    // Firefox should have higher limit than Chrome
    expect(BROWSER_LIMITS['Firefox']).toBeGreaterThan(BROWSER_LIMITS['Chrome/Edge']);
  });

  it('should provide URL size status logic', () => {
    expect(getUrlSizeStatus(1000)).toBe('success');
    expect(getUrlSizeStatus(26000)).toBe('warning');
    expect(getUrlSizeStatus(35000)).toBe('error');
  });

  it('should provide browser support logic', () => {
    const support = getBrowserSupport(1000);
    expect(support).toHaveLength(6);
    expect(support[0]).toHaveProperty('browser');
    expect(support[0]).toHaveProperty('supported');
    
    // Small size should be supported by all browsers
    expect(support.every(s => s.supported)).toBe(true);
  });
});
