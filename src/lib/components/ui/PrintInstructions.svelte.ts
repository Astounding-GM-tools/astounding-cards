// PrintInstructions.svelte.ts - Extracted logic for PrintInstructions component

import type { Deck } from '$lib/types';

// === Type Definitions ===

export type CardSize = 'poker' | 'tarot';

export interface PrintInstructionsState {
	dialog: HTMLDialogElement | null;
}

// === State Management ===

/**
 * Creates the initial state for PrintInstructions component
 */
export function createPrintInstructionsState(): PrintInstructionsState {
	return {
		dialog: null
	};
}

// === Dialog Management ===

/**
 * Closes the print instructions dialog
 */
export function closeDialog(dialog: HTMLDialogElement | null): void {
	dialog?.close();
}

// === Content Functions ===

/**
 * Gets the display name for card size
 */
export function getCardSizeDisplayName(cardSize: CardSize | undefined): string {
	return cardSize === 'poker' ? 'Poker' : 'Tarot';
}

/**
 * Gets the cards per page text for the given card size
 */
export function getCardsPerPageText(cardSize: CardSize | undefined): string {
	if (cardSize === 'poker') {
		return '(9 cards per page, standard playing card size)';
	} else {
		return '(4 cards per page, larger size for better readability)';
	}
}

/**
 * Gets the physical card dimensions text for the given card size
 */
export function getCardDimensionsText(cardSize: CardSize | undefined): string {
	if (cardSize === 'poker') {
		return 'Cards will be standard poker size (2.5" × 3.5" / 63mm × 88mm)';
	} else {
		return 'Cards will be larger tarot size (approximately 3.75" × 5.25" / 95mm × 133mm)';
	}
}

/**
 * Gets the current card size from deck
 */
export function getCurrentCardSize(deck: Deck | null): CardSize | undefined {
	return deck?.meta.cardSize as CardSize | undefined;
}
