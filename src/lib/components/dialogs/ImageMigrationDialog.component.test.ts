// ImageMigrationDialog.component.test.ts - Integration test for ImageMigrationDialog component

import { describe, it, expect, vi } from 'vitest';
import type { Card } from '$lib/types';
import {
  createImageMigrationState,
  resetStateForCard,
  getCardsThatNeedMigration,
  getFirstCardToMigrate,
  getNextCardToMigrate,
  getRemainingCardsToMigrate,
  processImageUrl,
  createImageUpdateObject,
  canSaveMigration,
  IMAGE_PROCESSING_DEBOUNCE_MS,
  type ImageMigrationState
} from './ImageMigrationDialog.svelte.ts';

// Mock the image processing utility
vi.mock('$lib/utils/image', () => ({
  processImage: vi.fn().mockResolvedValue({
    blob: new Blob(['fake-image'], { type: 'image/jpeg' })
  })
}));

describe('ImageMigrationDialog Component Integration', () => {
  const mockCards: Card[] = [
    {
      id: '1',
      name: 'Card 1',
      image: 'blob:local',
      imageBlob: new Blob(['old-image'], { type: 'image/png' })
    } as Card,
    {
      id: '2',
      name: 'Card 2',
      image: 'some-invalid-url',
      imageBlob: null
    } as Card,
    {
      id: '3',
      name: 'Card 3',
      image: 'https://example.com/valid-image.jpg',
      imageBlob: null
    } as Card,
    {
      id: '4',
      name: 'Card 4',
      image: null
    } as Card
  ];

  it('should import all required extracted functions without errors', () => {
    // Verify all functions are available
    expect(createImageMigrationState).toBeDefined();
    expect(resetStateForCard).toBeDefined();
    expect(getCardsThatNeedMigration).toBeDefined();
    expect(getFirstCardToMigrate).toBeDefined();
    expect(getNextCardToMigrate).toBeDefined();
    expect(getRemainingCardsToMigrate).toBeDefined();
    expect(processImageUrl).toBeDefined();
    expect(createImageUpdateObject).toBeDefined();
    expect(canSaveMigration).toBeDefined();
    expect(IMAGE_PROCESSING_DEBOUNCE_MS).toBeDefined();
  });

  it('should create initial state correctly', () => {
    const state = createImageMigrationState();
    
    expect(state.loading).toBe(false);
    expect(state.selectedCard).toBe(null);
    expect(state.urlInput).toBe('');
    expect(state.previewUrl).toBe(null);
    expect(state.optimizedBlob).toBe(null);
  });

  it('should reset state for card correctly', () => {
    const initialState: ImageMigrationState = {
      loading: true,
      selectedCard: mockCards[0],
      urlInput: 'https://example.com/image.jpg',
      previewUrl: 'blob:preview-url',
      optimizedBlob: new Blob(['test'], { type: 'image/jpeg' })
    };

    const resetState = resetStateForCard(initialState);
    
    expect(resetState.loading).toBe(true); // preserved
    expect(resetState.selectedCard).toBe(mockCards[0]); // preserved
    expect(resetState.urlInput).toBe(''); // reset
    expect(resetState.previewUrl).toBe(null); // reset
    expect(resetState.optimizedBlob).toBe(null); // reset
  });

  it('should identify cards that need migration', () => {
    const needsMigration = getCardsThatNeedMigration(mockCards);
    
    expect(needsMigration).toHaveLength(2);
    expect(needsMigration[0].id).toBe('1'); // blob:local
    expect(needsMigration[1].id).toBe('2'); // invalid URL
  });

  it('should get first card to migrate', () => {
    const firstCard = getFirstCardToMigrate(mockCards);
    expect(firstCard?.id).toBe('1');

    // Test with no cards needing migration
    const validCards = mockCards.slice(2, 3); // only valid card
    const noCard = getFirstCardToMigrate(validCards);
    expect(noCard).toBe(null);
  });

  it('should get remaining cards to migrate', () => {
    const remaining = getRemainingCardsToMigrate(mockCards, '1');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('2');

    // Test without exclusion
    const all = getRemainingCardsToMigrate(mockCards);
    expect(all).toHaveLength(2);
  });

  it('should get next card to migrate', () => {
    const nextCard = getNextCardToMigrate(mockCards, '1');
    expect(nextCard?.id).toBe('2');

    // Test when no more cards need migration (excluding the last card that needs migration)
    const noNextCard = getNextCardToMigrate(mockCards.filter(c => c.id !== '1'), '2');
    expect(noNextCard).toBe(null);
  });

  it('should process image URL correctly', async () => {
    // Mock fetch
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob)
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:preview-url');

    const result = await processImageUrl('https://example.com/image.jpg');
    
    expect(result.previewUrl).toBe('blob:preview-url');
    expect(result.optimizedBlob).toBeInstanceOf(Blob);
  });

  it('should handle image processing errors', async () => {
    // Mock failed fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    });

    await expect(processImageUrl('https://example.com/missing.jpg'))
      .rejects.toThrow('Failed to fetch image');
  });

  it('should create image update object correctly', () => {
    const blob = new Blob(['test'], { type: 'image/jpeg' });
    const updates = createImageUpdateObject('https://example.com/image.jpg', blob);
    
    expect(updates.image).toBe('https://example.com/image.jpg');
    expect(updates.imageBlob).toBe(blob);

    // Test with null blob
    const updatesNull = createImageUpdateObject('https://example.com/image.jpg', null);
    expect(updatesNull.imageBlob).toBeUndefined();
  });

  it('should validate migration save conditions correctly', () => {
    const blob = new Blob(['test'], { type: 'image/jpeg' });
    
    // Valid conditions
    expect(canSaveMigration('https://example.com/image.jpg', false, blob)).toBe(true);
    
    // Invalid conditions
    expect(canSaveMigration('', false, blob)).toBe(false); // no URL
    expect(canSaveMigration('https://example.com/image.jpg', true, blob)).toBe(false); // loading
    expect(canSaveMigration('https://example.com/image.jpg', false, null)).toBe(false); // no blob
  });

  it('should have correct debounce constant', () => {
    expect(IMAGE_PROCESSING_DEBOUNCE_MS).toBe(500);
  });
});
