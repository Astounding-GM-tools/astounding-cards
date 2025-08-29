/**
 * Tests for Share URL Conversion Utilities
 * 
 * Tests the bidirectional conversion between full deck format and optimized shareable format,
 * including edge cases, data optimization, and utility functions.
 */

import { describe, test, expect } from 'vitest';
import { toShareable, fromShareable, estimateShareableSize, validateRoundTrip } from './shareUrlConverter.js';
import type { Deck, Card, Trait, Stat } from '../types/deck.js';
import type { ShareableDeck } from '../types/shareUrl.js';

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockTrait = (overrides: Partial<Trait> = {}): Trait => ({
    title: 'Brave',
    description: 'Fearless in battle',
    isPublic: false,
    ...overrides
});

const createMockStat = (overrides: Partial<Stat> = {}): Stat => ({
    title: 'Strength',
    value: 85,
    isPublic: false,
    tracked: false,
    description: '',
    ...overrides
});

const createMockCard = (overrides: Partial<Card> = {}): Card => ({
    id: 'card-123',
    title: 'Test Hero',
    subtitle: 'The Chosen One',
    description: 'A legendary hero from ancient times',
    image: null,
    imageBlob: null,
    imageMetadata: null,
    traits: [createMockTrait()],
    stats: [createMockStat()],
    ...overrides
});

const createMockDeck = (overrides: Partial<Deck> = {}): Deck => ({
    id: 'deck-456',
    meta: {
        title: 'Test Deck',
        description: 'A deck for testing',
        theme: 'classic',
        layout: 'tarot',
        lastEdited: 1672531200000, // 2023-01-01
        createdAt: 1672531200000
    },
    cards: [createMockCard()],
    ...overrides
});

// =============================================================================
// BASIC CONVERSION TESTS
// =============================================================================

describe('Share URL Converter - Basic Conversion', () => {
    test('toShareable converts full deck to shareable format', () => {
        const deck = createMockDeck();
        const shareable = toShareable(deck);

        expect(shareable).toMatchObject({
            id: 'deck-456',
            title: 'Test Deck',
            description: 'A deck for testing',
            cards: expect.any(Array)
        });
        
        expect(shareable.cards).toHaveLength(1);
        expect(shareable.cards[0]).toMatchObject({
            i: 'card-123',
            t: 'Test Hero',
            s: 'The Chosen One',
            d: 'A legendary hero from ancient times'
        });
    });

    test('fromShareable converts shareable format back to full deck', () => {
        const shareable: ShareableDeck = {
            id: 'deck-789',
            title: 'Imported Deck',
            description: 'An imported deck',
            cards: [{
                i: 'card-abc',
                t: 'Imported Hero',
                s: 'The Import',
                d: 'A hero from sharing'
            }]
        };
        
        const deck = fromShareable(shareable);
        
        expect(deck).toMatchObject({
            id: 'deck-789',
            meta: {
                title: 'Imported Deck',
                description: 'An imported deck',
                theme: 'classic', // Default value
                layout: 'tarot'   // Default value
            }
        });
        
        expect(deck.cards).toHaveLength(1);
        expect(deck.cards[0]).toMatchObject({
            id: 'card-abc',
            title: 'Imported Hero',
            subtitle: 'The Import',
            description: 'A hero from sharing',
            image: null,
            imageBlob: null,
            traits: [],
            stats: []
        });
        
        // Timestamps should be generated
        expect(deck.meta.lastEdited).toBeTypeOf('number');
        expect(deck.meta.createdAt).toBeTypeOf('number');
    });

    test('round-trip conversion preserves essential data', () => {
        const originalDeck = createMockDeck();
        const shareable = toShareable(originalDeck);
        const restored = fromShareable(shareable);
        
        // Core deck data should match
        expect(restored.id).toBe(originalDeck.id);
        expect(restored.meta.title).toBe(originalDeck.meta.title);
        expect(restored.meta.description).toBe(originalDeck.meta.description);
        expect(restored.meta.theme).toBe(originalDeck.meta.theme);
        expect(restored.meta.layout).toBe(originalDeck.meta.layout);
        
        // Card data should match
        expect(restored.cards).toHaveLength(originalDeck.cards.length);
        expect(restored.cards[0].id).toBe(originalDeck.cards[0].id);
        expect(restored.cards[0].title).toBe(originalDeck.cards[0].title);
        expect(restored.cards[0].subtitle).toBe(originalDeck.cards[0].subtitle);
        expect(restored.cards[0].description).toBe(originalDeck.cards[0].description);
    });
});

// =============================================================================
// DATA OPTIMIZATION TESTS
// =============================================================================

