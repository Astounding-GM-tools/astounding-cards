// deckContext.ts
import { getContext, setContext } from 'svelte';
import type { Card } from '$lib/types';
import { currentDeck, updateCardProperty } from './deck';
import { derived, get } from 'svelte/store';

const DECK_CONTEXT_KEY = Symbol('deck');

type DeckContext = {
  updateCard: (cardId: string, property: keyof Card, value: any) => Promise<void>;
};

export function createDeckContext() {
  const deckId = derived(currentDeck, $deck => $deck?.id);

  const context: DeckContext = {
    updateCard: async (cardId: string, property: keyof Card, value: any) => {
      const id = get(deckId);
      if (!id) throw new Error('No deck selected');
      await updateCardProperty(id, cardId, property, value);
    }
  };

  setContext(DECK_CONTEXT_KEY, context);
  return context;
}

export function getDeckContext(): DeckContext {
  return getContext(DECK_CONTEXT_KEY);
} 