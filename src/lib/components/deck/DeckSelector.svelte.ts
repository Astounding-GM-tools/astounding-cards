import type { Deck, CardSize } from '$lib/types';

/**
 * State interface for DeckSelector component
 */
export interface DeckSelectorState {
  showThemeSelect: boolean;
  showNewDeckDialog: boolean;
  newDeckName: string;
}

/**
 * Creates initial state for the DeckSelector component
 */
export function createDeckSelectorState(): DeckSelectorState {
  return {
    showThemeSelect: false,
    showNewDeckDialog: false,
    newDeckName: ''
  };
}

/**
 * Handles keyboard events for the new deck dialog
 * @param event The keyboard event
 * @param newDeckName Current deck name value
 * @param handlers Object with callback functions
 */
export function handleDeckDialogKeydown(
  event: KeyboardEvent,
  newDeckName: string,
  handlers: {
    onEnter: () => void;
    onEscape: () => void;
  }
) {
  if (event.key === 'Enter' && newDeckName.trim()) {
    handlers.onEnter();
  } else if (event.key === 'Escape') {
    handlers.onEscape();
  }
}

/**
 * Creates a new deck object with default values
 * @param name The deck name
 * @returns A new deck object
 */
export function createNewDeckObject(name: string): Deck {
  return {
    id: crypto.randomUUID(),
    meta: {
      name: name.trim(),
      theme: 'classic',
      cardSize: 'poker' as CardSize,
      lastEdited: Date.now(),
      createdAt: Date.now()
    },
    cards: []  // Initialize with empty array of cards
  };
}

/**
 * Sorts decks by last edited date (most recent first)
 * @param decks Array of decks to sort
 * @returns Sorted array of decks
 */
export function sortDecksByLastEdited(decks: Deck[]): Deck[] {
  return [...decks].sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
}

/**
 * Gets card size display information
 * @param cardSize The card size
 * @returns Display information for the card size
 */
export function getCardSizeInfo(cardSize: CardSize): string {
  return cardSize === 'poker' 
    ? 'Standard playing card size, 9 cards per page'
    : 'Larger cards with more readable text, 4 cards per page';
}

/**
 * Resets the new deck dialog state
 * @param state Current state
 * @returns Updated state with dialog reset
 */
export function resetNewDeckDialog(state: DeckSelectorState): DeckSelectorState {
  return {
    ...state,
    showNewDeckDialog: false,
    newDeckName: ''
  };
}

/**
 * Opens the new deck dialog
 * @param state Current state
 * @returns Updated state with dialog opened
 */
export function openNewDeckDialog(state: DeckSelectorState): DeckSelectorState {
  return {
    ...state,
    showNewDeckDialog: true
  };
}

/**
 * Toggles the theme selector
 * @param state Current state
 * @param show Whether to show the theme selector
 * @returns Updated state
 */
export function setThemeSelectVisible(state: DeckSelectorState, show: boolean): DeckSelectorState {
  return {
    ...state,
    showThemeSelect: show
  };
}

/**
 * Updates the new deck name
 * @param state Current state
 * @param name New deck name
 * @returns Updated state
 */
export function updateNewDeckName(state: DeckSelectorState, name: string): DeckSelectorState {
  return {
    ...state,
    newDeckName: name
  };
}
