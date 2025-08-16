// CardStatSelector.svelte.ts - Extracted logic for CardStatSelector component

import type { CardStat, Portability, Card, Deck } from '$lib/types';

// === Type Definitions ===

export interface CardStatSelectorState {
  dialogElement: HTMLDialogElement | null;
  isDialogOpen: boolean;
  formType: 'character' | 'item' | 'location' | undefined;
  formAge: string;
  formPortability: Portability;
  formArea: string;
  displayStat: CardStat | undefined;
}

export interface LocationCard {
  id: string;
  name: string;
}

// === State Management ===

/**
 * Creates the initial state for CardStatSelector component
 */
export function createCardStatSelectorState(initialStat?: CardStat): CardStatSelectorState {
  return {
    dialogElement: null,
    isDialogOpen: false,
    formType: undefined,
    formAge: '',
    formPortability: 'light',
    formArea: '',
    displayStat: initialStat
  };
}

// === Data Processing Functions ===

/**
 * Extracts unique area names from deck cards with soft location stats
 */
export function getAreaNames(deck: Deck | null): string[] {
  if (!deck?.cards) return [];
  
  const areaNames = [...new Set(
    deck.cards
      .map(c => c.stat?.type === 'location' && c.stat.value.type === 'soft' ? c.stat.value.value : null)
      .filter((name): name is string => name !== null)
  )];
  
  return areaNames;
}

/**
 * Gets location cards (excluding current card) for linking purposes
 */
export function getLocationCards(deck: Deck | null, currentCardId: string): LocationCard[] {
  if (!deck?.cards) return [];
  
  return deck.cards
    .filter(c => c.stat?.type === 'location' && c.id !== currentCardId)
    .map(c => ({ id: c.id, name: c.name }));
}

/**
 * Formats location display value with appropriate formatting
 */
export function formatLocationDisplay(value: { type: 'hard' | 'soft', value: string }, locationCards: LocationCard[]): string {
  if (value.type === 'hard') {
    const card = locationCards.find(c => c.id === value.value);
    return card ? `📍 ${card.name}` : value.value;
  }
  return value.value;
}

// === Form Management Functions ===

/**
 * Initializes form values based on card data
 */
export function initializeFormValues(
  card: Card,
  state: CardStatSelectorState
): CardStatSelectorState {
  const newState = { ...state };
  
  // Set form type based on card type
  newState.formType = card.type as 'character' | 'item' | 'location';
  
  // Initialize form values from current stat
  if (card.stat?.type === 'character') {
    newState.formAge = card.stat.value;
  } else if (card.stat?.type === 'item') {
    newState.formPortability = card.stat.value;
  } else if (card.stat?.type === 'location') {
    if (card.stat.value.type === 'soft') {
      newState.formArea = card.stat.value.value;
    } else if (card.stat.value.type === 'hard') {
      // For hard links, show the formatted display with the pin icon
      const locationCards = getLocationCards({ 
        id: 'temp', 
        cards: [], 
        meta: { 
          name: 'temp', 
          theme: 'classic', 
          cardSize: 'poker', 
          lastEdited: 0, 
          createdAt: 0 
        } 
      } as Deck, card.id);
      newState.formArea = formatLocationDisplay(card.stat.value, locationCards);
    }
  }
  
  return newState;
}

/**
 * Creates stat update object based on form type and values
 */
export function createStatUpdate(state: CardStatSelectorState): {
  statUpdate: CardStat | undefined;
  updates: Partial<Card>;
} {
  if (!state.formType) {
    return {
      statUpdate: undefined,
      updates: {
        type: 'character',
        stat: undefined
      }
    };
  }

  let statUpdate: CardStat;
  
  if (state.formType === 'location') {
    statUpdate = {
      statId: 'area',
      value: { type: 'soft', value: state.formArea }
    } as any;
  } else if (state.formType === 'character') {
    statUpdate = { statId: 'age', value: state.formAge } as any;
  } else {
    statUpdate = { statId: 'portability', value: state.formPortability } as any;
  }

  return {
    statUpdate,
    updates: {
      type: state.formType,
      stat: statUpdate as any
    }
  };
}

/**
 * Creates clear stat update object
 */
export function createClearStatUpdate(): { updates: Partial<Card> } {
  return {
    updates: {
      type: 'character' as const,
      stat: undefined
    }
  };
}

// === Location Input Handling ===

/**
 * Processes location input and determines if it's a hard link to another location card
 */
export function processLocationInput(
  value: string,
  locationCards: LocationCard[]
): {
  isHardLink: boolean;
  statUpdate?: CardStat;
  updates?: Partial<Card>;
} {
  if (value.startsWith('📍 ')) {
    const locationCard = locationCards.find(c => `📍 ${c.name}` === value);
    if (locationCard) {
      const statUpdate = {
        statId: 'area',
        value: { type: 'hard' as const, value: locationCard.id }
      } as any;
      
      const updates = {
        type: 'location' as const,
        stat: statUpdate as any
      };
      
      return {
        isHardLink: true,
        statUpdate,
        updates
      };
    }
  }
  
  return { isHardLink: false };
}

// === Synchronization Functions ===

/**
 * Converts a legacy stat to the new format
 */
function convertLegacyStatToNew(stat: LegacyCardStat): CardStat {
  switch (stat.type) {
    case 'character':
      return { statId: 'age', value: stat.value };
    case 'item':
      return { statId: 'portability', value: stat.value };
    case 'location':
      return { statId: 'area', value: stat.value };
  }
}

/**
 * Syncs display stat with store updates
 */
export function syncDisplayStat(
  currentStoreStat: LegacyCardStat | undefined,
  currentDisplayStat: CardStat | undefined
): CardStat | undefined {
  if (!currentStoreStat) return undefined;
  
  const newStat = convertLegacyStatToNew(currentStoreStat);
  if (JSON.stringify(newStat) !== JSON.stringify(currentDisplayStat)) {
    return newStat;
  }
  return currentDisplayStat;
}
