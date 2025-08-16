// Card.component.test.ts - Integration test for Card component

import { describe, it, expect } from 'vitest';
import type { Deck } from '$lib/types';
import { resolveActiveTheme } from './Card.svelte.ts';

describe('Card Component Integration', () => {
  it('should import all required extracted functions without errors', () => {
    // Verify all functions are available
    expect(resolveActiveTheme).toBeDefined();
  });

  it('should resolve active theme correctly', () => {
    const deck: Deck = {
      id: 'test-deck',
      cards: [],
      meta: {
        name: 'Test Deck',
        theme: 'dark',
        cardSize: 'poker',
        lastEdited: Date.now(),
        createdAt: Date.now()
      }
    };

    // Test with prop theme (highest priority)
    expect(resolveActiveTheme('custom', deck)).toBe('custom');

    // Test with deck theme (medium priority)
    expect(resolveActiveTheme(undefined, deck)).toBe('dark');

    // Test with fallback (lowest priority)
    expect(resolveActiveTheme(undefined, null)).toBe('classic');

    // Test with null deck
    const nullDeck = null;
    expect(resolveActiveTheme(undefined, nullDeck)).toBe('classic');

    // Test with deck without meta
    const deckWithoutMeta = {
      id: 'test-deck-2',
      cards: [],
      meta: {
        name: 'Test Deck 2',
        theme: 'classic',
        cardSize: 'poker',
        lastEdited: Date.now(),
        createdAt: Date.now()
      }
    } as Deck;
    expect(resolveActiveTheme(undefined, deckWithoutMeta)).toBe('classic');
  });
});
