// canonUpdate.ts - The Canon Update Pattern
// Single source of truth updates with loading states

import { writable, get } from 'svelte/store';
import type { Card, Deck } from '$lib/types';
import { currentDeck } from './deck';
import { putDeck } from '$lib/db';
import { toasts } from './toast';

// Loading state management
type LoadingState = {
  isLoading: boolean;
  fields: Set<string>;
  message?: string;
};

export const loadingState = writable<LoadingState>({
  isLoading: false,
  fields: new Set(),
  message: undefined
});

// Set loading state for specific fields
export function setFieldLoading(loading: boolean, fields: string[] = [], message?: string) {
  loadingState.update(state => {
    const newFields = new Set(state.fields);
    
    if (loading) {
      fields.forEach(field => newFields.add(field));
    } else {
      fields.forEach(field => newFields.delete(field));
    }
    
    return {
      isLoading: newFields.size > 0,
      fields: newFields,
      message: loading ? message : undefined
    };
  });
}

// Check if a specific field is loading
export function isFieldLoading(field: string): boolean {
  return get(loadingState).fields.has(field);
}

// Canon Update for deck metadata
export async function canonUpdateDeck(updates: Partial<Deck['meta']>, loadingFields: string[] = [], loadingMessage?: string): Promise<boolean> {
  const deck = get(currentDeck);
  if (!deck) {
    toasts.error('No active deck to update');
    return false;
  }

  setFieldLoading(true, loadingFields, loadingMessage);

  const updatedDeck: Deck = {
    ...deck,
    meta: {
      ...deck.meta,
      ...updates,
      lastEdited: Date.now()
    }
  };

  try {
    await putDeck(updatedDeck);
    currentDeck.set(updatedDeck); // Canon state update
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    toasts.error(`Update failed: ${errorMsg}`);
    return false;
  } finally {
    setFieldLoading(false, loadingFields);
  }
}

// Canon Update for single card
export async function canonUpdateCard(cardId: string, updates: Partial<Card>, loadingFields: string[] = [], loadingMessage?: string): Promise<boolean> {
  const deck = get(currentDeck);
  if (!deck) {
    toasts.error('No active deck to update');
    return false;
  }

  const cardExists = deck.cards.some(c => c.id === cardId);
  if (!cardExists) {
    toasts.error('Card not found');
    return false;
  }

  setFieldLoading(true, loadingFields, loadingMessage);

  const updatedDeck: Deck = {
    ...deck,
    cards: deck.cards.map(c => 
      c.id === cardId ? { ...c, ...updates } : c
    ),
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    }
  };

  try {
    await putDeck(updatedDeck);
    currentDeck.set(updatedDeck); // Canon state update
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    toasts.error(`Update failed: ${errorMsg}`);
    return false;
  } finally {
    setFieldLoading(false, loadingFields);
  }
}

// Canon Update for multiple cards
export async function canonUpdateCards(updates: Array<{ cardId: string; updates: Partial<Card> }>, loadingFields: string[] = [], loadingMessage?: string): Promise<boolean> {
  const deck = get(currentDeck);
  if (!deck) {
    toasts.error('No active deck to update');
    return false;
  }

  setFieldLoading(true, loadingFields, loadingMessage);

  const updatedDeck: Deck = {
    ...deck,
    cards: deck.cards.map(card => {
      const update = updates.find(u => u.cardId === card.id);
      return update ? { ...card, ...update.updates } : card;
    }),
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    }
  };

  try {
    await putDeck(updatedDeck);
    currentDeck.set(updatedDeck); // Canon state update
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    toasts.error(`Update failed: ${errorMsg}`);
    return false;
  } finally {
    setFieldLoading(false, loadingFields);
  }
}

// Utility to create a canon update context for components
export function createCanonUpdateContext() {
  return {
    updateDeck: canonUpdateDeck,
    updateCard: canonUpdateCard,
    updateCards: canonUpdateCards,
    isFieldLoading,
    loadingState: { subscribe: loadingState.subscribe }
  };
}
