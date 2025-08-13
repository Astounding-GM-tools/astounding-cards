/**
 * Test suite for ImageSelector.svelte.ts
 * 
 * Comprehensive tests for all extracted pure logic functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeImageSelectorState,
  cleanupPreviewUrl,
  handleFileChange,
  handleUrlLoad,
  handleSaveAction,
  handleUnsetAction,
  canSave,
  isProcessing,
  hasError,
  hasPreview,
  getSaveButtonTitle,
  updateUrlValue,
  type ImageSelectorState
} from './ImageSelector.svelte.ts';

// Mock the dependencies
vi.mock('$lib/utils/image', () => ({
  processImage: vi.fn()
}));

vi.mock('$lib/utils/image-handler', () => ({
  createBlobUrl: vi.fn(),
  revokeBlobUrl: vi.fn()
}));

import { processImage } from '$lib/utils/image';
import { createBlobUrl, revokeBlobUrl } from '$lib/utils/image-handler';

// Create mock blob for testing
const createMockBlob = (type = 'image/jpeg'): Blob => {
  return new Blob(['mock image data'], { type });
};

describe('ImageSelector Pure Logic Functions', () => {

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('initializeImageSelectorState', () => {
    it('should initialize state with default values', () => {
      const state = initializeImageSelectorState();
      expect(state).toEqual({
        urlValue: '',
        error: '',
        loading: false,
        lastProcessedBlob: undefined,
        previewUrl: null
      });
    });

    it('should return a new object each time', () => {
      const state1 = initializeImageSelectorState();
      const state2 = initializeImageSelectorState();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });


  describe('cleanupPreviewUrl', () => {
    it('should call revokeBlobUrl when url is provided', () => {
      const mockUrl = 'blob:http://localhost/test';
      cleanupPreviewUrl(mockUrl);
      
      expect(revokeBlobUrl).toHaveBeenCalledWith(mockUrl);
      expect(revokeBlobUrl).toHaveBeenCalledTimes(1);
    });

    it('should not call revokeBlobUrl when url is null', () => {
      cleanupPreviewUrl(null);
      
      expect(revokeBlobUrl).not.toHaveBeenCalled();
    });

    it('should not call revokeBlobUrl when url is empty string', () => {
      cleanupPreviewUrl('');
      
      expect(revokeBlobUrl).not.toHaveBeenCalled();
    });
  });


  describe('handleFileChange', () => {
    it('should return unchanged state when no file provided', async () => {
      const initialState = initializeImageSelectorState();
      const result = await handleFileChange(initialState, undefined, 'tarot');
      
      expect(result).toEqual(initialState);
    });

    it('should process file and return success state', async () => {
      const initialState = initializeImageSelectorState();
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockBlob = createMockBlob();
      const mockPreviewUrl = 'blob:http://localhost/preview';

      vi.mocked(processImage).mockResolvedValue({ blob: mockBlob });
      vi.mocked(createBlobUrl).mockReturnValue(mockPreviewUrl);

      const result = await handleFileChange(initialState, mockFile, 'tarot');

      expect(result.loading).toBe(false);
      expect(result.error).toBe('');
      expect(result.lastProcessedBlob).toBe(mockBlob);
      expect(result.previewUrl).toBe(mockPreviewUrl);
    });

    it('should handle processing errors', async () => {
      const initialState = initializeImageSelectorState();
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      vi.mocked(processImage).mockRejectedValue(new Error('Processing failed'));

      const result = await handleFileChange(initialState, mockFile, 'tarot');

      expect(result.loading).toBe(false);
      expect(result.error).toBe('Processing failed');
      expect(result.lastProcessedBlob).toBeUndefined();
      expect(result.previewUrl).toBeNull();
    });
  });

  describe('handleUrlLoad', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should return unchanged state when no URL provided', async () => {
      const initialState = initializeImageSelectorState();
      const result = await handleUrlLoad(initialState, 'tarot');
      
      expect(result).toEqual(initialState);
    });

    it('should process URL and return success state', async () => {
      const initialState = {
        ...initializeImageSelectorState(),
        urlValue: 'https://example.com/image.jpg'
      };

      const mockBlob = createMockBlob();
      const mockPreviewUrl = 'blob:http://localhost/preview';
      const mockResponse = {
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
      vi.mocked(processImage).mockResolvedValue({ blob: mockBlob });
      vi.mocked(createBlobUrl).mockReturnValue(mockPreviewUrl);

      const result = await handleUrlLoad(initialState, 'tarot');

      expect(result.loading).toBe(false);
      expect(result.error).toBe('');
      expect(result.lastProcessedBlob).toBe(mockBlob);
      expect(result.previewUrl).toBe(mockPreviewUrl);
    });
  });

  describe('handleSaveAction', () => {
    it('should call onSave callback and update loading state', async () => {
      const mockOnSave = vi.fn().mockResolvedValue(undefined);
      const state: ImageSelectorState = {
        ...initializeImageSelectorState(),
        lastProcessedBlob: createMockBlob(),
        urlValue: 'https://example.com/image.jpg'
      };

      const result = await handleSaveAction(state, { onSave: mockOnSave });

      expect(mockOnSave).toHaveBeenCalledWith(
        state.lastProcessedBlob,
        'https://example.com/image.jpg'
      );
      expect(result.loading).toBe(false);
    });

    it('should handle save errors', async () => {
      const mockOnSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const state = initializeImageSelectorState();

      const result = await handleSaveAction(state, { onSave: mockOnSave });

      expect(result.error).toBe('Save failed');
      expect(result.loading).toBe(false);
    });

    it('should return unchanged state when no callback provided', async () => {
      const state = initializeImageSelectorState();
      const result = await handleSaveAction(state, {});
      
      expect(result).toEqual(state);
    });
  });

  describe('handleUnsetAction', () => {
    it('should call onSave with null values', async () => {
      const mockOnSave = vi.fn().mockResolvedValue(undefined);
      const state = initializeImageSelectorState();

      const result = await handleUnsetAction(state, { onSave: mockOnSave });

      expect(mockOnSave).toHaveBeenCalledWith(null, undefined);
      expect(result.loading).toBe(false);
    });

    it('should handle unset errors', async () => {
      const mockOnSave = vi.fn().mockRejectedValue(new Error('Unset failed'));
      const state = initializeImageSelectorState();

      const result = await handleUnsetAction(state, { onSave: mockOnSave });

      expect(result.error).toBe('Unset failed');
    });
  });

  describe('Utility Functions', () => {
    describe('canSave', () => {
      it('should return true when both preview URL and blob exist', () => {
        const state: ImageSelectorState = {
          ...initializeImageSelectorState(),
          previewUrl: 'blob:http://localhost/test',
          lastProcessedBlob: createMockBlob()
        };

        expect(canSave(state)).toBe(true);
      });

      it('should return false when preview URL is missing', () => {
        const state: ImageSelectorState = {
          ...initializeImageSelectorState(),
          previewUrl: null,
          lastProcessedBlob: createMockBlob()
        };

        expect(canSave(state)).toBe(false);
      });

      it('should return false when blob is missing', () => {
        const state: ImageSelectorState = {
          ...initializeImageSelectorState(),
          previewUrl: 'blob:http://localhost/test',
          lastProcessedBlob: undefined
        };

        expect(canSave(state)).toBe(false);
      });
    });

    describe('isProcessing', () => {
      it('should return true when loading', () => {
        const state = {
          ...initializeImageSelectorState(),
          loading: true
        };

        expect(isProcessing(state)).toBe(true);
      });

      it('should return false when not loading', () => {
        const state = initializeImageSelectorState();
        expect(isProcessing(state)).toBe(false);
      });
    });

    describe('hasError', () => {
      it('should return true when error exists', () => {
        const state = {
          ...initializeImageSelectorState(),
          error: 'Test error'
        };

        expect(hasError(state)).toBe(true);
      });

      it('should return false when no error', () => {
        const state = initializeImageSelectorState();
        expect(hasError(state)).toBe(false);
      });
    });

    describe('hasPreview', () => {
      it('should return true when preview URL exists', () => {
        const state = {
          ...initializeImageSelectorState(),
          previewUrl: 'blob:http://localhost/test'
        };

        expect(hasPreview(state)).toBe(true);
      });

      it('should return false when no preview URL', () => {
        const state = initializeImageSelectorState();
        expect(hasPreview(state)).toBe(false);
      });
    });

    describe('getSaveButtonTitle', () => {
      it('should return empty string when preview exists', () => {
        const state = {
          ...initializeImageSelectorState(),
          previewUrl: 'blob:http://localhost/test'
        };

        expect(getSaveButtonTitle(state)).toBe('');
      });

      it('should return helpful message when no preview', () => {
        const state = initializeImageSelectorState();
        expect(getSaveButtonTitle(state)).toBe('No image chosen');
      });
    });

    describe('updateUrlValue', () => {
      it('should update URL value in state', () => {
        const state = initializeImageSelectorState();
        const newUrl = 'https://example.com/image.jpg';
        
        const updatedState = updateUrlValue(state, newUrl);
        
        expect(updatedState.urlValue).toBe(newUrl);
        expect(updatedState).not.toBe(state);
      });
    });
  });
});