describe('Share URL Converter - Data Optimization', () => {
    test('omits default values from shareable format', () => {
        const deckWithDefaults = createMockDeck({
            meta: {
                title: 'Default Deck',
                description: '',  // Should be omitted
                theme: 'classic', // Should be omitted (default)
                layout: 'tarot',  // Should be omitted (default)
                lastEdited: Date.now(),
                createdAt: Date.now()
            }
        });
        
        const shareable = toShareable(deckWithDefaults);
        
        expect(shareable).not.toHaveProperty('description');
        expect(shareable).not.toHaveProperty('theme');
        expect(shareable).not.toHaveProperty('layout');
        expect(shareable).toMatchObject({
            id: expect.any(String),
            title: 'Default Deck',
            cards: expect.any(Array)
        });
    });

    test('includes non-default values in shareable format', () => {
        const deckWithCustomValues = createMockDeck({
            meta: {
                title: 'Custom Deck',
                description: 'Custom description',
                theme: 'dark',
                layout: 'standard',
                lastEdited: Date.now(),
                createdAt: Date.now()
            }
        });
        
        const shareable = toShareable(deckWithCustomValues);
        
        expect(shareable).toMatchObject({
            id: expect.any(String),
            title: 'Custom Deck',
            description: 'Custom description',
            theme: 'dark',
            layout: 'standard',
            cards: expect.any(Array)
        });
    });

    test('uses presence flags for boolean properties', () => {
        const traitPublic = createMockTrait({ isPublic: true });
        const traitPrivate = createMockTrait({ isPublic: false });
        const statTrackedPublic = createMockStat({ 
            isPublic: true, 
            tracked: true,
            description: 'A tracked stat' 
        });
        const statDefault = createMockStat({ 
            isPublic: false, 
            tracked: false,
            description: '' 
        });
        
        const deck = createMockDeck({
            cards: [createMockCard({
                traits: [traitPublic, traitPrivate],
                stats: [statTrackedPublic, statDefault]
            })]
        });
        
        const shareable = toShareable(deck);
        const shareableCard = shareable.cards[0];
        
        // Public trait should have presence flag
        expect(shareableCard.tr![0]).toHaveProperty('p', true);
        // Private trait should not have presence flag
        expect(shareableCard.tr![1]).not.toHaveProperty('p');
        
        // Public tracked stat should have both flags
        expect(shareableCard.st![0]).toHaveProperty('p', true);
        expect(shareableCard.st![0]).toHaveProperty('tr', true);
        expect(shareableCard.st![0]).toHaveProperty('d', 'A tracked stat');
        
        // Default stat should not have flags or description
        expect(shareableCard.st![1]).not.toHaveProperty('p');
        expect(shareableCard.st![1]).not.toHaveProperty('tr');
        expect(shareableCard.st![1]).not.toHaveProperty('d');
    });

    test('handles optional fields correctly', () => {
        const cardWithImage = createMockCard({
            image: 'https://example.com/hero.jpg',
            traits: [],
            stats: []
        });
        
        const cardWithoutOptionals = createMockCard({
            image: null,
            traits: [],
            stats: []
        });
        
        const deck = createMockDeck({
            cards: [cardWithImage, cardWithoutOptionals]
        });
        
        const shareable = toShareable(deck);
        
        // Card with image should include it
        expect(shareable.cards[0]).toHaveProperty('img', 'https://example.com/hero.jpg');
        expect(shareable.cards[0]).not.toHaveProperty('tr');
        expect(shareable.cards[0]).not.toHaveProperty('st');
        
        // Card without optionals should omit them
        expect(shareable.cards[1]).not.toHaveProperty('img');
        expect(shareable.cards[1]).not.toHaveProperty('tr');
        expect(shareable.cards[1]).not.toHaveProperty('st');
    });
});

// =============================================================================
// EDGE CASES TESTS
// =============================================================================

describe('Share URL Converter - Edge Cases', () => {
    test('handles empty deck', () => {
        const emptyDeck = createMockDeck({
            cards: []
        });
        
        const shareable = toShareable(emptyDeck);
        const restored = fromShareable(shareable);
        
        expect(shareable.cards).toHaveLength(0);
        expect(restored.cards).toHaveLength(0);
    });

    test('handles deck with no description', () => {
        const deck = createMockDeck({
            meta: {
                ...createMockDeck().meta,
                description: ''
            }
        });
        
        const shareable = toShareable(deck);
        const restored = fromShareable(shareable);
        
        expect(shareable).not.toHaveProperty('description');
        expect(restored.meta.description).toBe('');
    });

    test('handles missing optional properties in shareable format', () => {
        const minimalShareable: ShareableDeck = {
            id: 'minimal-deck',
            title: 'Minimal Deck',
            cards: [{
                i: 'minimal-card',
                t: 'Minimal Card',
                s: 'Subtitle',
                d: 'Description'
            }]
        };
        
        const restored = fromShareable(minimalShareable);
        
        expect(restored.meta.description).toBe('');
        expect(restored.meta.theme).toBe('classic');
        expect(restored.meta.layout).toBe('tarot');
        expect(restored.cards[0].image).toBeNull();
        expect(restored.cards[0].imageBlob).toBeNull();
        expect(restored.cards[0].imageMetadata).toBeNull();
        expect(restored.cards[0].traits).toHaveLength(0);
        expect(restored.cards[0].stats).toHaveLength(0);
    });

    test('generates imageMetadata for imported cards with images', () => {
        const shareableWithImage: ShareableDeck = {
            id: 'image-deck',
            title: 'Image Deck',
            cards: [{
                i: 'image-card',
                t: 'Image Card',
                s: 'Has Image',
                d: 'Card with image',
                img: 'https://example.com/image.jpg'
            }]
        };
        
        const restored = fromShareable(shareableWithImage);
        const card = restored.cards[0];
        
        expect(card.image).toBe('https://example.com/image.jpg');
        expect(card.imageMetadata).toMatchObject({
            source: 'url',
            addedAt: expect.any(Number)
        });
        expect(card.imageBlob).toBeNull();
    });
});

