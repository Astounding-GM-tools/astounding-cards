// Logic for CardFront component
import type { Card } from '$lib/types';

export interface ImageState {
  currentUrl: string | null;
  lastBlob: Blob | null;
  lastUrl: string | null;
}

export interface ImageUpdateParams {
  imageBlob?: Blob | undefined;
  image?: string | null;
}

/**
 * Determine the active theme for the card
 */
export function resolveCardTheme(
  cardTheme: string | undefined,
  propTheme: string | undefined,
  deckTheme: string | undefined,
  fallbackTheme = 'classic'
): string {
  return cardTheme ?? propTheme ?? deckTheme ?? fallbackTheme;
}


/**
 * Check if image data has changed
 */
export function hasImageDataChanged(
  card: Card,
  lastImageBlob: Blob | null,
  lastImageUrl: string | null
): boolean {
  // Normalize undefined to null for comparison - treat them as equivalent "no value" states
  const currentBlob = card.imageBlob || null;
  const currentImage = card.image || null;
  const lastBlob = lastImageBlob || null;
  const lastImage = lastImageUrl || null;
  
  return currentBlob !== lastBlob || currentImage !== lastImage;
}

/**
 * Create CSS background-image value
 */
export function createBackgroundImageValue(imageUrl: string | null): string {
  return imageUrl ? `url('${imageUrl}')` : 'none';
}

/**
 * Create image update parameters based on input
 */
export function createImageUpdateParams(
  blob: Blob | null,
  sourceUrl: string | undefined
): ImageUpdateParams {
  if (blob) {
    // For blob images, store the blob and clear any external URL
    return { imageBlob: blob, image: null };
  }
  
  if (sourceUrl) {
    // For external URLs, store the URL and clear any blob
    return { image: sourceUrl, imageBlob: undefined };
  }
  
  // Clear both
  return { image: null, imageBlob: undefined };
}

/**
 * Validate card name
 */
export function validateCardName(name: string): {
  isValid: boolean;
  trimmedName: string;
  error?: string;
} {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return {
      isValid: false,
      trimmedName,
      error: 'Card name cannot be empty'
    };
  }
  
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      trimmedName,
      error: 'Card name cannot exceed 100 characters'
    };
  }
  
  return {
    isValid: true,
    trimmedName
  };
}

/**
 * Validate card role
 */
export function validateCardRole(role: string): {
  isValid: boolean;
  trimmedRole: string;
  error?: string;
} {
  const trimmedRole = role.trim();
  
  if (trimmedRole.length > 50) {
    return {
      isValid: false,
      trimmedRole,
      error: 'Card role cannot exceed 50 characters'
    };
  }
  
  return {
    isValid: true,
    trimmedRole
  };
}

/**
 * Check if content has changed
 */
export function hasContentChanged(originalContent: string, newContent: string): boolean {
  return originalContent !== newContent;
}

/**
 * Determine if image button should show "Change" or "Add"
 */
export function getImageButtonText(
  hasImage: boolean,
  isUpdating: boolean
): string {
  if (isUpdating) {
    return 'Updating...';
  }
  
  return hasImage ? 'Change image' : 'Add image';
}

/**
 * Get image button title text
 */
export function getImageButtonTitle(hasImage: boolean): string {
  return hasImage ? 'Change image' : 'Add image';
}

/**
 * Check if card should show top right flourish (depends on stats)
 */
export function shouldShowTopRightFlourish(card: Card): boolean {
  return !card.stat;
}

/**
 * Initialize image state
 */
export function initializeImageState(): ImageState {
  return {
    currentUrl: null,
    lastBlob: null,
    lastUrl: null
  };
}

/**
 * Update image state with new values
 */
export function updateImageState(
  state: ImageState,
  updates: Partial<ImageState>
): ImageState {
  return { ...state, ...updates };
}
