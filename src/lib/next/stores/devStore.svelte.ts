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

/**
 * Create dev tools store
 */
function createNextDevStore() {
    let devMode = $state(false);

    return {
        get isDevMode() { return devMode; },

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
                
                // Add sample cards
                const sampleCards = this.getSampleCards();
                
                for (const cardData of sampleCards) {
                    await nextDb.addCard(deck.id, cardData);
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
            return [
                {
                    title: '👋 Welcome! Click This Card!',
                    subtitle: 'Your First Tutorial Step',
                    description: 'This is Astounding Cards - create beautiful, printable cards for any purpose! Click anywhere on this card RIGHT NOW to see the magic editor. No signup, fully offline!',
                    traits: [
                        { title: '1. Click This Card', description: 'Click anywhere on this card to open the editor', isPublic: true },
                        { title: '2. Try Editing', description: 'Change the title, add traits, upload images', isPublic: true },
                        { title: '3. Add New Cards', description: 'Use the "+ Add Card" button in the header', isPublic: true },
                        { title: 'Secret Mission', description: 'Find this text by flipping to the card back!', isPublic: false }
                    ],
                    stats: [
                        { title: 'Tutorial Progress', value: 1, tracked: true, isPublic: true, description: 'Step 1 of 4: Click this card!' },
                        { title: 'Cards to Explore', value: 4, tracked: false, isPublic: true },
                        { title: 'Fun Level', value: 100, tracked: false, isPublic: true, description: 'Maximum learning ahead!' }
                    ]
                },
                {
                    title: 'Card Editor Deep Dive',
                    subtitle: 'Traits, Stats, and Images',
                    description: '🎨 In the editor: Add traits (appear on front/back), stats with values, and images. Drag to reorder items. Toggle "Front/Back" to control visibility.',
                    traits: [
                        { title: 'Public Traits', description: 'These appear on the front of the card', isPublic: true },
                        { title: 'Stats with Values', description: 'Numbers that can be tracked or just displayed', isPublic: true },
                        { title: 'Drag to Reorder', description: 'Drag the ⋮⋮ handles to rearrange items', isPublic: true },
                        { title: 'Private Traits', description: 'This trait only appears on the back!', isPublic: false }
                    ],
                    stats: [
                        { title: 'Tutorial Step', value: 2, tracked: false, isPublic: true },
                        { title: 'Front Stat', value: 42, tracked: false, isPublic: true, description: 'This stat is visible on the front' },
                        { title: 'Back Stat', value: 88, tracked: true, isPublic: false, description: 'Back stats can have tracking boxes' }
                    ]
                },
                {
                    title: 'AI Magic (Optional)',
                    subtitle: 'Images & Content Generation',
                    description: '🤖 Want AI help? In any card editor, add your Google AI Studio API key to generate images and content. Try "Generate Images" button in the header!',
                    traits: [
                        { title: 'AI Images', description: 'Generate card images from descriptions', isPublic: true },
                        { title: 'Batch Generation', description: 'Use "Generate Images" to do all cards at once', isPublic: true },
                        { title: 'Multiple Styles', description: 'Classic, Modern, and Inked art styles', isPublic: true },
                        { title: 'Your API Key', description: 'Get free key from aistudio.google.com', isPublic: false }
                    ],
                    stats: [
                        { title: 'Tutorial Step', value: 3, tracked: false, isPublic: true },
                        { title: 'Art Styles', value: 3, tracked: false, isPublic: true, description: 'Classic, Modern, and Inked' },
                        { title: 'Optional Feature', value: 100, tracked: false, isPublic: true, description: 'Works great without AI too!' }
                    ]
                },
                {
                    title: 'You\'re Ready to Create!',
                    subtitle: 'Print, Share, and Manage',
                    description: '🎉 Tutorial complete! Use "Manage Decks" to create new decks, "Share" for URLs, and print when ready. Delete this tutorial deck when you\'re comfortable!',
                    traits: [
                        { title: 'Create New Decks', description: 'Use "Manage Decks" → "Create New Deck"', isPublic: true },
                        { title: 'Share Your Work', description: 'Use "Share" button to create shareable URLs', isPublic: true },
                        { title: 'Print Ready', description: 'Just Ctrl+P (or ⌘+P) for perfect layouts', isPublic: true },
                        { title: 'Delete Tutorial', description: 'Remove this deck when you\'re ready to go solo!', isPublic: false }
                    ],
                    stats: [
                        { title: 'Tutorial Complete', value: 100, tracked: false, isPublic: true, description: 'You know everything you need!' },
                        { title: 'Cards Created', value: 0, tracked: true, isPublic: true, description: 'Time to start creating!' },
                        { title: 'Fun Level', value: 999, tracked: false, isPublic: true, description: 'Maximum fun achieved!' }
                    ]
                }
            ];
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
if (typeof window !== 'undefined') {
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
