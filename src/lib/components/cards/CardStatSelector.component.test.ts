// CardStatSelector.component.test.ts - Integration test for CardStatSelector component

import { describe, it, expect } from 'vitest';
import type { CardStat, Portability, Card, Deck } from '$lib/types';
import {
  createCardStatSelectorState,
  getAreaNames,
  getLocationCards,
  formatLocationDisplay,
  initializeFormValues,
  createStatUpdate,
  createClearStatUpdate,
  processLocationInput,
  syncDisplayStat,
  type CardStatSelectorState,
  type LocationCard
} from './CardStatSelector.svelte.ts';

describe('CardStatSelector Component Integration', () => {
  it('should import all required extracted functions without errors', () => {
    // Verify all functions are available
    expect(createCardStatSelectorState).toBeDefined();
    expect(getAreaNames).toBeDefined();
    expect(getLocationCards).toBeDefined();
    expect(formatLocationDisplay).toBeDefined();
    expect(initializeFormValues).toBeDefined();
    expect(createStatUpdate).toBeDefined();
    expect(createClearStatUpdate).toBeDefined();
    expect(processLocationInput).toBeDefined();
    expect(syncDisplayStat).toBeDefined();
  });

  it('should create initial state correctly', () => {
    const initialStat: CardStat = {
      type: 'character',
      value: 'Adult'
    };

    const state = createCardStatSelectorState(initialStat);

    expect(state.dialogElement).toBeNull();
    expect(state.isDialogOpen).toBe(false);
    expect(state.formType).toBeUndefined();
    expect(state.formAge).toBe('');
    expect(state.formPortability).toBe('light');
    expect(state.formArea).toBe('');
    expect(state.displayStat).toEqual(initialStat);
  });

  it('should extract area names from deck', () => {
    const mockDeck: Deck = {
      id: 'test-deck',
      name: 'Test Deck',
      cards: [
        {
          id: '1',
          name: 'Card 1',
          type: 'location',
          stat: {
            type: 'location',
            value: { type: 'soft', value: 'Forest' }
          }
        },
        {
          id: '2', 
          name: 'Card 2',
          type: 'location',
          stat: {
            type: 'location',
            value: { type: 'soft', value: 'Mountain' }
          }
        },
        {
          id: '3',
          name: 'Card 3', 
          type: 'character',
          stat: {
            type: 'character',
            value: 'Young'
          }
        }
      ] as Card[]
    };

    const areaNames = getAreaNames(mockDeck);
    expect(areaNames).toEqual(['Forest', 'Mountain']);
  });

  it('should get location cards excluding current card', () => {
    const mockDeck: Deck = {
      id: 'test-deck',
      name: 'Test Deck', 
      cards: [
        {
          id: '1',
          name: 'Forest Location',
          type: 'location',
          stat: {
            type: 'location',
            value: { type: 'soft', value: 'Forest' }
          }
        },
        {
          id: '2',
          name: 'Current Card',
          type: 'location',
          stat: {
            type: 'location', 
            value: { type: 'soft', value: 'Plains' }
          }
        },
        {
          id: '3',
          name: 'Character Card',
          type: 'character'
        }
      ] as Card[]
    };

    const locationCards = getLocationCards(mockDeck, '2');
    expect(locationCards).toEqual([
      { id: '1', name: 'Forest Location' }
    ]);
  });

  it('should format location display correctly', () => {
    const locationCards: LocationCard[] = [
      { id: '1', name: 'Forest' },
      { id: '2', name: 'Mountain' }
    ];

    // Test soft link
    const softValue = { type: 'soft' as const, value: 'Plain Area' };
    expect(formatLocationDisplay(softValue, locationCards)).toBe('Plain Area');

    // Test hard link with existing card
    const hardValue = { type: 'hard' as const, value: '1' };
    expect(formatLocationDisplay(hardValue, locationCards)).toBe('📍 Forest');

    // Test hard link with non-existing card
    const hardValueMissing = { type: 'hard' as const, value: '99' };
    expect(formatLocationDisplay(hardValueMissing, locationCards)).toBe('99');
  });

  it('should initialize form values from card data', () => {
    const state = createCardStatSelectorState();

    // Test character card
    const characterCard: Card = {
      id: '1',
      name: 'Hero',
      type: 'character',
      stat: {
        type: 'character',
        value: 'Adult'
      }
    } as Card;

    const characterState = initializeFormValues(characterCard, state);
    expect(characterState.formType).toBe('character');
    expect(characterState.formAge).toBe('Adult');

    // Test item card
    const itemCard: Card = {
      id: '2',
      name: 'Sword',
      type: 'item',
      stat: {
        type: 'item',
        value: 'heavy'
      }
    } as Card;

    const itemState = initializeFormValues(itemCard, state);
    expect(itemState.formType).toBe('item');
    expect(itemState.formPortability).toBe('heavy');

    // Test location card with soft value
    const locationCard: Card = {
      id: '3',
      name: 'Forest',
      type: 'location',
      stat: {
        type: 'location',
        value: { type: 'soft', value: 'Deep Woods' }
      }
    } as Card;

    const locationState = initializeFormValues(locationCard, state);
    expect(locationState.formType).toBe('location');
    expect(locationState.formArea).toBe('Deep Woods');
  });

  it('should create stat updates correctly', () => {
    // Test character stat update
    const characterState: CardStatSelectorState = {
      ...createCardStatSelectorState(),
      formType: 'character',
      formAge: 'Young'
    };

    const characterUpdate = createStatUpdate(characterState);
    expect(characterUpdate.statUpdate).toEqual({
      type: 'character',
      value: 'Young'
    });
    expect(characterUpdate.updates).toEqual({
      type: 'character',
      stat: {
        type: 'character',
        value: 'Young'
      }
    });

    // Test item stat update
    const itemState: CardStatSelectorState = {
      ...createCardStatSelectorState(),
      formType: 'item',
      formPortability: 'medium'
    };

    const itemUpdate = createStatUpdate(itemState);
    expect(itemUpdate.statUpdate).toEqual({
      type: 'item',
      value: 'medium'
    });

    // Test location stat update
    const locationState: CardStatSelectorState = {
      ...createCardStatSelectorState(),
      formType: 'location',
      formArea: 'Mountain Peak'
    };

    const locationUpdate = createStatUpdate(locationState);
    expect(locationUpdate.statUpdate).toEqual({
      type: 'location',
      value: { type: 'soft', value: 'Mountain Peak' }
    });

    // Test undefined form type
    const undefinedState: CardStatSelectorState = {
      ...createCardStatSelectorState(),
      formType: undefined
    };

    const undefinedUpdate = createStatUpdate(undefinedState);
    expect(undefinedUpdate.statUpdate).toBeUndefined();
    expect(undefinedUpdate.updates).toEqual({
      type: 'character',
      stat: undefined
    });
  });

  it('should create clear stat update', () => {
    const clearUpdate = createClearStatUpdate();
    expect(clearUpdate.updates).toEqual({
      type: 'character',
      stat: undefined
    });
  });

  it('should process location input correctly', () => {
    const locationCards: LocationCard[] = [
      { id: '1', name: 'Forest' },
      { id: '2', name: 'Mountain' }
    ];

    // Test hard link input
    const hardLinkResult = processLocationInput('📍 Forest', locationCards);
    expect(hardLinkResult.isHardLink).toBe(true);
    expect(hardLinkResult.statUpdate).toEqual({
      type: 'location',
      value: { type: 'hard', value: '1' }
    });
    expect(hardLinkResult.updates).toEqual({
      type: 'location',
      stat: {
        type: 'location',
        value: { type: 'hard', value: '1' }
      }
    });

    // Test soft link input
    const softLinkResult = processLocationInput('Plain Area', locationCards);
    expect(softLinkResult.isHardLink).toBe(false);
    expect(softLinkResult.statUpdate).toBeUndefined();
    expect(softLinkResult.updates).toBeUndefined();

    // Test non-matching hard link input
    const nonMatchingResult = processLocationInput('📍 Desert', locationCards);
    expect(nonMatchingResult.isHardLink).toBe(false);
  });

  it('should sync display stat correctly', () => {
    const currentStat: CardStat = {
      type: 'character',
      value: 'Adult'
    };

    const newStat: CardStat = {
      type: 'character', 
      value: 'Elder'
    };

    // Test when stats are different
    const syncedStat = syncDisplayStat(newStat, currentStat);
    expect(syncedStat).toEqual(newStat);

    // Test when stats are the same
    const sameStat = syncDisplayStat(currentStat, currentStat);
    expect(sameStat).toEqual(currentStat);

    // Test with undefined values
    const syncedUndefined = syncDisplayStat(undefined, currentStat);
    expect(syncedUndefined).toBeUndefined();
  });
});
