// deckContext.ts
import { getContext, setContext } from 'svelte';
import type { Card, Deck } from '$lib/types';
import { currentDeck } from './deck';
import { updateCardProperty } from '$lib/db';
import { get } from 'svelte/store';
import { toasts } from './toast';

const DECK_CONTEXT_KEY = Symbol('deck-context');

type DeckContext = {
  updateCard: (cardId: string, property: keyof Card, value: any) => Promise<void>;
  updateCardFields: (cardId: string, updates: Partial<Card>) => Promise<void>;
};

export function createDeckContext() {

  const context: DeckContext = {
    updateCard: async (cardId: string, property: keyof Card, value: any) => {
      const deck = get(currentDeck);
      if (!deck) {
          toasts.error('No active deck to update.');
          return;
      };

      // Optimistic update: update store immediately
      const optimisticDeck = {
        ...deck,
        cards: deck.cards.map(c => 
          c.id === cardId ? { ...c, [property]: value } : c
        ),
        meta: {
          ...deck.meta,
          lastEdited: Date.now()
        }
      };
      currentDeck.set(optimisticDeck);

      // Update database in background
      try {
        await updateCardProperty(deck.id, cardId, property, value);
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        toasts.error(`Failed to update card: ${error}`);
        // Rollback on error
        currentDeck.set(deck);
      }
    },
    updateCardFields: async (cardId: string, updates: Partial<Card>) => {
      const deck = get(currentDeck);
      if (!deck) {
          toasts.error('No active deck to update.');
          return;
      };

      // Optimistic update: update store immediately with all changes
      const optimisticDeck = {
        ...deck,
        cards: deck.cards.map(c => 
          c.id === cardId ? { ...c, ...updates } : c
        ),
        meta: {
          ...deck.meta,
          lastEdited: Date.now()
        }
      };
      currentDeck.set(optimisticDeck);

      // Update database in background
      try {
        let currentDeck_forDB = deck;
        // Apply all updates in sequence to avoid race conditions
        for (const [property, value] of Object.entries(updates)) {
          currentDeck_forDB = await updateCardProperty(currentDeck_forDB.id, cardId, property as keyof Card, value);
        }
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        toasts.error(`Failed to update card: ${error}`);
        // Rollback on error
        currentDeck.set(deck);
      }
    }
  };

  setContext(DECK_CONTEXT_KEY, context);
  return context;
}

export function getDeckContext(): DeckContext {
  const context = getContext<DeckContext | undefined>(DECK_CONTEXT_KEY);
  if (!context) {
    throw new Error('DeckContext not found. Make sure createDeckContext() is called in a parent component.');
  }
  return context;
} 
