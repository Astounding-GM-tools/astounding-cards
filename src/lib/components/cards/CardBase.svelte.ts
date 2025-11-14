// CardBase.svelte.ts - Extracted logic for CardBase component

import type { Deck } from '$lib/types';

// === Type Definitions ===

export type CardSize = 'poker' | 'tarot';

export interface CardBaseState {
	activeTheme: string;
	isPreview: boolean;
	size: CardSize;
}

// === Theme and Size Resolution ===

/**
 * Resolves the active theme from props and deck metadata
 */
export function resolveActiveTheme(propTheme: string | undefined, deck: Deck | null): string {
	return propTheme ?? deck?.meta?.theme ?? 'classic';
}

/**
 * Resolves the card size from props and deck metadata
 */
export function resolveCardSize(propCardSize: string | undefined, deck: Deck | null): CardSize {
	const size = propCardSize ?? deck?.meta?.cardSize ?? 'poker';
	return size as CardSize;
}

/**
 * Creates the complete state for CardBase component
 */
export function createCardBaseState(
	theme: string | undefined,
	preview: boolean | undefined,
	cardSize: string | undefined,
	deck: Deck | null
): CardBaseState {
	return {
		activeTheme: resolveActiveTheme(theme, deck),
		isPreview: preview ?? false,
		size: resolveCardSize(cardSize, deck)
	};
}
