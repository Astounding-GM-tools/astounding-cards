// CardBase.component.test.ts - Integration test for CardBase component

import { describe, it, expect } from 'vitest';
import type { Deck } from '$lib/types';
import {
  resolveActiveTheme,
  resolveCardSize,
  createCardBaseState,
  type CardSize,
  type CardBaseState
} from './CardBase.svelte.ts';

describe('CardBase Component Integration', () => {
  it('should import all required extracted functions without errors', () => {
    // Verify all functions are available
    expect(resolveActiveTheme).toBeDefined();
    expect(resolveCardSize).toBeDefined();
    expect(createCardBaseState).toBeDefined();
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
  });

  it('should resolve card size correctly', () => {
    const pokerDeck: Deck = {
      id: 'test-deck',
      cards: [],
      meta: {
        name: 'Test Deck',
        theme: 'classic',
        cardSize: 'poker',
        lastEdited: Date.now(),
        createdAt: Date.now()
      }
    };

    const tarotDeck: Deck = {
      id: 'test-deck-2',
      cards: [],
      meta: {
        name: 'Test Deck 2',
        theme: 'classic',
        cardSize: 'tarot',
        lastEdited: Date.now(),
        createdAt: Date.now()
      }
    };

    // Test with prop cardSize (highest priority)
    expect(resolveCardSize('tarot', pokerDeck)).toBe('tarot');

    // Test with deck cardSize (medium priority)
    expect(resolveCardSize(undefined, pokerDeck)).toBe('poker');
    expect(resolveCardSize(undefined, tarotDeck)).toBe('tarot');

    // Test with fallback (lowest priority)
    expect(resolveCardSize(undefined, null)).toBe('poker');
  });

  it('should create complete card base state correctly', () => {
    const deck: Deck = {
      id: 'test-deck',
      cards: [],
      meta: {
        name: 'Test Deck',
        theme: 'dark',
        cardSize: 'tarot',
        lastEdited: Date.now(),
        createdAt: Date.now()
      }
    };

    // Test with all props provided
    const state1 = createCardBaseState('custom', true, 'poker', deck);
    expect(state1).toEqual({
      activeTheme: 'custom',
      isPreview: true,
      size: 'poker'
    });

    // Test with some props provided
    const state2 = createCardBaseState(undefined, false, undefined, deck);
    expect(state2).toEqual({
      activeTheme: 'dark',
      isPreview: false,
      size: 'tarot'
    });

    // Test with defaults
    const state3 = createCardBaseState(undefined, undefined, undefined, null);
    expect(state3).toEqual({
      activeTheme: 'classic',
      isPreview: false,
      size: 'poker'
    });
  });

  it('should handle edge cases correctly', () => {
    // Test with empty deck
    const emptyDeck = {} as Deck;
    const state = createCardBaseState(undefined, undefined, undefined, emptyDeck);
    expect(state.activeTheme).toBe('classic');
    expect(state.size).toBe('poker');
    expect(state.isPreview).toBe(false);

    // Test preview mode conversion
    const previewState = createCardBaseState(undefined, true, undefined, null);
    expect(previewState.isPreview).toBe(true);
  });
});