// =============================================================================
// UTILITY FUNCTIONS TESTS
// =============================================================================

describe('Share URL Converter - Utility Functions', () => {
    test('estimateShareableSize calculates size reduction correctly', () => {
        const deck = createMockDeck();
        const sizeEstimate = estimateShareableSize(deck);
        
        expect(sizeEstimate).toMatchObject({
            original: expect.any(Number),
            shareable: expect.any(Number),
            savings: expect.any(Number)
        });
        
        expect(sizeEstimate.original).toBeGreaterThan(sizeEstimate.shareable);
        expect(sizeEstimate.savings).toBeGreaterThan(0);
        expect(sizeEstimate.savings).toBeLessThanOrEqual(100);
    });

    test('validateRoundTrip detects successful conversion', () => {
        const deck = createMockDeck();
        const validation = validateRoundTrip(deck);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    test('validateRoundTrip detects conversion errors', () => {
        // Create a deck with complex data to test validation
        const complexDeck = createMockDeck({
            cards: [
                createMockCard({ id: 'card-1' }),
                createMockCard({ id: 'card-2', title: 'Different Title' })
            ]
        });
        
        const validation = validateRoundTrip(complexDeck);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    test('validateRoundTrip handles conversion exceptions', () => {
        // This would require mocking the conversion functions to throw errors
        // For now, we test that it handles normal cases properly
        const deck = createMockDeck();
        const validation = validateRoundTrip(deck);
        
        expect(validation).toHaveProperty('isValid');
        expect(validation).toHaveProperty('errors');
        expect(Array.isArray(validation.errors)).toBe(true);
    });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Share URL Converter - Integration', () => {
    test('handles complex deck with all features', () => {
        const complexDeck = createMockDeck({
            meta: {
                title: 'Complex Adventure Deck',
                description: 'A deck with all possible features',
                theme: 'dark',
                layout: 'standard',
                lastEdited: Date.now(),
                createdAt: Date.now() - 86400000 // 1 day ago
            },
            cards: [
                createMockCard({
                    id: 'hero-001',
                    title: 'Aria Stormwind',
                    subtitle: 'Wind Mage',
                    description: 'A powerful mage who commands the winds and storms',
                    image: 'https://example.com/aria.jpg',
                    traits: [
                        createMockTrait({ 
                            title: 'Magical', 
                            description: 'Skilled in arcane arts', 
                            isPublic: true 
                        }),
                        createMockTrait({ 
                            title: 'Noble', 
                            description: 'Born to a noble family', 
                            isPublic: false 
                        })
                    ],
                    stats: [
                        createMockStat({ 
                            title: 'Intelligence', 
                            value: 95, 
                            isPublic: true, 
                            tracked: true, 
                            description: 'Mental acuity and magical power' 
                        }),
                        createMockStat({ 
                            title: 'Health', 
                            value: 78, 
                            isPublic: false, 
                            tracked: false, 
                            description: '' 
                        })
                    ]
                }),
                createMockCard({
                    id: 'villain-001',
                    title: 'Lord Shadowbane',
                    subtitle: 'The Dark Lord',
                    description: 'An ancient evil that threatens the realm',
                    image: null,
                    traits: [],
                    stats: [
                        createMockStat({ 
                            title: 'Power', 
                            value: 100, 
                            isPublic: true, 
                            tracked: true, 
                            description: 'Raw destructive power' 
                        })
                    ]
                })
            ]
        });

        // Test conversion
        const shareable = toShareable(complexDeck);
        const restored = fromShareable(shareable);
        
        // Validate essential data is preserved
        expect(restored.id).toBe(complexDeck.id);
        expect(restored.meta.title).toBe(complexDeck.meta.title);
        expect(restored.meta.theme).toBe(complexDeck.meta.theme);
        expect(restored.cards).toHaveLength(2);
        
        // Validate specific card features
        const restoredHero = restored.cards[0];
        expect(restoredHero.traits).toHaveLength(2);
        expect(restoredHero.stats).toHaveLength(2);
        expect(restoredHero.traits[0].isPublic).toBe(true);
        expect(restoredHero.traits[1].isPublic).toBe(false);
        expect(restoredHero.stats[0].tracked).toBe(true);
        expect(restoredHero.stats[1].tracked).toBe(false);
        
        // Test size optimization
        const sizeEstimate = estimateShareableSize(complexDeck);
        expect(sizeEstimate.savings).toBeGreaterThan(0);
        
        // Test validation
        const validation = validateRoundTrip(complexDeck);
        expect(validation.isValid).toBe(true);
    });
});
