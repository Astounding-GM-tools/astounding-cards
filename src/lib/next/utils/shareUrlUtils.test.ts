/**
 * Tests for Share URL Import/Export Utilities
 * 
 * Tests the complete URL workflow: Deck → ShareableDeck → URL → ShareableDeck → Deck
 * Includes URL generation, parsing, validation, error handling, and round-trip testing.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
    generateShareUrl,
    generateShareUrlQuery,
    extractShareDataFromUrl,
    importFromUrl,
    importFromCurrentUrl,
    isShareUrl,
    getShareUrlType,
    estimateShareUrlLength,
    isShareUrlTooLong,
    validateShareUrlRoundTrip
} from './shareUrlUtils.js';
import type { Deck, Card, Trait, Stat } from '../types/deck.js';
import type { ShareableDeck } from '../types/shareUrl.js';

// =============================================================================
// MOCK DATA (reusing from shareUrlConverter.test.ts with some additions)
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

// Sample base64 encoded minimal deck data for testing
const SAMPLE_BASE64_DATA = btoa(unescape(encodeURIComponent(JSON.stringify({
    id: 'test-deck',
    title: 'Sample Deck',
    cards: [{
        i: 'test-card',
        t: 'Sample Card',
        s: 'Subtitle',
        d: 'Description'
    }]
}))));

// =============================================================================
// URL GENERATION TESTS
// =============================================================================

describe('Share URL Utils - URL Generation', () => {
    test('generateShareUrl creates valid hash-based URL with slug', () => {
        const deck = createMockDeck();
        const url = generateShareUrl(deck, 'https://example.com');
        
        expect(url).toMatch(/^https:\/\/example\.com\/[a-z0-9-]+#data=.+$/);
        expect(url).toContain('/test-deck#data=');  // slug should be "test-deck"
        
        // Should be able to extract data back
        const extracted = extractShareDataFromUrl(url);
        expect(extracted).not.toBeNull();
        expect(extracted!.id).toBe(deck.id);
        expect(extracted!.title).toBe(deck.meta.title);
    });

    test('generateShareUrlQuery creates valid query parameter URL', () => {
        const deck = createMockDeck();
        const url = generateShareUrlQuery(deck, 'https://example.com');
        
        expect(url).toMatch(/^https:\/\/example\.com\?data=.+$/);
        expect(url).toContain('?data=');
        
        // Should be able to extract data back
        const extracted = extractShareDataFromUrl(url);
        expect(extracted).not.toBeNull();
        expect(extracted!.id).toBe(deck.id);
        expect(extracted!.title).toBe(deck.meta.title);
    });

    test('generateShareUrl uses window.location.origin when no baseUrl provided', () => {
        // Mock window.location
        const mockLocation = {
            origin: 'https://myapp.com'
        };
        vi.stubGlobal('window', { location: mockLocation });

        const deck = createMockDeck();
        const url = generateShareUrl(deck);
        
        expect(url.startsWith('https://myapp.com/test-deck#data=')).toBe(true);
        
        vi.unstubAllGlobals();
    });

    test('generateShareUrl uses fallback URL when window is undefined', () => {
        // Ensure window is undefined (Node.js environment)
        vi.stubGlobal('window', undefined);
        
        const deck = createMockDeck();
        const url = generateShareUrl(deck);
        
        expect(url.startsWith('https://example.com/test-deck#data=')).toBe(true);
        
        vi.unstubAllGlobals();
    });

    test('generated URLs contain valid base64 data', () => {
        const deck = createMockDeck();
        const url = generateShareUrl(deck);
        
        const hashPart = url.split('#data=')[1];
        expect(hashPart).toBeDefined();
        
        // Should be valid base64
        expect(() => atob(hashPart)).not.toThrow();
        
        // Should decode to valid JSON
        const decoded = decodeURIComponent(escape(atob(hashPart)));
        expect(() => JSON.parse(decoded)).not.toThrow();
        
        const parsed = JSON.parse(decoded);
        expect(parsed.id).toBe(deck.id);
        expect(parsed.title).toBe(deck.meta.title);
    });
});

// =============================================================================
// URL PARSING AND IMPORT TESTS
// =============================================================================

describe('Share URL Utils - URL Parsing and Import', () => {
    test('extractShareDataFromUrl handles hash format', () => {
        const url = `https://example.com#data=${SAMPLE_BASE64_DATA}`;
        const extracted = extractShareDataFromUrl(url);
        
        expect(extracted).not.toBeNull();
        expect(extracted!.id).toBe('test-deck');
        expect(extracted!.title).toBe('Sample Deck');
        expect(extracted!.cards).toHaveLength(1);
    });

    test('extractShareDataFromUrl handles query parameter format', () => {
        const url = `https://example.com?data=${encodeURIComponent(SAMPLE_BASE64_DATA)}`;
        const extracted = extractShareDataFromUrl(url);
        
        expect(extracted).not.toBeNull();
        expect(extracted!.id).toBe('test-deck');
        expect(extracted!.title).toBe('Sample Deck');
        expect(extracted!.cards).toHaveLength(1);
    });

    test('extractShareDataFromUrl prioritizes hash over query parameter', () => {
        const hashData = SAMPLE_BASE64_DATA;
        const differentQueryData = btoa(unescape(encodeURIComponent(JSON.stringify({
            id: 'query-deck',
            title: 'Query Deck',
            cards: []
        }))));
        
        const url = `https://example.com?data=${encodeURIComponent(differentQueryData)}#data=${hashData}`;
        const extracted = extractShareDataFromUrl(url);
        
        expect(extracted).not.toBeNull();
        expect(extracted!.id).toBe('test-deck'); // Should use hash data, not query data
        expect(extracted!.title).toBe('Sample Deck');
    });

    test('extractShareDataFromUrl returns null for URLs without share data', () => {
        const urls = [
            'https://example.com',
            'https://example.com#other-hash',
            'https://example.com?other=param',
            'https://example.com#data=', // Empty data
            'invalid-url'
        ];
        
        urls.forEach(url => {
            const extracted = extractShareDataFromUrl(url);
            expect(extracted).toBeNull();
        });
    });

    test('extractShareDataFromUrl handles malformed base64 gracefully', () => {
        const urls = [
            'https://example.com#data=invalid-base64!',
            'https://example.com#data=dGVzdA', // Valid base64 but invalid JSON
            'https://example.com?data=not-json-object'
        ];
        
        urls.forEach(url => {
            const extracted = extractShareDataFromUrl(url);
            expect(extracted).toBeNull();
        });
    });

    test('importFromUrl successfully imports a deck', () => {
        const originalDeck = createMockDeck();
        const url = generateShareUrl(originalDeck);
        const importedDeck = importFromUrl(url);
        
        expect(importedDeck).not.toBeNull();
        expect(importedDeck!.id).toBe(originalDeck.id);
        expect(importedDeck!.meta.title).toBe(originalDeck.meta.title);
        expect(importedDeck!.cards).toHaveLength(originalDeck.cards.length);
        expect(importedDeck!.cards[0].id).toBe(originalDeck.cards[0].id);
    });

    test('importFromUrl returns null for invalid URLs', () => {
        const invalidUrls = [
            'https://example.com',
            'invalid-url',
            'https://example.com#data=invalid'
        ];
        
        invalidUrls.forEach(url => {
            const imported = importFromUrl(url);
            expect(imported).toBeNull();
        });
    });

    test('importFromCurrentUrl works in browser environment', () => {
        const originalDeck = createMockDeck();
        const url = generateShareUrl(originalDeck);
        
        // Mock window.location.href
        const mockLocation = { href: url };
        vi.stubGlobal('window', { location: mockLocation });
        
        const importedDeck = importFromCurrentUrl();
        
        expect(importedDeck).not.toBeNull();
        expect(importedDeck!.id).toBe(originalDeck.id);
        
        vi.unstubAllGlobals();
    });

    test('importFromCurrentUrl returns null in non-browser environment', () => {
        vi.stubGlobal('window', undefined);
        
        const imported = importFromCurrentUrl();
        expect(imported).toBeNull();
        
        vi.unstubAllGlobals();
    });
});

// =============================================================================
// URL VALIDATION TESTS
// =============================================================================

describe('Share URL Utils - URL Validation', () => {
    test('isShareUrl correctly identifies share URLs', () => {
        const shareUrls = [
            `https://example.com#data=${SAMPLE_BASE64_DATA}`,
            `https://example.com?data=${SAMPLE_BASE64_DATA}`,
            `https://example.com?other=param&data=${SAMPLE_BASE64_DATA}`,
            `https://example.com/path#data=${SAMPLE_BASE64_DATA}`
        ];
        
        shareUrls.forEach(url => {
            expect(isShareUrl(url)).toBe(true);
        });
    });

    test('isShareUrl correctly rejects non-share URLs', () => {
        const nonShareUrls = [
            'https://example.com',
            'https://example.com#other-hash',
            'https://example.com?other=param',
            'invalid-url'
        ];
        
        nonShareUrls.forEach(url => {
            expect(isShareUrl(url)).toBe(false);
        });

        // Test empty data separately since they should also return false
        expect(isShareUrl('https://example.com#data=')).toBe(false);
        expect(isShareUrl('https://example.com?data=')).toBe(false);
    });

    test('getShareUrlType correctly identifies URL types', () => {
        const hashUrl = `https://example.com#data=${SAMPLE_BASE64_DATA}`;
        const queryUrl = `https://example.com?data=${SAMPLE_BASE64_DATA}`;
        const regularUrl = 'https://example.com';
        
        expect(getShareUrlType(hashUrl)).toBe('hash');
        expect(getShareUrlType(queryUrl)).toBe('query');
        expect(getShareUrlType(regularUrl)).toBeNull();
    });

    test('getShareUrlType prioritizes hash over query', () => {
        const mixedUrl = `https://example.com?data=${SAMPLE_BASE64_DATA}#data=${SAMPLE_BASE64_DATA}`;
        expect(getShareUrlType(mixedUrl)).toBe('hash');
    });

    test('getShareUrlType handles invalid URLs', () => {
        expect(getShareUrlType('invalid-url')).toBeNull();
        expect(getShareUrlType('')).toBeNull();
    });
});

// =============================================================================
// URL LENGTH AND UTILITY TESTS
// =============================================================================

describe('Share URL Utils - URL Length and Utilities', () => {
    test('estimateShareUrlLength returns accurate length', () => {
        const deck = createMockDeck();
        const estimatedLength = estimateShareUrlLength(deck, 'https://example.com');
        const actualUrl = generateShareUrl(deck, 'https://example.com');
        
        expect(estimatedLength).toBe(actualUrl.length);
    });

    test('isShareUrlTooLong detects long URLs', () => {
        const shortDeck = createMockDeck({
            meta: { ...createMockDeck().meta, title: 'Short', description: '' },
            cards: [createMockCard({ title: 'A', subtitle: 'B', description: 'C', traits: [], stats: [] })]
        });
        
        const longDeck = createMockDeck({
            meta: {
                ...createMockDeck().meta,
                title: 'Very Long Deck Title That Goes On And On',
                description: 'This is a very long description that contains lots of text to make the URL longer than usual'
            },
            cards: Array.from({ length: 10 }, (_, i) => createMockCard({
                id: `card-${i}`,
                title: `Very Long Card Title Number ${i} With Lots Of Text`,
                subtitle: `Lengthy subtitle for card ${i}`,
                description: `This is a very detailed description for card ${i} that contains lots and lots of text to make the overall URL quite long`,
                traits: Array.from({ length: 5 }, (_, j) => createMockTrait({
                    title: `Trait ${j} for card ${i}`,
                    description: `Detailed description of trait ${j}`,
                    isPublic: j % 2 === 0
                })),
                stats: Array.from({ length: 5 }, (_, j) => createMockStat({
                    title: `Statistic ${j} for card ${i}`,
                    value: 50 + j * 10,
                    description: `Description of statistic ${j}`,
                    isPublic: j % 2 === 0,
                    tracked: j % 3 === 0
                }))
            }))
        });
        
        expect(isShareUrlTooLong(shortDeck, 2000)).toBe(false);
        expect(isShareUrlTooLong(longDeck, 500)).toBe(true); // Very strict limit
    });

    test('isShareUrlTooLong uses default limit correctly', () => {
        const deck = createMockDeck();
        // Most normal decks should be under 2000 characters
        expect(isShareUrlTooLong(deck)).toBe(false);
    });
});

// =============================================================================
// ROUND-TRIP VALIDATION TESTS
// =============================================================================

describe('Share URL Utils - Round-Trip Validation', () => {
    test('validateShareUrlRoundTrip succeeds for valid deck', () => {
        const deck = createMockDeck();
        const validation = validateShareUrlRoundTrip(deck);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.url).toBeDefined();
        expect(validation.url).toContain('#data=');
    });

    test('validateShareUrlRoundTrip detects data integrity issues', () => {
        const deck = createMockDeck();
        const validation = validateShareUrlRoundTrip(deck);
        
        // Should preserve essential data
        expect(validation.isValid).toBe(true);
        
        // URL should be reasonable length
        expect(validation.url!.length).toBeLessThan(2000);
    });

    test('validateShareUrlRoundTrip warns about long URLs', () => {
        // Create a deck that will generate a very long URL
        const longDeck = createMockDeck({
            cards: Array.from({ length: 50 }, (_, i) => createMockCard({
                id: `very-long-card-id-${i}`,
                title: `Very Long Card Title ${i} With Excessive Detail`,
                subtitle: `Extremely Long Subtitle ${i}`,
                description: 'A'.repeat(500), // Very long description
                traits: Array.from({ length: 10 }, (_, j) => createMockTrait({
                    title: `Long Trait Title ${j}`,
                    description: 'B'.repeat(200)
                })),
                stats: Array.from({ length: 10 }, (_, j) => createMockStat({
                    title: `Long Stat Title ${j}`,
                    description: 'C'.repeat(200)
                }))
            }))
        });
        
        const validation = validateShareUrlRoundTrip(longDeck);
        
        // Should still be valid for round-trip, but warn about length
        expect(validation.errors.some(error => error.includes('very long'))).toBe(true);
    });

    test('validateShareUrlRoundTrip handles edge cases', () => {
        const emptyDeck = createMockDeck({ cards: [] });
        const validation = validateShareUrlRoundTrip(emptyDeck);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Share URL Utils - Integration', () => {
    test('complete workflow: deck → URL → deck preserves data', () => {
        const originalDeck = createMockDeck({
            meta: {
                title: 'Integration Test Deck',
                description: 'Testing full workflow',
                theme: 'dark',
                layout: 'standard',
                lastEdited: 1672617600000, // Fixed timestamp
                createdAt: 1672531200000   // Fixed timestamp
            },
            cards: [
                createMockCard({
                    id: 'hero-card',
                    title: 'Test Hero',
                    subtitle: 'The Tester',
                    description: 'A hero for testing purposes',
                    image: 'https://example.com/hero.jpg',
                    traits: [
                        createMockTrait({ title: 'Brave', isPublic: true }),
                        createMockTrait({ title: 'Clever', isPublic: false })
                    ],
                    stats: [
                        createMockStat({ title: 'Strength', value: 80, isPublic: true, tracked: true }),
                        createMockStat({ title: 'Intelligence', value: 90, isPublic: false, tracked: false })
                    ]
                })
            ]
        });
        
        // Generate URL
        const url = generateShareUrl(originalDeck);
        expect(url).toContain('#data=');
        
        // Validate URL
        expect(isShareUrl(url)).toBe(true);
        expect(getShareUrlType(url)).toBe('hash');
        
        // Import from URL
        const importedDeck = importFromUrl(url);
        expect(importedDeck).not.toBeNull();
        
        // Verify data preservation
        expect(importedDeck!.id).toBe(originalDeck.id);
        expect(importedDeck!.meta.title).toBe(originalDeck.meta.title);
        expect(importedDeck!.meta.theme).toBe(originalDeck.meta.theme);
        expect(importedDeck!.cards).toHaveLength(1);
        
        const importedCard = importedDeck!.cards[0];
        expect(importedCard.id).toBe(originalDeck.cards[0].id);
        expect(importedCard.title).toBe(originalDeck.cards[0].title);
        expect(importedCard.traits).toHaveLength(2);
        expect(importedCard.stats).toHaveLength(2);
        expect(importedCard.traits[0].isPublic).toBe(true);
        expect(importedCard.traits[1].isPublic).toBe(false);
        expect(importedCard.stats[0].tracked).toBe(true);
        expect(importedCard.stats[1].tracked).toBe(false);
        
        // Timestamps should be regenerated
        expect(importedDeck!.meta.lastEdited).not.toBe(originalDeck.meta.lastEdited);
        expect(importedDeck!.meta.createdAt).not.toBe(originalDeck.meta.createdAt);
        
        // Image metadata should be regenerated
        expect(importedCard.imageMetadata).toMatchObject({
            source: 'url',
            addedAt: expect.any(Number)
        });
    });

    test('handles both URL formats consistently', () => {
        const deck = createMockDeck();
        
        const hashUrl = generateShareUrl(deck);
        const queryUrl = generateShareUrlQuery(deck);
        
        const hashImported = importFromUrl(hashUrl);
        const queryImported = importFromUrl(queryUrl);
        
        expect(hashImported).not.toBeNull();
        expect(queryImported).not.toBeNull();
        
        // Both should produce equivalent results
        expect(hashImported!.id).toBe(queryImported!.id);
        expect(hashImported!.meta.title).toBe(queryImported!.meta.title);
        expect(hashImported!.cards.length).toBe(queryImported!.cards.length);
    });

    test('validates complex decks successfully', () => {
        const complexDeck = createMockDeck({
            cards: Array.from({ length: 5 }, (_, i) => createMockCard({
                id: `card-${i}`,
                traits: [createMockTrait(), createMockTrait({ isPublic: true })],
                stats: [createMockStat({ tracked: true }), createMockStat()]
            }))
        });
        
        const validation = validateShareUrlRoundTrip(complexDeck);
        expect(validation.isValid).toBe(true);
        expect(validation.url).toBeDefined();
        
        // Should be able to import successfully
        const imported = importFromUrl(validation.url!);
        expect(imported).not.toBeNull();
        expect(imported!.cards).toHaveLength(5);
    });
});
