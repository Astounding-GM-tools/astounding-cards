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
};

export function createDeckContext() {

  const context: DeckContext = {
    updateCard: async (cardId: string, property: keyof Card, value: any) => {
      const deck = get(currentDeck);
      if (!deck) {
          toasts.error('No active deck to update.');
          return;
      };

      try {
        const updatedDeck = await updateCardProperty(deck.id, cardId, property, value);
        currentDeck.set(updatedDeck); // Optimistic UI update
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        toasts.error(`Failed to update card: ${error}`);
        // Here you might want to reload the deck from DB to rollback the UI
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
