import type { Card } from '../types/card.js';
import type { Deck, Layout } from '../types/deck.js';
import type { LoadingState, NextDeckStore } from './types.js';

import { nextDb, DatabaseError } from './database.js';
import { safeCloneCard } from '$lib/utils/clone-utils.ts';
import { generateKey } from '../utils/idUtils.js';
import { authenticatedFetch } from '$lib/utils/authenticated-fetch.js';
import { get } from 'svelte/store';
import { nextAuth } from './auth.js';

/**
 * Sync deck to cloud (user_decks table) if authenticated
 * This runs in the background after local IndexedDB updates
 */
async function syncDeckToCloud(deck: Deck): Promise<void> {
	try {
		const authState = get(nextAuth);
		if (!authState || !authState.user) {
			return; // Not authenticated, skip sync
		}

		// Background sync - don't block UI
		await authenticatedFetch('/api/user-decks', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: deck.id,
				title: deck.meta.title,
				description: deck.meta.description || '',
				theme: deck.meta.theme,
				image_style: deck.meta.imageStyle,
				layout: deck.meta.layout,
				cards: deck.cards,
				tags: [], // TODO: Add tags support if needed
				is_synced: true,
				published_deck_id: deck.meta.published_deck_id || null
			})
		});
	} catch (err) {
		// Log but don't fail - sync is best-effort
		console.warn('Failed to sync deck to cloud:', err);
	}
}

/**
 * Create the Next deck store
 */
