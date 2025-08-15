// Logic for DeckList component
import type { Deck } from '$lib/types';
import type { DeckListStore } from '$lib/stores/deckList';

/**
 * Sort decks by last edited date (most recent first)
 */
export function sortDecksByLastEdited(decks: Deck[]): Deck[] {
  return [...decks].sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
}

/**
 * Create deck change handler
 */
export function createDeckChangeHandler(deckList: DeckListStore) {
  return async function handleDeckChange(event: CustomEvent<{ action: string, deckId: string }>) {
    // For all actions, reload the deck list from the database
    await deckList.load();
  };
}
