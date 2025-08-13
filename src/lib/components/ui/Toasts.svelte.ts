// Toasts.svelte.ts - Extracted logic for Toasts component

// === Event Handler Functions ===

/**
 * Handles keydown events for toast accessibility
 */
export function handleToastKeydown(event: KeyboardEvent, onRemove: () => void): void {
  if (event.key === 'Enter' || event.key === 'Space') {
    event.preventDefault();
    onRemove();
  }
}

/**
 * Creates a toast removal handler
 */
export function createRemoveHandler(removeFunction: (id: string) => void, toastId: string): () => void {
  return () => removeFunction(toastId);
}

// === Constants ===

export const TOAST_ANIMATION = {
  x: 100,
  duration: 300
} as const;
