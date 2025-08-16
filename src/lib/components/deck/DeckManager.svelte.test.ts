import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initializeDeckManagerState,
  toggleCardSelection,
  selectAllCards,
  selectNoCards,
  validateDeckName,
  generateDuplicateName,
  createThemeUpdateParams,
  validateCopyCardsParams,
  validateThemeChangeParams,
  createCardOperationMessage,
  formatDate,
  formatDateTime,
  resetDeckManagerState,
  updateDeckManagerState,
  hasSelectedCards,
  getSelectedCards,
  findMostRecentDeck,
  generateVocabularyConfigName,
  generateVocabularyConfigDescription,
  validateVocabularySave,
  createCardSelectionState,
  deckHasCards,
  getSelectedCardCount,
  areAllCardsSelected,
  areSomeCardsSelected,
  type DeckManagerState,
  type CopyCardsParams,
  type ThemeChangeParams
} from './DeckManager.svelte.js';
import type { Card, Deck, StatblockVocabulary } from '$lib/types';

describe('DeckManager Logic', () => {
  let mockDeck: Deck;
  let mockCards: Card[];

  beforeEach(() => {
    mockCards = [
      { id: 'card1', name: 'Card 1', role: 'Role 1', image: null, desc: 'Desc 1', type: 'character', traits: [], secrets: [], stat: { type: 'character', value: '' } } as Card,
      { id: 'card2', name: 'Card 2', role: 'Role 2', image: null, desc: 'Desc 2', type: 'character', traits: [], secrets: [], stat: { type: 'character', value: '' } } as Card,
      { id: 'card3', name: 'Card 3', role: 'Role 3', image: null, desc: 'Desc 3', type: 'character', traits: [], secrets: [], stat: { type: 'character', value: '' } } as Card
    ];

    mockDeck = {
      id: 'deck1',
      meta: {
        name: 'Test Deck',
        theme: 'classic',
        cardSize: 'poker',
        lastEdited: Date.now(),
        createdAt: Date.now()
      },
      cards: mockCards
    };
  });

  describe('initializeDeckManagerState', () => {
    it('returns default state with empty values', () => {
      const state = initializeDeckManagerState();
      
      expect(state).toEqual({
        selectedCardIds: [],
        targetDeckId: 'new',
        newDeckName: '',
        editedDeckName: '',
        selectedThemeForCards: ''
      });
    });
  });

  describe('toggleCardSelection', () => {
    it('adds card to empty selection', () => {
      const result = toggleCardSelection([], 'card1');
      expect(result).toEqual(['card1']);
    });

    it('adds card to existing selection', () => {
      const result = toggleCardSelection(['card1'], 'card2');
      expect(result).toEqual(['card1', 'card2']);
    });

    it('removes card from selection', () => {
      const result = toggleCardSelection(['card1', 'card2'], 'card1');
      expect(result).toEqual(['card2']);
    });

    it('removes card from middle of selection', () => {
      const result = toggleCardSelection(['card1', 'card2', 'card3'], 'card2');
      expect(result).toEqual(['card1', 'card3']);
    });

    it('does not modify original selection array', () => {
      const original = ['card1'];
      const result = toggleCardSelection(original, 'card2');
      
      expect(original).toEqual(['card1']);
      expect(result).toEqual(['card1', 'card2']);
    });
  });

  describe('selectAllCards', () => {
    it('returns all card IDs from deck', () => {
      const result = selectAllCards(mockCards);
      expect(result).toEqual(['card1', 'card2', 'card3']);
    });

    it('handles empty card array', () => {
      const result = selectAllCards([]);
      expect(result).toEqual([]);
    });

    it('works with single card', () => {
      const result = selectAllCards([mockCards[0]]);
      expect(result).toEqual(['card1']);
    });
  });

  describe('selectNoCards', () => {
    it('returns empty array', () => {
      const result = selectNoCards();
      expect(result).toEqual([]);
    });
  });

  describe('validateDeckName', () => {
    it('accepts valid deck name', () => {
      const result = validateDeckName('Valid Deck Name');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects empty name', () => {
      const result = validateDeckName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Deck name cannot be empty');
    });

    it('rejects whitespace only name', () => {
      const result = validateDeckName('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Deck name cannot be empty');
    });

    it('rejects name too short', () => {
      const result = validateDeckName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Deck name must be at least 2 characters');
    });

    it('rejects name too long', () => {
      const longName = 'A'.repeat(101);
      const result = validateDeckName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Deck name cannot exceed 100 characters');
    });

    it('accepts name at minimum length', () => {
      const result = validateDeckName('AB');
      expect(result.isValid).toBe(true);
    });

    it('accepts name at maximum length', () => {
      const maxName = 'A'.repeat(100);
      const result = validateDeckName(maxName);
      expect(result.isValid).toBe(true);
    });

    it('trims whitespace before validation', () => {
      const result = validateDeckName('  Valid Name  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('generateDuplicateName', () => {
    it('appends (Copy) to original name', () => {
      const result = generateDuplicateName('My Deck');
      expect(result).toBe('My Deck (Copy)');
    });

    it('handles empty name', () => {
      const result = generateDuplicateName('');
      expect(result).toBe(' (Copy)');
    });

    it('handles name with existing (Copy)', () => {
      const result = generateDuplicateName('My Deck (Copy)');
      expect(result).toBe('My Deck (Copy) (Copy)');
    });
  });

  describe('createThemeUpdateParams', () => {
    it('creates update params for multiple cards', () => {
      const result = createThemeUpdateParams(['card1', 'card2'], 'dark');
      expect(result).toEqual([
        { cardId: 'card1', updates: { theme: 'dark' } },
        { cardId: 'card2', updates: { theme: 'dark' } }
      ]);
    });

    it('handles empty card array', () => {
      const result = createThemeUpdateParams([], 'dark');
      expect(result).toEqual([]);
    });

    it('handles single card', () => {
      const result = createThemeUpdateParams(['card1'], 'light');
      expect(result).toEqual([
        { cardId: 'card1', updates: { theme: 'light' } }
      ]);
    });
  });

  describe('validateCopyCardsParams', () => {
    it('validates successful copy to existing deck', () => {
      const params: CopyCardsParams = {
        cardIds: ['card1', 'card2'],
        targetDeckId: 'existing-deck'
      };
      
      const result = validateCopyCardsParams(params);
      expect(result.isValid).toBe(true);
    });

    it('validates successful copy to new deck', () => {
      const params: CopyCardsParams = {
        cardIds: ['card1'],
        targetDeckId: 'new',
        newDeckName: 'New Deck Name'
      };
      
      const result = validateCopyCardsParams(params);
      expect(result.isValid).toBe(true);
    });

    it('rejects empty card selection', () => {
      const params: CopyCardsParams = {
        cardIds: [],
        targetDeckId: 'existing-deck'
      };
      
      const result = validateCopyCardsParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No cards selected for copying');
    });

    it('rejects new deck without name', () => {
      const params: CopyCardsParams = {
        cardIds: ['card1'],
        targetDeckId: 'new'
      };
      
      const result = validateCopyCardsParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a name for the new deck');
    });

    it('rejects new deck with empty name', () => {
      const params: CopyCardsParams = {
        cardIds: ['card1'],
        targetDeckId: 'new',
        newDeckName: '   '
      };
      
      const result = validateCopyCardsParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a name for the new deck');
    });

    it('rejects new deck with invalid name', () => {
      const params: CopyCardsParams = {
        cardIds: ['card1'],
        targetDeckId: 'new',
        newDeckName: 'A'
      };
      
      const result = validateCopyCardsParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Deck name must be at least 2 characters');
    });
  });

  describe('validateThemeChangeParams', () => {
    it('validates successful theme change', () => {
      const params: ThemeChangeParams = {
        cardIds: ['card1', 'card2'],
        themeId: 'dark'
      };
      
      const result = validateThemeChangeParams(params);
      expect(result.isValid).toBe(true);
    });

    it('rejects empty card selection', () => {
      const params: ThemeChangeParams = {
        cardIds: [],
        themeId: 'dark'
      };
      
      const result = validateThemeChangeParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No cards selected for theme change');
    });

    it('rejects empty theme ID', () => {
      const params: ThemeChangeParams = {
        cardIds: ['card1'],
        themeId: ''
      };
      
      const result = validateThemeChangeParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please select a theme');
    });

    it('rejects whitespace-only theme ID', () => {
      const params: ThemeChangeParams = {
        cardIds: ['card1'],
        themeId: '   '
      };
      
      const result = validateThemeChangeParams(params);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please select a theme');
    });
  });

  describe('createCardOperationMessage', () => {
    it('creates message for copying single card', () => {
      const result = createCardOperationMessage('copied', 1);
      expect(result).toBe('Copied 1 card successfully');
    });

    it('creates message for copying multiple cards', () => {
      const result = createCardOperationMessage('copied', 3);
      expect(result).toBe('Copied 3 cards successfully');
    });

    it('creates message for deleting single card', () => {
      const result = createCardOperationMessage('deleted', 1);
      expect(result).toBe('Deleted 1 card successfully');
    });

    it('creates message for deleting multiple cards', () => {
      const result = createCardOperationMessage('deleted', 5);
      expect(result).toBe('Deleted 5 cards successfully');
    });

    it('creates message for updating cards', () => {
      const result = createCardOperationMessage('updated', 2);
      expect(result).toBe('Updated 2 cards successfully');
    });
  });

  describe('formatDate', () => {
    const mockTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC

    it('formats date with default locale', () => {
      const result = formatDate(mockTimestamp, 'en-US');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/); // MM/DD/YYYY or similar
    });

    it('formats date with specified locale', () => {
      const result = formatDate(mockTimestamp, 'en-GB');
      expect(typeof result).toBe('string');
      expect(result).toContain('2022');
    });

    it('handles current timestamp', () => {
      const now = Date.now();
      const result = formatDate(now);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatDateTime', () => {
    const mockTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC

    it('formats datetime with default locale', () => {
      const result = formatDateTime(mockTimestamp, 'en-US');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/(2022|22)/); // Accept either full year or short year format
    });

    it('formats datetime with specified locale', () => {
      const result = formatDateTime(mockTimestamp, 'en-GB');
      expect(typeof result).toBe('string');
      expect(result).toContain('2022');
    });
  });

  describe('resetDeckManagerState', () => {
    it('resets state to defaults while preserving editedDeckName', () => {
      const state: DeckManagerState = {
        selectedCardIds: ['card1', 'card2'],
        targetDeckId: 'existing-deck',
        newDeckName: 'Some Name',
        editedDeckName: 'Edited Name',
        selectedThemeForCards: 'dark'
      };

      const result = resetDeckManagerState(state);
      
      expect(result).toEqual({
        selectedCardIds: [],
        targetDeckId: 'new',
        newDeckName: '',
        editedDeckName: 'Edited Name',
        selectedThemeForCards: ''
      });
    });
  });

  describe('updateDeckManagerState', () => {
    it('updates state with partial values', () => {
      const state = initializeDeckManagerState();
      const updates = { selectedCardIds: ['card1'], newDeckName: 'New Name' };
      
      const result = updateDeckManagerState(state, updates);
      
      expect(result).toEqual({
        selectedCardIds: ['card1'],
        targetDeckId: 'new',
        newDeckName: 'New Name',
        editedDeckName: '',
        selectedThemeForCards: ''
      });
    });

    it('does not modify original state', () => {
      const state = initializeDeckManagerState();
      const updates = { selectedCardIds: ['card1'] };
      
      updateDeckManagerState(state, updates);
      
      expect(state.selectedCardIds).toEqual([]);
    });
  });

  describe('hasSelectedCards', () => {
    it('returns true for non-empty selection', () => {
      expect(hasSelectedCards(['card1'])).toBe(true);
      expect(hasSelectedCards(['card1', 'card2'])).toBe(true);
    });

    it('returns false for empty selection', () => {
      expect(hasSelectedCards([])).toBe(false);
    });
  });

  describe('getSelectedCards', () => {
    it('returns selected cards from deck', () => {
      const result = getSelectedCards(mockDeck, ['card1', 'card3']);
      expect(result).toEqual([mockCards[0], mockCards[2]]);
    });

    it('returns empty array for no selection', () => {
      const result = getSelectedCards(mockDeck, []);
      expect(result).toEqual([]);
    });

    it('handles non-existent card IDs gracefully', () => {
      const result = getSelectedCards(mockDeck, ['card1', 'non-existent']);
      expect(result).toEqual([mockCards[0]]);
    });
  });

  describe('findMostRecentDeck', () => {
    it('finds most recently edited deck', () => {
      const decks: Deck[] = [
        { ...mockDeck, id: 'deck1', meta: { ...mockDeck.meta, lastEdited: 1000 } },
        { ...mockDeck, id: 'deck2', meta: { ...mockDeck.meta, lastEdited: 3000 } },
        { ...mockDeck, id: 'deck3', meta: { ...mockDeck.meta, lastEdited: 2000 } }
      ];

      const result = findMostRecentDeck(decks);
      expect(result?.id).toBe('deck2');
    });

    it('handles empty deck list', () => {
      const result = findMostRecentDeck([]);
      expect(result).toBeNull();
    });

    it('handles single deck', () => {
      const result = findMostRecentDeck([mockDeck]);
      expect(result).toBe(mockDeck);
    });
  });

  describe('generateVocabularyConfigName', () => {
    it('generates config name from deck name', () => {
      const result = generateVocabularyConfigName('My Deck');
      expect(result).toBe('My Deck Custom Vocabulary');
    });

    it('handles empty deck name', () => {
      const result = generateVocabularyConfigName('');
      expect(result).toBe(' Custom Vocabulary');
    });
  });

  describe('generateVocabularyConfigDescription', () => {
    it('generates config description from deck name', () => {
      const result = generateVocabularyConfigDescription('My Deck');
      expect(result).toBe('Custom vocabulary for My Deck');
    });

    it('handles empty deck name', () => {
      const result = generateVocabularyConfigDescription('');
      expect(result).toBe('Custom vocabulary for ');
    });
  });

  describe('validateVocabularySave', () => {
    it('validates good vocabulary', () => {
      const vocab: StatblockVocabulary = {
        health: 'Health',
        attack: 'Attack',
        defense: 'Defense'
      };
      
      const result = validateVocabularySave(vocab);
      expect(result.isValid).toBe(true);
    });

    it('rejects null vocabulary', () => {
      const result = validateVocabularySave(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid vocabulary data');
    });

    it('rejects non-object vocabulary', () => {
      const result = validateVocabularySave('not an object' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid vocabulary data');
    });

    it('rejects empty vocabulary', () => {
      const result = validateVocabularySave({});
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Vocabulary cannot be empty');
    });

    it('rejects vocabulary with duplicate values', () => {
      const vocab: StatblockVocabulary = {
        health: 'Power',
        attack: 'Power',
        defense: 'Shield'
      };
      
      const result = validateVocabularySave(vocab);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Vocabulary contains duplicate stat names');
    });

    it('rejects vocabulary with case-insensitive duplicates', () => {
      const vocab: StatblockVocabulary = {
        health: 'Power',
        attack: 'POWER',
        defense: 'Shield'
      };
      
      const result = validateVocabularySave(vocab);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Vocabulary contains duplicate stat names');
    });

    it('ignores empty values in duplicate check', () => {
      const vocab: StatblockVocabulary = {
        health: 'Health',
        attack: '',
        defense: '',
        custom: 'Custom'
      };
      
      const result = validateVocabularySave(vocab);
      expect(result.isValid).toBe(true);
    });
  });

  describe('createCardSelectionState', () => {
    it('creates default card selection state', () => {
      const result = createCardSelectionState();
      expect(result).toEqual({ selectedCardIds: [] });
    });
  });

  describe('deckHasCards', () => {
    it('returns true for deck with cards', () => {
      expect(deckHasCards(mockDeck)).toBe(true);
    });

    it('returns false for empty deck', () => {
      const emptyDeck = { ...mockDeck, cards: [] };
      expect(deckHasCards(emptyDeck)).toBe(false);
    });
  });

  describe('getSelectedCardCount', () => {
    it('returns count of selected cards', () => {
      expect(getSelectedCardCount(['card1', 'card2', 'card3'])).toBe(3);
      expect(getSelectedCardCount(['card1'])).toBe(1);
      expect(getSelectedCardCount([])).toBe(0);
    });
  });

  describe('areAllCardsSelected', () => {
    it('returns true when all cards are selected', () => {
      const result = areAllCardsSelected(mockDeck, ['card1', 'card2', 'card3']);
      expect(result).toBe(true);
    });

    it('returns false when some cards are selected', () => {
      const result = areAllCardsSelected(mockDeck, ['card1', 'card2']);
      expect(result).toBe(false);
    });

    it('returns false when no cards are selected', () => {
      const result = areAllCardsSelected(mockDeck, []);
      expect(result).toBe(false);
    });

    it('returns false for empty deck', () => {
      const emptyDeck = { ...mockDeck, cards: [] };
      const result = areAllCardsSelected(emptyDeck, []);
      expect(result).toBe(false);
    });
  });

  describe('areSomeCardsSelected', () => {
    it('returns true when some (but not all) cards are selected', () => {
      const result = areSomeCardsSelected(mockDeck, ['card1', 'card2']);
      expect(result).toBe(true);
    });

    it('returns false when all cards are selected', () => {
      const result = areSomeCardsSelected(mockDeck, ['card1', 'card2', 'card3']);
      expect(result).toBe(false);
    });

    it('returns false when no cards are selected', () => {
      const result = areSomeCardsSelected(mockDeck, []);
      expect(result).toBe(false);
    });

    it('returns false for single-card deck with card selected', () => {
      const singleCardDeck = { ...mockDeck, cards: [mockCards[0]] };
      const result = areSomeCardsSelected(singleCardDeck, ['card1']);
      expect(result).toBe(false);
    });
  });
});
