// canonUpdate.ts - The Canon Update Pattern
// Single source of truth updates with loading states

import { writable, get } from 'svelte/store';
import type { Card, Deck } from '$lib/types';
import { currentDeck, copyCardsTo } from './deck';
import { putDeck, deleteDeck as dbDeleteDeck } from '$lib/db';
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
export async function canonUpdateDeck(updates: Partial<Deck['meta']>, loadingFields: string[] = [], loadingMessage?: string, successMessage?: string): Promise<boolean> {
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
    await putDeck(updatedDeck, true); // Allow empty decks for theme/size changes
    currentDeck.set(updatedDeck); // Canon state update
    
    // Show success notification if provided
    if (successMessage) {
      toasts.success(successMessage);
    }
    
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
export async function canonUpdateCard(cardId: string, updates: Partial<Card>, loadingFields: string[] = [], loadingMessage?: string, successMessage?: string): Promise<boolean> {
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
    cards: deck.cards.map(c => {
      if (c.id === cardId) {
        const updatedCard = { ...c, ...updates };
        // Properly clone stats array if it exists
        if (updatedCard.stats) {
          updatedCard.stats = updatedCard.stats.map(stat => ({ ...stat }));
        }
        // Properly clone mechanics array if it exists
        if (updatedCard.mechanics) {
          updatedCard.mechanics = updatedCard.mechanics.map(mechanic => ({ ...mechanic }));
        }
        return updatedCard;
      }
      return c;
    }),
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    }
  };

  try {
    await putDeck(updatedDeck);
    currentDeck.set(updatedDeck); // Canon state update
    
    // Show success notification if provided
    if (successMessage) {
      toasts.success(successMessage);
    }
    
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
export async function canonUpdateCards(updates: Array<{ cardId: string; updates: Partial<Card> }>, loadingFields: string[] = [], loadingMessage?: string, successMessage?: string): Promise<boolean> {
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
      if (update) {
        const updatedCard = { ...card, ...update.updates };
        // Properly clone stats array if it exists
        if (updatedCard.stats) {
          updatedCard.stats = updatedCard.stats.map(stat => ({ ...stat }));
        }
        // Properly clone mechanics array if it exists
        if (updatedCard.mechanics) {
          updatedCard.mechanics = updatedCard.mechanics.map(mechanic => ({ ...mechanic }));
        }
        return updatedCard;
      }
      return card;
    }),
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    }
  };

  try {
    await putDeck(updatedDeck);
    currentDeck.set(updatedDeck); // Canon state update
    
    // Show success notification if provided
    if (successMessage) {
      toasts.success(successMessage);
    }
    
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    toasts.error(`Update failed: ${errorMsg}`);
    return false;
  } finally {
    setFieldLoading(false, loadingFields);
  }
}

// Canon Copy for cards
export async function canonCopyCards(cardIds: string[], targetDeckId: string | 'new', newDeckName?: string, loadingFields: string[] = [], loadingMessage?: string, successMessage?: string): Promise<boolean> {
  const deck = get(currentDeck);
  if (!deck) {
    toasts.error('No active deck to copy from');
    return false;
  }

  if (cardIds.length === 0) {
    toasts.error('No cards selected for copying');
    return false;
  }

  setFieldLoading(true, loadingFields, loadingMessage);

  try {
    // Get the cards to copy
    const cardsToCopy = deck.cards.filter(c => cardIds.includes(c.id));
    
    // Use the existing copyCardsTo function from deck store
    await copyCardsTo(cardsToCopy, targetDeckId, newDeckName);
    
    // Show success notification if provided
    if (successMessage) {
      toasts.success(successMessage);
    }
    
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    toasts.error(`Copy failed: ${errorMsg}`);
    return false;
  } finally {
    setFieldLoading(false, loadingFields);
  }
}

// Canon Delete for cards
export async function canonDeleteCards(cardIds: string[], loadingFields: string[] = [], loadingMessage?: string, successMessage?: string): Promise<boolean> {
  const deck = get(currentDeck);
  if (!deck) {
    toasts.error('No active deck to update');
    return false;
  }

  if (cardIds.length === 0) {
    toasts.error('No cards selected for deletion');
    return false;
  }

  setFieldLoading(true, loadingFields, loadingMessage);

  const updatedDeck: Deck = {
    ...deck,
    cards: deck.cards.filter(c => !cardIds.includes(c.id)),
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    }
  };

  try {
    await putDeck(updatedDeck);
    currentDeck.set(updatedDeck); // Canon state update
    
    // Show success notification if provided
    if (successMessage) {
      toasts.success(successMessage);
    }
    
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    toasts.error(`Delete failed: ${errorMsg}`);
    return false;
  } finally {
    setFieldLoading(false, loadingFields);
  }
}


// Canon Delete for deck
export async function canonDeleteDeck(deckId: string, loadingFields: string[] = [], loadingMessage?: string, successMessage?: string): Promise<boolean> {
  const deck = get(currentDeck);
  
  setFieldLoading(true, loadingFields, loadingMessage);

  try {
    await dbDeleteDeck(deckId);
    
    // If we're deleting the current deck, clear it
    if (deck?.id === deckId) {
      currentDeck.set(null);
    }
    
    // Show success notification if provided
    if (successMessage) {
      toasts.success(successMessage);
    }
    
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    toasts.error(`Delete failed: ${errorMsg}`);
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
    copyCards: canonCopyCards,
    deleteCards: canonDeleteCards,
    deleteDeck: canonDeleteDeck,
    isFieldLoading,
    loadingState: { subscribe: loadingState.subscribe }
  };
}
