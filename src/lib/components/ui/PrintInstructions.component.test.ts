// PrintInstructions.component.test.ts - Integration test for PrintInstructions component

import { describe, it, expect, vi } from 'vitest';
import type { Deck } from '$lib/types';
import {
  createPrintInstructionsState,
  closeDialog,
  getCardSizeDisplayName,
  getCardsPerPageText,
  getCardDimensionsText,
  getCurrentCardSize,
  type CardSize,
  type PrintInstructionsState
} from './PrintInstructions.svelte.ts';

describe('PrintInstructions Component Integration', () => {
  it('should import all required extracted functions without errors', () => {
    // Verify all functions are available
    expect(createPrintInstructionsState).toBeDefined();
    expect(closeDialog).toBeDefined();
    expect(getCardSizeDisplayName).toBeDefined();
    expect(getCardsPerPageText).toBeDefined();
    expect(getCardDimensionsText).toBeDefined();
    expect(getCurrentCardSize).toBeDefined();
  });

  it('should create initial state correctly', () => {
    const state = createPrintInstructionsState();
    
    expect(state.dialog).toBeNull();
  });

  it('should get card size display name correctly', () => {
    expect(getCardSizeDisplayName('poker')).toBe('Poker');
    expect(getCardSizeDisplayName('tarot')).toBe('Tarot');
    expect(getCardSizeDisplayName(undefined)).toBe('Tarot'); // defaults to Tarot
  });

  it('should get cards per page text correctly', () => {
    expect(getCardsPerPageText('poker')).toBe('(9 cards per page, standard playing card size)');
    expect(getCardsPerPageText('tarot')).toBe('(4 cards per page, larger size for better readability)');
    expect(getCardsPerPageText(undefined)).toBe('(4 cards per page, larger size for better readability)');
  });

  it('should get card dimensions text correctly', () => {
    expect(getCardDimensionsText('poker')).toBe('Cards will be standard poker size (2.5" × 3.5" / 63mm × 88mm)');
    expect(getCardDimensionsText('tarot')).toBe('Cards will be larger tarot size (approximately 3.75" × 5.25" / 95mm × 133mm)');
    expect(getCardDimensionsText(undefined)).toBe('Cards will be larger tarot size (approximately 3.75" × 5.25" / 95mm × 133mm)');
  });

  it('should get current card size from deck', () => {
    const pokerDeck: Deck = {
      id: 'test-deck',
      name: 'Test Deck',
      meta: {
        cardSize: 'poker'
      },
      cards: []
    } as Deck;

    const tarotDeck: Deck = {
      id: 'test-deck-2',
      name: 'Test Deck 2',
      meta: {
        cardSize: 'tarot'
      },
      cards: []
    } as Deck;

    expect(getCurrentCardSize(pokerDeck)).toBe('poker');
    expect(getCurrentCardSize(tarotDeck)).toBe('tarot');
    expect(getCurrentCardSize(null)).toBeUndefined();
  });

  it('should handle closeDialog function', () => {
    // Mock HTMLDialogElement
    const mockDialog = {
      close: vi.fn()
    } as unknown as HTMLDialogElement;

    closeDialog(mockDialog);
    expect(mockDialog.close).toHaveBeenCalledOnce();

    // Should handle null dialog
    expect(() => closeDialog(null)).not.toThrow();
  });
});
