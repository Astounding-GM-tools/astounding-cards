/**
 * Next System Deck Store
 * 
 * Implements Canon Update Pattern for the new simplified architecture:
 * - Single current deck focus
 * - Atomic database-first updates
 * - Clean reactive state management
 * - Loading states for better UX
 */

import type { Deck, Layout } from '../types/deck.js';
import type { Card } from '../types/card.js';
import { nextDb, DatabaseError } from './database.js';
import { safeCloneCard } from '$lib/utils/clone-utils.ts';

export interface LoadingState {
    isLoading: boolean;
    message: string;
    operation: string;
}

/**
 * Create the Next deck store
 */
function createNextDeckStore() {
    // Core state
    let currentDeck = $state<Deck | null>(null);
    let loadingState = $state<LoadingState>({ isLoading: false, message: '', operation: '' });
    let error = $state<string | null>(null);

    return {
        // Reactive getters
        get deck() { return currentDeck; },
        get isLoading() { return loadingState.isLoading; },
        get loadingMessage() { return loadingState.message; },
        get loadingOperation() { return loadingState.operation; },
        get error() { return error; },

        // Derived state
        get hasCards() { return (currentDeck?.cards.length ?? 0) > 0; },
        get cardCount() { return currentDeck?.cards.length ?? 0; },

        /**
         * Load a deck by ID
         */
        async loadDeck(deckId: string): Promise<boolean> {
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
        async selectDeck(deckId: string): Promise<boolean> {
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
        async createDeck(title: string): Promise<boolean> {
            this.setLoading(true, 'Creating deck...', 'create-deck');
            this.clearError();

            try {
                const deck = await nextDb.createDeck(title);
                currentDeck = deck;
                return true;
            } catch (err) {
                this.handleError(err, 'Failed to create deck');
                return false;
            } finally {
                this.setLoading(false);
            }
        },

        /**
         * Update deck metadata (Canon Update Pattern)
         */
        async updateDeckMeta(updates: Partial<Deck['meta']>): Promise<boolean> {
            if (!currentDeck) {
                this.setError('No deck loaded');
                return false;
            }

            this.setLoading(true, 'Updating deck...', 'update-deck-meta');
            this.clearError();

            try {
                const updatedDeck = await nextDb.updateDeckMeta(currentDeck.id, updates);
                currentDeck = updatedDeck; // Canon Update: UI reflects persisted state
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
        async updateLayout(layout: Layout): Promise<boolean> {
            return this.updateDeckMeta({ layout });
        },

        /**
         * Update a card (Canon Update Pattern)
         */
        async updateCard(cardId: string, updates: Partial<Card>, message: string = 'Updating card...'): Promise<boolean> {
            if (!currentDeck) {
                this.setError('No deck loaded');
                return false;
            }

            this.setLoading(true, message, 'update-card');
            this.clearError();

            try {
                const updatedDeck = await nextDb.updateCard(currentDeck.id, cardId, updates);
                currentDeck = updatedDeck; // Canon Update: UI reflects persisted state
                
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
        async addCard(cardData?: Partial<Card>): Promise<Card | null> {
            if (!currentDeck) {
                this.setError('No deck loaded');
                return null;
            }

            this.setLoading(true, 'Adding card...', 'add-card');
            this.clearError();

            try {
                const updatedDeck = await nextDb.addCard(currentDeck.id, cardData);
                currentDeck = updatedDeck; // Canon Update: UI reflects persisted state
                
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
        async removeCard(cardId: string): Promise<boolean> {
            if (!currentDeck) {
                this.setError('No deck loaded');
                return false;
            }

            this.setLoading(true, 'Removing card...', 'remove-card');
            this.clearError();

            try {
                const updatedDeck = await nextDb.removeCard(currentDeck.id, cardId);
                currentDeck = updatedDeck; // Canon Update: UI reflects persisted state
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
        getCard(cardId: string): Card | null {
            if (!currentDeck) return null;
            return currentDeck.cards.find(c => c.id === cardId) || null;
        },

        /**
         * Duplicate a card
         */
        async duplicateCard(cardId: string): Promise<Card | null> {
            const card = this.getCard(cardId);
            if (!card) {
                this.setError('Card not found');
                return null;
            }

            // Create deep copy without ID (will get new ID) and update title
            const clonedCard = safeCloneCard(card);
            const newCard = {
                ...clonedCard,
                id: crypto.randomUUID(), // Ensure new ID
                title: `${clonedCard.title} (Copy)`
            };

            return this.addCard(newCard);
        },

        /**
         * Load the most recent deck from database
         */
        async loadMostRecent(): Promise<boolean> {
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
        clearDeck(): void {
            currentDeck = null;
            this.clearError();
            this.setLoading(false);
        },

        /**
         * Helper: Set loading state
         */
        setLoading(isLoading: boolean, message: string = '', operation: string = ''): void {
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
