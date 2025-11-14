/**
 * Dev Tools Store for Next System
 *
 * Development utilities for testing and debugging:
 * - Sample data creation
 * - Database operations
 * - E2E testing helpers
 */

import { nextDb } from './database.js';
import { nextDeckStore } from './deckStore.svelte.js';
import type { Deck, Theme, Layout } from '../types/deck.js';
import type { Card } from '../types/card.js';
import { getSampleCards as getSharedSampleCards } from '../data/sampleCards.js';

/**
 * Create dev tools store
 */
function createNextDevStore() {
	let devMode = $state(false);

	return {
		get isDevMode() {
			return devMode;
		},

		/**
		 * Enable dev mode
		 */
		enableDevMode(): void {
			devMode = true;
		},

		/**
		 * Disable dev mode
		 */
		disableDevMode(): void {
			devMode = false;
		},

		/**
		 * Toggle dev mode
		 */
		toggleDevMode(): void {
			devMode = !devMode;
		},

		/**
		 * Clear all database data
		 */
		async clearDatabase(): Promise<void> {
			await nextDb.clearAll();
			nextDeckStore.clearDeck();
		},

		/**
		 * Create sample deck for testing
		 */
		async createSampleDeck(): Promise<Deck | null> {
			try {
				const deck = await nextDb.createDeck('Welcome to Astounding Cards!', 'classic', 'tarot');

				// Add sample cards (skip first one since createDeck already adds the default card)
				const sampleCards = this.getSampleCards();

				// Skip the first card since createDeck() already adds the default card
				// and we want the default card to match the first tutorial card
				for (let i = 1; i < sampleCards.length; i++) {
					await nextDb.addCard(deck.id, sampleCards[i]);
				}

				// Get updated deck with all cards
				const updatedDeck = await nextDb.getDeck(deck.id);
				return updatedDeck;
			} catch (error) {
				console.error('Failed to create sample deck:', error);
				return null;
			}
		},

		/**
		 * Setup test environment with sample data
		 */
		async setupTestEnvironment(): Promise<boolean> {
			try {
				// Clear existing data
				await this.clearDatabase();

				// Create sample deck
				const deck = await this.createSampleDeck();
				if (!deck) return false;

				// Load it in the store
				return await nextDeckStore.loadDeck(deck.id);
			} catch (error) {
				console.error('Failed to setup test environment:', error);
				return false;
			}
		},

		/**
		 * Get sample cards for testing
		 */
		getSampleCards(): Partial<Card>[] {
			return getSharedSampleCards();
		},

		/**
		 * Get database info for debugging
		 */
		async getDatabaseInfo(): Promise<{ deckCount: number; totalCards: number }> {
			try {
				const decks = await nextDb.getAllDecks();
				const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);

				return {
					deckCount: decks.length,
					totalCards
				};
			} catch (error) {
				console.error('Failed to get database info:', error);
				return { deckCount: 0, totalCards: 0 };
			}
		},

		/**
		 * Export current deck as JSON (for debugging)
		 */
		exportCurrentDeck(): string | null {
			const deck = nextDeckStore.deck;
			if (!deck) return null;

			return JSON.stringify(deck, null, 2);
		}
	};
}

export const nextDevStore = createNextDevStore();

// Make available globally for console access (development only)
if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
	(window as any).nextDevTools = {
		enableDevMode: () => nextDevStore.enableDevMode(),
		disableDevMode: () => nextDevStore.disableDevMode(),
		clearDatabase: () => nextDevStore.clearDatabase(),
		setupTestEnvironment: () => nextDevStore.setupTestEnvironment(),
		createSampleDeck: () => nextDevStore.createSampleDeck(),
		getDatabaseInfo: () => nextDevStore.getDatabaseInfo(),
		exportDeck: () => nextDevStore.exportCurrentDeck(),
		store: nextDeckStore
	};
}
