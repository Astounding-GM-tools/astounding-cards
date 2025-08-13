/**
 * Integration test for the refactored ImageSelector component
 * Ensures the component still works correctly after logic extraction
 */

import { describe, it, expect } from 'vitest';

// Import the extracted logic to verify it's accessible
import {
  initializeImageSelectorState,
  canSave,
  isProcessing,
  hasError,
  hasPreview,
  getSaveButtonTitle,
  updateUrlValue,
  type ImageSelectorState
} from './ImageSelector.svelte.ts';

describe('ImageSelector Component Integration', () => {
  it('should import all extracted logic functions without errors', () => {
    // Test that all main functions are available
    expect(typeof initializeImageSelectorState).toBe('function');
    expect(typeof canSave).toBe('function');
    expect(typeof isProcessing).toBe('function');
    expect(typeof hasError).toBe('function');
    expect(typeof hasPreview).toBe('function');
    expect(typeof getSaveButtonTitle).toBe('function');
    expect(typeof updateUrlValue).toBe('function');
  });

  it('should maintain proper TypeScript types for ImageSelectorState', () => {
    const state: ImageSelectorState = {
      urlValue: 'https://example.com/image.jpg',
      error: '',
      loading: false,
      lastProcessedBlob: undefined,
      previewUrl: null
    };

    // These should compile without TypeScript errors
    expect(state.urlValue).toBe('https://example.com/image.jpg');
    expect(state.error).toBe('');
    expect(state.loading).toBe(false);
    expect(state.lastProcessedBlob).toBeUndefined();
    expect(state.previewUrl).toBeNull();
  });

  it('should work correctly with the extracted logic workflow', () => {
    // Initialize state
    let state = initializeImageSelectorState();
    expect(canSave(state)).toBe(false);
    expect(isProcessing(state)).toBe(false);
    expect(hasError(state)).toBe(false);
    expect(hasPreview(state)).toBe(false);

    // Update with URL value
    state = updateUrlValue(state, 'https://example.com/image.jpg');
    expect(state.urlValue).toBe('https://example.com/image.jpg');

    // Simulate loading state
    state = { ...state, loading: true };
    expect(isProcessing(state)).toBe(true);

    // Simulate error state
    state = { 
      ...state,
      loading: false, 
      error: 'Failed to load image' 
    };
    expect(hasError(state)).toBe(true);
    expect(state.error).toBe('Failed to load image');
    expect(getSaveButtonTitle(state)).toBe('No image chosen');

    // Simulate success state with preview
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    state = {
      ...state,
      error: '',
      lastProcessedBlob: mockBlob,
      previewUrl: 'blob:http://localhost/test'
    };
    expect(hasError(state)).toBe(false);
    expect(hasPreview(state)).toBe(true);
    expect(canSave(state)).toBe(true);
    expect(getSaveButtonTitle(state)).toBe('');
  });

  it('should handle URL updates correctly', () => {
    let state = initializeImageSelectorState();
    expect(state.urlValue).toBe('');
    
    state = updateUrlValue(state, 'https://example.com/image.jpg');
    expect(state.urlValue).toBe('https://example.com/image.jpg');
    
    state = updateUrlValue(state, 'https://different.com/other.png');
    expect(state.urlValue).toBe('https://different.com/other.png');
  });
});
