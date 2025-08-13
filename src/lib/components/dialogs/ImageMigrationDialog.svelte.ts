// ImageMigrationDialog.svelte.ts - Extracted logic for ImageMigrationDialog component

import type { Card } from '$lib/types';
import { processImage } from '$lib/utils/image';

// === Type Definitions ===

export interface ImageMigrationState {
  loading: boolean;
  selectedCard: Card | null;
  urlInput: string;
  previewUrl: string | null;
  optimizedBlob: Blob | null;
}

export interface ImageProcessingResult {
  previewUrl: string;
  optimizedBlob: Blob;
}

// === State Management ===

/**
 * Creates the initial state for ImageMigrationDialog component
 */
export function createImageMigrationState(): ImageMigrationState {
  return {
    loading: false,
    selectedCard: null,
    urlInput: '',
    previewUrl: null,
    optimizedBlob: null
  };
}

/**
 * Resets state when card selection changes
 */
export function resetStateForCard(state: ImageMigrationState): ImageMigrationState {
  return {
    ...state,
    urlInput: '',
    previewUrl: null,
    optimizedBlob: null
  };
}

// === Card Filtering ===

/**
 * Filters cards that need migration (have blob:local or no valid URL)
 */
export function getCardsThatNeedMigration(cards: Card[]): Card[] {
  return cards.filter((card: Card) => {
    if (!card.image) return false;
    return card.image === 'blob:local' || (!card.image.includes(':') && !card.image.startsWith('http'));
  });
}

/**
 * Gets the first card that needs migration for auto-selection
 */
export function getFirstCardToMigrate(cards: Card[]): Card | null {
  const needsMigration = getCardsThatNeedMigration(cards);
  return needsMigration.length > 0 ? needsMigration[0] : null;
}

/**
 * Gets remaining cards that still need migration after an update
 */
export function getRemainingCardsToMigrate(cards: Card[], excludeCardId?: string): Card[] {
  const remaining = getCardsThatNeedMigration(cards);
  if (excludeCardId) {
    return remaining.filter(card => card.id !== excludeCardId);
  }
  return remaining;
}

/**
 * Gets the next card to migrate after completing current card
 */
export function getNextCardToMigrate(cards: Card[], currentCardId: string): Card | null {
  const remaining = getRemainingCardsToMigrate(cards, currentCardId);
  return remaining.length > 0 ? remaining[0] : null;
}

// === Image Processing ===

/**
 * Processes image URL and returns preview URL and optimized blob
 */
export async function processImageUrl(url: string): Promise<ImageProcessingResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch image');
  }
  
  const blob = await response.blob();
  const file = new File([blob], 'image', { type: blob.type });
  
  const processed = await processImage(file);
  const previewUrl = URL.createObjectURL(processed.blob);
  
  return {
    previewUrl,
    optimizedBlob: processed.blob
  };
}

// === Update Preparation ===

/**
 * Creates update object for card image migration
 */
export function createImageUpdateObject(urlInput: string, optimizedBlob: Blob | null): Partial<Card> {
  return {
    image: urlInput,
    imageBlob: optimizedBlob || undefined
  };
}

// === Validation ===

/**
 * Validates if migration can be saved
 */
export function canSaveMigration(urlInput: string, loading: boolean, optimizedBlob: Blob | null): boolean {
  return Boolean(urlInput && !loading && optimizedBlob);
}

// === Constants ===

export const IMAGE_PROCESSING_DEBOUNCE_MS = 500;
