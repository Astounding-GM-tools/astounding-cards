// Logic for DeckManager component
import type { Card, Deck, StatblockVocabulary } from '$lib/types';

export interface DeckManagerState {
	selectedCardIds: string[];
	targetDeckId: string | 'new';
	newDeckName: string;
	editedDeckName: string;
	selectedThemeForCards: string;
}

export interface CardSelectionState {
	selectedCardIds: string[];
}

export interface DeckOperationResult {
	success: boolean;
	error?: string;
}

export interface CardUpdateParams {
	cardId: string;
	updates: Partial<Card>;
}

export interface CopyCardsParams {
	cardIds: string[];
	targetDeckId: string | 'new';
	newDeckName?: string;
}

export interface ThemeChangeParams {
	cardIds: string[];
	themeId: string;
}

/**
 * Initialize the deck manager state with default values
 */
export function initializeDeckManagerState(): DeckManagerState {
	return {
		selectedCardIds: [],
		targetDeckId: 'new',
		newDeckName: '',
		editedDeckName: '',
		selectedThemeForCards: ''
	};
}

/**
 * Toggle card selection in the card list
 */
export function toggleCardSelection(currentSelection: string[], cardId: string): string[] {
	if (currentSelection.includes(cardId)) {
		return currentSelection.filter((id) => id !== cardId);
	} else {
		return [...currentSelection, cardId];
	}
}

/**
 * Select all cards in a deck
 */
export function selectAllCards(cards: Card[]): string[] {
	return cards.map((card) => card.id);
}

/**
 * Clear all card selections
 */
export function selectNoCards(): string[] {
	return [];
}

/**
 * Validate deck name for operations
 */
export function validateDeckName(name: string): {
	isValid: boolean;
	error?: string;
} {
	const trimmed = name.trim();

	if (!trimmed) {
		return { isValid: false, error: 'Deck name cannot be empty' };
	}

	if (trimmed.length < 2) {
		return { isValid: false, error: 'Deck name must be at least 2 characters' };
	}

	if (trimmed.length > 100) {
		return { isValid: false, error: 'Deck name cannot exceed 100 characters' };
	}

	return { isValid: true };
}

/**
 * Generate a default duplicate name for a deck
 */
export function generateDuplicateName(originalName: string): string {
	return `${originalName} (Copy)`;
}

/**
 * Create card update parameters for theme changes
 */
export function createThemeUpdateParams(cardIds: string[], themeId: string): CardUpdateParams[] {
	return cardIds.map((cardId) => ({
		cardId,
		updates: { theme: themeId }
	}));
}

/**
 * Validate copy cards operation parameters
 */
export function validateCopyCardsParams(params: CopyCardsParams): {
	isValid: boolean;
	error?: string;
} {
	if (params.cardIds.length === 0) {
		return { isValid: false, error: 'No cards selected for copying' };
	}

	if (params.targetDeckId === 'new') {
		if (!params.newDeckName?.trim()) {
			return { isValid: false, error: 'Please enter a name for the new deck' };
		}

		const nameValidation = validateDeckName(params.newDeckName);
		if (!nameValidation.isValid) {
			return nameValidation;
		}
	}

	return { isValid: true };
}

/**
 * Validate theme change operation parameters
 */
export function validateThemeChangeParams(params: ThemeChangeParams): {
	isValid: boolean;
	error?: string;
} {
	if (params.cardIds.length === 0) {
		return { isValid: false, error: 'No cards selected for theme change' };
	}

	if (!params.themeId.trim()) {
		return { isValid: false, error: 'Please select a theme' };
	}

	return { isValid: true };
}

/**
 * Create success message for card operations
 */
export function createCardOperationMessage(
	operation: 'copied' | 'deleted' | 'updated',
	count: number
): string {
	const cardText = count === 1 ? 'card' : 'cards';
	const operationText =
		operation === 'copied' ? 'Copied' : operation === 'deleted' ? 'Deleted' : 'Updated';

	return `${operationText} ${count} ${cardText} successfully`;
}