function createNextDeckStore(): NextDeckStore {
	// Core state
	let currentDeck = $state<Deck | null>(null);
	let loadingState = $state<LoadingState>({ isLoading: false, message: '', operation: '' });
	let error = $state<string | null>(null);

	return {
		// Reactive getters
		get deck() {
			return currentDeck;
		},
		get isLoading() {
			return loadingState.isLoading;
		},
		get loadingMessage() {
			return loadingState.message;
		},
		get loadingOperation() {
			return loadingState.operation;
		},
		get error() {
			return error;
		},

		// Derived state
		get hasCards() {
			return (currentDeck?.cards.length ?? 0) > 0;
		},
		get cardCount() {
			return currentDeck?.cards.length ?? 0;
		},

		/**
		 * Load a deck by ID
		 */
		async loadDeck(deckId) {
			this.setLoading(true, 'Loading deck...', 'load-deck');
			this.clearError();

			try {
				const deck = await nextDb.getDeck(deckId);
				if (!deck) {
					this.setError('Deck not found');
					return false;
				}

				currentDeck = deck;
				return true;
			} catch (err) {
				this.handleError(err, 'Failed to load deck');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Select a deck and persist the selection
		 * This updates the deck's lastEdited timestamp to ensure it's remembered
		 */
		async selectDeck(deckId) {
			this.setLoading(true, 'Selecting deck...', 'select-deck');
			this.clearError();

			try {
				// First, load the deck
				const deck = await nextDb.getDeck(deckId);
				if (!deck) {
					this.setError('Deck not found');
					return false;
				}

				// Update the deck's lastEdited timestamp to mark it as recently accessed
				const updatedDeck = await nextDb.updateDeckMeta(deckId, {
					lastEdited: Date.now()
				});

				currentDeck = updatedDeck; // Canon Update: UI reflects persisted state
				return true;
			} catch (err) {
				this.handleError(err, 'Failed to select deck');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Create new deck and load it
		 */
		async createDeck(title) {
			this.setLoading(true, 'Creating deck...', 'create-deck');
			this.clearError();

			try {
				const deck = await nextDb.createDeck(title);
				currentDeck = deck;

				// Auto-sync to cloud (background, non-blocking)
				syncDeckToCloud(deck);

				return true;
			} catch (err) {
				this.handleError(err, 'Failed to create deck');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Create new deck with default title (convenience function)
		 */
		async createNewDeck() {
			this.setLoading(true, 'Creating deck...', 'create-deck');
			this.clearError();

			try {
				const deck = await nextDb.createDeck('New Deck');
				currentDeck = deck;

				// Auto-sync to cloud (background, non-blocking)
				syncDeckToCloud(deck);

				return deck;
			} catch (err) {
				this.handleError(err, 'Failed to create deck');
				return null;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Update deck metadata (Canon Update Pattern)
		 */
		async updateDeckMeta(updates) {
			if (!currentDeck) {
				this.setError('No deck loaded');
				return false;
			}

			this.setLoading(true, 'Updating deck...', 'update-deck-meta');
			this.clearError();

			try {
				const updatedDeck = await nextDb.updateDeckMeta(currentDeck.id, updates);
				currentDeck = updatedDeck; // Canon Update: UI reflects persisted state

				// Auto-sync to cloud (background, non-blocking)
				syncDeckToCloud(updatedDeck);

				return true;
			} catch (err) {
				this.handleError(err, 'Failed to update deck');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Update deck layout (Canon Update Pattern)
		 */
		async updateLayout(layout) {
			return this.updateDeckMeta({ layout });
		},

		/**
		 * Update a card (Canon Update Pattern)
		 */
		async updateCard(cardId, updates, message = 'Updating card...') {
			if (!currentDeck) {
				this.setError('No deck loaded');
				return false;
			}

			this.setLoading(true, message, 'update-card');
			this.clearError();

			try {
				const updatedDeck = await nextDb.updateCard(currentDeck.id, cardId, updates);
				currentDeck = updatedDeck; // Canon Update: UI reflects persisted state

				// Auto-sync to cloud (background, non-blocking)
				syncDeckToCloud(updatedDeck);

				return true;
			} catch (err) {
				this.handleError(err, 'Failed to update card');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Add new card to deck
		 */
		async addCard(cardData) {
			if (!currentDeck) {
				this.setError('No deck loaded');
				return null;
			}

			this.setLoading(true, 'Adding card...', 'add-card');
			this.clearError();

			try {
				const updatedDeck = await nextDb.addCard(currentDeck.id, cardData);
				currentDeck = updatedDeck; // Canon Update: UI reflects persisted state

				// Auto-sync to cloud (background, non-blocking)
				syncDeckToCloud(updatedDeck);

				// Return the newly added card
				return updatedDeck.cards[updatedDeck.cards.length - 1];
			} catch (err) {
				this.handleError(err, 'Failed to add card');
				return null;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Remove card from deck
		 */
		async removeCard(cardId) {
			if (!currentDeck) {
				this.setError('No deck loaded');
				return false;
			}

			this.setLoading(true, 'Removing card...', 'remove-card');
			this.clearError();

			try {
				const updatedDeck = await nextDb.removeCard(currentDeck.id, cardId);
				currentDeck = updatedDeck; // Canon Update: UI reflects persisted state

				// Auto-sync to cloud (background, non-blocking)
				syncDeckToCloud(updatedDeck);

				return true;
			} catch (err) {
				this.handleError(err, 'Failed to remove card');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Get card by ID from current deck
		 */
		getCard(cardId) {
			if (!currentDeck) return null;
			return currentDeck.cards.find((c) => c.id === cardId) || null;
		},

		/**
		 * Duplicate a card
		 */
		async duplicateCard(cardId) {
			const card = this.getCard(cardId);
			if (!card) {
				this.setError('Card not found');
				return null;
			}

			// Create deep copy without ID (will get new ID) and update title
			const clonedCard = safeCloneCard(card);
			const newCard = {
				...clonedCard,
				id: generateKey(), // Ensure new ID
				title: `${clonedCard.title} (Copy)`
			};

			return this.addCard(newCard);
		},

		/**
		 * Duplicate current deck with optional new title
		 */
		async duplicateDeck(newTitle) {
			if (!currentDeck) {
				this.setError('No deck loaded');
				return false;
			}

			this.setLoading(true, 'Duplicating deck...', 'duplicate-deck');
			this.clearError();

			try {
				const duplicatedDeck = await nextDb.duplicateDeck(currentDeck.id, newTitle);
				currentDeck = duplicatedDeck; // Canon Update: UI reflects persisted state
				return true;
			} catch (err) {
				this.handleError(err, 'Failed to duplicate deck');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Duplicate any deck by ID with optional new title
		 */
		async duplicateDeckById(deckId, newTitle) {
			this.setLoading(true, 'Duplicating deck...', 'duplicate-deck-by-id');
			this.clearError();

			try {
				const duplicatedDeck = await nextDb.duplicateDeck(deckId, newTitle);
				// Don't automatically switch to the duplicated deck, just return it
				return duplicatedDeck;
			} catch (err) {
				this.handleError(err, 'Failed to duplicate deck');
				return null;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Import a deck from share URL data and save it to database
		 * This follows the Canon Update Pattern by persisting first, then updating UI
		 */
		async importDeck(deck) {
			this.setLoading(true, `Importing deck "${deck.meta.title}"...`, 'import-deck');
			this.clearError();

			try {
				// Save the imported deck to database first (Canon Update Pattern)
				const savedDeck = await nextDb.upsertDeck(deck);

				// Now set it as current deck
				currentDeck = savedDeck;
				return true;
			} catch (err) {
				this.handleError(err, 'Failed to import deck');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Load the most recent deck from database
		 */
		async loadMostRecent() {
			this.setLoading(true, 'Loading most recent deck...', 'load-recent');
			this.clearError();

			try {
				const decks = await nextDb.getAllDecks();
				if (decks.length === 0) {
					return false; // No decks found
				}

				// Get the most recent deck (getAllDecks returns sorted by lastEdited desc)
				const mostRecentDeck = decks[0];
				currentDeck = mostRecentDeck;
				return true;
			} catch (err) {
				this.handleError(err, 'Failed to load recent deck');
				return false;
			} finally {
				this.setLoading(false);
			}
		},

		/**
		 * Clear current deck (for navigation)
		 */
		clearDeck() {
			currentDeck = null;
			this.clearError();
			this.setLoading(false);
		},

		/**
		 * Helper: Set loading state
		 */
		setLoading(isLoading, message = '', operation = '') {
			loadingState = { isLoading, message, operation };
		},

		/**
		 * Helper: Set error state
		 */
		setError(errorMessage: string): void {
			error = errorMessage;
		},

		/**
		 * Helper: Clear error state
		 */
		clearError(): void {
			error = null;
		},

		/**
		 * Helper: Handle errors consistently
		 */
		handleError(err: unknown, fallbackMessage: string): void {
			console.error('DeckStore error:', err);

			if (err instanceof DatabaseError) {
				this.setError(err.message);
			} else if (err instanceof Error) {
				this.setError(err.message);
			} else {
				this.setError(fallbackMessage);
			}
		},

		/**
		 * Publish deck to gallery (or update existing published version)
		 */
		async publishDeck(options?: {
			description?: string;
			tags?: string[];
			visibility?: 'public' | 'unlisted';
		}): Promise<{ success: boolean; slug?: string; error?: string }> {
			if (!currentDeck) {
				return { success: false, error: 'No deck loaded' };
			}

			const isUpdate = !!currentDeck.meta.published_deck_id;
			const action = isUpdate ? 'Updating published deck...' : 'Publishing deck...';

			this.setLoading(true, action, 'publish-deck');
			this.clearError();

			try {
				// NEW: Just pass the userDeckId, API will handle the rest
				const body = {
					userDeckId: currentDeck.id, // NEW: Just send the ID
					visibility: options?.visibility || 'public'
					// API will read from user_decks table
				};

				const response = await authenticatedFetch('/api/decks/publish', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body)
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.message || 'Failed to publish deck');
				}

				const result = await response.json();

				// Store published deck ID in metadata for future updates
				if (result.deck.id && !isUpdate) {
					// Only update metadata on first publish, not on updates
					await this.updateDeckMeta({
						published_deck_id: result.deck.id,
						published_slug: result.deck.slug
					});
				}

				return { success: true, slug: result.deck.slug };
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to publish deck';
				this.setError(errorMessage);
				return { success: false, error: errorMessage };
			} finally {
				this.setLoading(false);
			}
		}
	};
}

// Export singleton store
export const nextDeckStore = createNextDeckStore();

/**
 * Initialize the database when the store is first imported (browser only)
 */
if (typeof window !== 'undefined') {
	nextDb.init().catch(console.error);
}
