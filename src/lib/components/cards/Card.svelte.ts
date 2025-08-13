// Card.svelte.ts - Extracted logic for Card component

import type { Deck } from '$lib/types';

// === Theme Resolution ===

/**
 * Resolves the active theme from props and deck metadata
 */
export function resolveActiveTheme(
  propTheme: string | undefined,
  deck: Deck | null
): string {
  return propTheme ?? deck?.meta?.theme ?? 'classic';
}
