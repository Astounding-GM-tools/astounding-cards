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
                    title: 'Welcome to Astounding Cards!',
                    subtitle: 'Your RPG Card Creator',
                    description: 'Create beautiful, printable character cards for tabletop RPGs. This app works entirely offline after loading - no server needed!',
                    traits: [
                        { title: 'Fully Offline', description: 'Works without internet after first load', isPublic: true },
                        { title: 'Print Ready', description: 'Perfect A4 layouts for home printing', isPublic: true },
                        { title: 'Cross Platform', description: 'Works on phones, tablets, and desktop', isPublic: true },
                        { title: 'Install as App', description: 'Can be installed like a native app', isPublic: false }
                    ],
                    stats: [
                        { title: 'Tutorial Step', value: 1, tracked: false, isPublic: true, description: 'First card in the tutorial series' },
                        { title: 'Cards in Tutorial', value: 4, tracked: false, isPublic: true },
                        { title: 'Getting Started', value: 100, tracked: false, isPublic: true, description: 'You\'re ready to begin!' }
                    ]
                },
                {
                    title: 'Creating & Editing Cards',
                    subtitle: 'Basic Usage Guide',
                    description: 'Click any card to edit it! Add characters, items, locations, or anything else. Use the header controls to add new cards and manage your decks.',
                    traits: [
                        { title: 'Click to Edit', description: 'Click any card to open the editor', isPublic: true },
                        { title: 'Add Cards', description: 'Use "+" button in header to add new cards', isPublic: true },
                        { title: 'Manage Decks', description: 'Use "Manage Decks" to create/organize decks', isPublic: true },
                        { title: 'Hide Backs', description: 'Toggle card backs visibility for overview', isPublic: false }
                    ],
                    stats: [
                        { title: 'Tutorial Step', value: 2, tracked: false, isPublic: true },
                        { title: 'Cards Per Page', value: 4, tracked: false, isPublic: true, description: 'Tarot layout: 4 cards per page' },
                        { title: 'Cards Per Page (Poker)', value: 9, tracked: false, isPublic: false, description: 'Poker layout: 9 cards per page' }
                    ]
                },
                {
                    title: 'AI-Powered Features',
                    subtitle: 'Generate Content & Images',
                    description: 'Use AI to generate entire decks, individual cards, or card images. Provide your Google AI Studio API key for powerful AI assistance.',
                    traits: [
                        { title: 'AI Deck Generator', description: 'Create complete decks from a theme description', isPublic: true },
                        { title: 'Batch Image Generation', description: 'Generate images for all cards at once', isPublic: true },
                        { title: 'Multiple Art Styles', description: 'Classic, Modern, and Inked art styles available', isPublic: true },
                        { title: 'Your API Key', description: 'Uses your own Google AI key - private & secure', isPublic: false }
                    ],
                    stats: [
                        { title: 'Tutorial Step', value: 3, tracked: false, isPublic: true },
                        { title: 'Art Styles', value: 3, tracked: false, isPublic: true, description: 'Classic, Modern, and Inked styles' },
                        { title: 'AI Power Level', value: 95, tracked: false, isPublic: true, description: 'Gemini 2.5 Flash - very capable!' }
                    ]
                },
                {
                    title: 'Deck Management & Sharing',
                    subtitle: 'Organize & Share Your Work',
                    description: 'Manage multiple decks, share via URLs, and export/import JSON files. When ready, delete this tutorial deck from Deck Management!',
                    traits: [
                        { title: 'Multiple Decks', description: 'Create and switch between different decks', isPublic: true },
                        { title: 'Share URLs', description: 'Generate shareable links for your decks', isPublic: true },
                        { title: 'Export/Import', description: 'JSON export with optional image embedding', isPublic: true },
                        { title: 'Delete This Deck', description: 'Remove tutorial via Deck Management when ready', isPublic: false }
                    ],
                    stats: [
                        { title: 'Tutorial Complete!', value: 4, tracked: false, isPublic: true, description: 'You\'ve reached the final tutorial card' },
                        { title: 'Ready to Create', value: 100, tracked: false, isPublic: true },
                        { title: 'Have Fun!', value: 999, tracked: false, isPublic: true, description: 'Time to make some astounding cards!' }
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