/**
 * Format timestamp to locale date string
 */
export function formatDate(timestamp: number, locale?: string): string {
	const localeToUse = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
	return new Date(timestamp).toLocaleString(localeToUse, {
		dateStyle: 'short'
	});
}

/**
 * Format timestamp to locale date and time string
 */
export function formatDateTime(timestamp: number, locale?: string): string {
	const localeToUse = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
	return new Date(timestamp).toLocaleString(localeToUse, {
		dateStyle: 'short',
		timeStyle: 'short'
	});
}

/**
 * Reset deck manager state to defaults
 */
export function resetDeckManagerState(state: DeckManagerState): DeckManagerState {
	return {
		...state,
		selectedCardIds: [],
		targetDeckId: 'new',
		newDeckName: '',
		selectedThemeForCards: ''
	};
}

/**
 * Update deck manager state with new values
 */
export function updateDeckManagerState(
	state: DeckManagerState,
	updates: Partial<DeckManagerState>
): DeckManagerState {
	return { ...state, ...updates };
}

/**
 * Check if any cards are selected for bulk operations
 */
export function hasSelectedCards(selectedCardIds: string[]): boolean {
	return selectedCardIds.length > 0;
}

/**
 * Get cards that are selected from a deck
 */
export function getSelectedCards(deck: Deck, selectedCardIds: string[]): Card[] {
	return deck.cards.filter((card) => selectedCardIds.includes(card.id));
}

/**
 * Find the most recently edited deck from a list
 */
export function findMostRecentDeck(decks: Deck[]): Deck | null {
	if (decks.length === 0) return null;

	return decks.reduce((mostRecent, current) => {
		return current.meta.lastEdited > mostRecent.meta.lastEdited ? current : mostRecent;
	});
}

/**
 * Generate vocabulary configuration name for a deck
 */
export function generateVocabularyConfigName(deckName: string): string {
	return `${deckName} Custom Vocabulary`;
}

/**
 * Generate vocabulary configuration description for a deck
 */
export function generateVocabularyConfigDescription(deckName: string): string {
	return `Custom vocabulary for ${deckName}`;
}

/**
 * Validate vocabulary save operation
 */
export function validateVocabularySave(vocabulary: StatblockVocabulary): {
	isValid: boolean;
	error?: string;
} {
	if (!vocabulary || typeof vocabulary !== 'object') {
		return { isValid: false, error: 'Invalid vocabulary data' };
	}

	const entries = Object.entries(vocabulary);
	if (entries.length === 0) {
		return { isValid: false, error: 'Vocabulary cannot be empty' };
	}

	// Check for duplicate values (case-insensitive)
	const values = entries
		.map(([, value]) => value)
		.filter((value) => value && typeof value === 'string' && value.trim())
		.map((value) => value.trim().toLowerCase());

	const uniqueValues = new Set(values);
	if (values.length !== uniqueValues.size) {
		return { isValid: false, error: 'Vocabulary contains duplicate stat names' };
	}

	return { isValid: true };
}

/**
 * Create default state for card selection operations
 */
export function createCardSelectionState(): CardSelectionState {
	return {
		selectedCardIds: []
	};
}

/**
 * Check if a deck has any cards
 */
export function deckHasCards(deck: Deck): boolean {
	return deck.cards.length > 0;
}

/**
 * Get the count of selected cards
 */
export function getSelectedCardCount(selectedCardIds: string[]): number {
	return selectedCardIds.length;
}

/**
 * Check if all cards in a deck are selected
 */
export function areAllCardsSelected(deck: Deck, selectedCardIds: string[]): boolean {
	return deck.cards.length > 0 && deck.cards.every((card) => selectedCardIds.includes(card.id));
}

/**
 * Check if some (but not all) cards are selected
 */
export function areSomeCardsSelected(deck: Deck, selectedCardIds: string[]): boolean {
	return selectedCardIds.length > 0 && selectedCardIds.length < deck.cards.length;
}
