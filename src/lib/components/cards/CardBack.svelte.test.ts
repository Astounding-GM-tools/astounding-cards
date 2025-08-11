import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initializeCardBackState,
  updateCardBackState,
  resetDialogs,
  getCardData,
  resolveActiveTheme,
  validateCardName,
  validateCardDescription,
  validateSecrets,
  processNameBlur,
  processDescriptionBlur,
  processSecretsBlur,
  contentHasChanged,
  prepareTemplateDialog,
  applyTemplateWithVocabulary,
  createTemplateHandler,
  addSecretToArray,
  formatSecretsForDisplay,
  parseSecretsFromHtml,
  validateMechanics,
  mechanicsHaveChanged,
  showMechanicsDialog,
  hideMechanicsDialog,
  showTemplateDialog,
  hideTemplateDialog,
  prepareUpdatePayload,
  createFieldUpdateHandler,
  isEditable,
  getContentEditableState,
  shouldDisableElement,
  type CardBackState,
  type ContentValidationResult,
  type TemplateApplicationOptions
} from './CardBack.logic.js';
import type { Card, CardMechanic } from '$lib/types';
import type { StatblockTemplate } from '$lib/statblockTemplates';

describe('CardBack Pure Logic', () => {
  let mockCard: Card;
  let mockDeckCards: Card[];
  let mockTemplate: StatblockTemplate;
  let mockMechanics: CardMechanic[];

  beforeEach(() => {
    mockCard = {
      id: 'test-card',
      name: 'Test Card',
      desc: 'Test description',
      imageUrl: '',
      stats: [],
      mechanics: [],
      secrets: []
    };

    mockDeckCards = [
      mockCard,
      {
        id: 'other-card',
        name: 'Other Card',
        desc: 'Other description',
        imageUrl: '',
        stats: [],
        mechanics: [],
        secrets: []
      }
    ];

    mockTemplate = {
      id: 'test-template',
      name: 'Test Template',
      description: 'Test template description',
      cardType: 'character',
      mechanics: [
        {
          name: 'Test Mechanic',
          description: 'Test mechanic description',
          cost: '',
          tags: []
        }
      ]
    };

    mockMechanics = [
      {
        name: 'Test Mechanic',
        description: 'Test description',
        cost: '1',
        tags: ['test']
      }
    ];
  });

  describe('initializeCardBackState', () => {
    it('returns initial state with all dialogs closed', () => {
      const state = initializeCardBackState();
      
      expect(state).toEqual({
        showMechanicsDialog: false,
        showTemplateDialog: false,
        templateDialogCardType: ''
      });
    });
  });

  describe('updateCardBackState', () => {
    it('updates state with partial values', () => {
      const state = initializeCardBackState();
      const updates = { showMechanicsDialog: true, templateDialogCardType: 'character' };
      
      const newState = updateCardBackState(state, updates);
      
      expect(newState.showMechanicsDialog).toBe(true);
      expect(newState.templateDialogCardType).toBe('character');
      expect(newState.showTemplateDialog).toBe(false); // Unchanged
    });

    it('does not modify original state', () => {
      const state = initializeCardBackState();
      updateCardBackState(state, { showMechanicsDialog: true });
      
      expect(state.showMechanicsDialog).toBe(false);
    });
  });

  describe('resetDialogs', () => {
    it('resets all dialog states', () => {
      const state: CardBackState = {
        showMechanicsDialog: true,
        showTemplateDialog: true,
        templateDialogCardType: 'character'
      };
      
      const resetState = resetDialogs(state);
      
      expect(resetState).toEqual({
        showMechanicsDialog: false,
        showTemplateDialog: false,
        templateDialogCardType: ''
      });
    });
  });

  describe('getCardData', () => {
    it('returns preview card when in preview mode', () => {
      const result = getCardData('test-card', mockCard, true, mockDeckCards);
      
      expect(result).toBe(mockCard);
    });

    it('returns deck card when not in preview mode', () => {
      const result = getCardData('other-card', mockCard, false, mockDeckCards);
      
      expect(result.id).toBe('other-card');
    });

    it('returns preview card when deck cards not available', () => {
      const result = getCardData('test-card', mockCard, false, undefined);
      
      expect(result).toBe(mockCard);
    });

    it('returns preview card when card not found in deck', () => {
      const result = getCardData('nonexistent-card', mockCard, false, mockDeckCards);
      
      expect(result).toBe(mockCard);
    });
  });

  describe('resolveActiveTheme', () => {
    it('uses prop theme if provided', () => {
      const theme = resolveActiveTheme('dark', 'light', 'classic');
      expect(theme).toBe('dark');
    });

    it('uses deck theme if prop theme not provided', () => {
      const theme = resolveActiveTheme(undefined, 'light', 'classic');
      expect(theme).toBe('light');
    });

    it('uses fallback if neither prop nor deck theme provided', () => {
      const theme = resolveActiveTheme(undefined, undefined, 'classic');
      expect(theme).toBe('classic');
    });

    it('uses default fallback', () => {
      const theme = resolveActiveTheme();
      expect(theme).toBe('classic');
    });
  });

  describe('validateCardName', () => {
    it('validates valid name', () => {
      const result = validateCardName('Valid Name');
      expect(result.isValid).toBe(true);
    });

    it('rejects empty name', () => {
      const result = validateCardName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Card name cannot be empty');
    });

    it('rejects whitespace-only name', () => {
      const result = validateCardName('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Card name cannot be empty');
    });

    it('rejects too long name', () => {
      const longName = 'a'.repeat(101);
      const result = validateCardName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Card name is too long (max 100 characters)');
    });

    it('accepts name at character limit', () => {
      const maxName = 'a'.repeat(100);
      const result = validateCardName(maxName);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCardDescription', () => {
    it('validates valid description', () => {
      const result = validateCardDescription('Valid description');
      expect(result.isValid).toBe(true);
    });

    it('allows empty description', () => {
      const result = validateCardDescription('');
      expect(result.isValid).toBe(true);
    });

    it('rejects too long description', () => {
      const longDesc = 'a'.repeat(1001);
      const result = validateCardDescription(longDesc);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description is too long (max 1000 characters)');
    });

    it('accepts description at character limit', () => {
      const maxDesc = 'a'.repeat(1000);
      const result = validateCardDescription(maxDesc);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateSecrets', () => {
    it('validates valid secrets array', () => {
      const secrets = [
        { label: 'Secret 1', value: 'Value 1' },
        { label: 'Secret 2', value: 'Value 2' }
      ];
      const result = validateSecrets(secrets);
      expect(result.isValid).toBe(true);
    });

    it('allows empty secrets array', () => {
      const result = validateSecrets([]);
      expect(result.isValid).toBe(true);
    });

    it('rejects non-array secrets', () => {
      const result = validateSecrets({} as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Secrets must be an array');
    });

    it('rejects too many secrets', () => {
      const secrets = Array(21).fill({ label: 'Secret', value: 'Value' });
      const result = validateSecrets(secrets);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Too many secrets (max 20)');
    });

    it('rejects invalid secret object', () => {
      const secrets = [null];
      const result = validateSecrets(secrets as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Secret 1 is invalid');
    });

    it('rejects secret without label', () => {
      const secrets = [{ value: 'Value' }];
      const result = validateSecrets(secrets as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Secret 1 must have a label');
    });

    it('rejects secret with too long label', () => {
      const secrets = [{ label: 'a'.repeat(51), value: 'Value' }];
      const result = validateSecrets(secrets);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Secret 1 label is too long (max 50 characters)');
    });
  });

  describe('processNameBlur', () => {
    it('extracts trimmed name from blur event', () => {
      const mockTarget = { textContent: '  Test Name  ' };
      const mockEvent = { target: mockTarget } as FocusEvent;
      
      const result = processNameBlur(mockEvent);
      expect(result).toBe('Test Name');
    });

    it('returns null for empty name', () => {
      const mockTarget = { textContent: '   ' };
      const mockEvent = { target: mockTarget } as FocusEvent;
      
      const result = processNameBlur(mockEvent);
      expect(result).toBe(null);
    });

    it('handles null textContent', () => {
      const mockTarget = { textContent: null };
      const mockEvent = { target: mockTarget } as FocusEvent;
      
      const result = processNameBlur(mockEvent);
      expect(result).toBe(null);
    });
  });

  describe('processDescriptionBlur', () => {
    it('extracts trimmed description from element', () => {
      const mockElement = { innerText: '  Test Description  ' } as HTMLElement;
      
      const result = processDescriptionBlur(mockElement);
      expect(result).toBe('Test Description');
    });

    it('returns null for null element', () => {
      const result = processDescriptionBlur(null);
      expect(result).toBe(null);
    });

    it('returns null for empty description', () => {
      const mockElement = { innerText: '   ' } as HTMLElement;
      
      const result = processDescriptionBlur(mockElement);
      expect(result).toBe(null);
    });
  });

  describe('processSecretsBlur', () => {
    it('processes secrets from HTML element', () => {
      const mockElement = { 
        innerHTML: '<span class="secret-label">HP:</span> 100' 
      } as HTMLElement;
      
      // Mock the parseSecrets function
      vi.doMock('$lib/utils/card-utils', () => ({
        parseSecrets: vi.fn().mockReturnValue([{ label: 'HP', value: '100' }])
      }));
      
      const result = processSecretsBlur(mockElement);
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array for null element', () => {
      const result = processSecretsBlur(null);
      expect(result).toEqual([]);
    });
  });

  describe('contentHasChanged', () => {
    it('detects string content changes', () => {
      expect(contentHasChanged('old', 'new')).toBe(true);
      expect(contentHasChanged('same', 'same')).toBe(false);
    });

    it('detects array content changes', () => {
      const oldArray = [{ a: 1 }];
      const newArray = [{ a: 2 }];
      const sameArray = [{ a: 1 }];
      
      expect(contentHasChanged(oldArray, newArray)).toBe(true);
      expect(contentHasChanged(oldArray, sameArray)).toBe(false);
    });

    it('handles different value types', () => {
      expect(contentHasChanged(1, 2)).toBe(true);
      expect(contentHasChanged(true, false)).toBe(true);
      expect(contentHasChanged(null, undefined)).toBe(true);
    });
  });

  describe('prepareTemplateDialog', () => {
    it('sets up template dialog state', () => {
      const state = initializeCardBackState();
      
      const result = prepareTemplateDialog(state, 'character');
      
      expect(result.showTemplateDialog).toBe(true);
      expect(result.templateDialogCardType).toBe('character');
      expect(result.showMechanicsDialog).toBe(false);
    });
  });

  describe('applyTemplateWithVocabulary', () => {
    it('applies template without config', async () => {
      const result = await applyTemplateWithVocabulary(mockTemplate);
      expect(Array.isArray(result)).toBe(true);
    });

    it('applies template with config loader', async () => {
      const mockConfigLoader = vi.fn().mockResolvedValue({ vocabulary: {} });
      const options: TemplateApplicationOptions = {
        deckConfigId: 'test-config',
        configLoader: mockConfigLoader
      };
      
      const result = await applyTemplateWithVocabulary(mockTemplate, options);
      expect(Array.isArray(result)).toBe(true);
      expect(mockConfigLoader).toHaveBeenCalledWith('test-config');
    });

    it('falls back when config loading fails', async () => {
      const mockConfigLoader = vi.fn().mockRejectedValue(new Error('Load failed'));
      const options: TemplateApplicationOptions = {
        deckConfigId: 'test-config',
        configLoader: mockConfigLoader
      };
      
      const result = await applyTemplateWithVocabulary(mockTemplate, options);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('createTemplateHandler', () => {
    it('creates a template handler function', async () => {
      const handler = createTemplateHandler();
      const result = await handler(mockTemplate);
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('validateMechanics', () => {
    it('validates valid mechanics array', () => {
      const result = validateMechanics(mockMechanics);
      expect(result.isValid).toBe(true);
    });

    it('allows empty mechanics array', () => {
      const result = validateMechanics([]);
      expect(result.isValid).toBe(true);
    });

    it('rejects non-array mechanics', () => {
      const result = validateMechanics({} as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Mechanics must be an array');
    });

    it('rejects too many mechanics', () => {
      const mechanics = Array(51).fill(mockMechanics[0]);
      const result = validateMechanics(mechanics);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Too many mechanics (max 50)');
    });

    it('rejects mechanic without name', () => {
      const mechanics = [{ description: 'Test' }] as any;
      const result = validateMechanics(mechanics);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Mechanic 1 must have a name');
    });

    it('rejects mechanic with too long name', () => {
      const mechanics = [{ name: 'a'.repeat(101), description: 'Test' }];
      const result = validateMechanics(mechanics);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Mechanic 1 name is too long (max 100 characters)');
    });
  });

  describe('mechanicsHaveChanged', () => {
    it('detects no change', () => {
      const result = mechanicsHaveChanged(mockMechanics, [...mockMechanics]);
      expect(result).toBe(false);
    });

    it('detects changes', () => {
      const modified = [{ ...mockMechanics[0], name: 'Modified' }];
      const result = mechanicsHaveChanged(mockMechanics, modified);
      expect(result).toBe(true);
    });
  });

  describe('dialog state management', () => {
    let state: CardBackState;

    beforeEach(() => {
      state = initializeCardBackState();
    });

    it('shows mechanics dialog', () => {
      const result = showMechanicsDialog(state);
      expect(result.showMechanicsDialog).toBe(true);
    });

    it('hides mechanics dialog', () => {
      const openState = { ...state, showMechanicsDialog: true };
      const result = hideMechanicsDialog(openState);
      expect(result.showMechanicsDialog).toBe(false);
    });

    it('shows template dialog', () => {
      const result = showTemplateDialog(state, 'character');
      expect(result.showTemplateDialog).toBe(true);
      expect(result.templateDialogCardType).toBe('character');
    });

    it('hides template dialog', () => {
      const openState = { 
        ...state, 
        showTemplateDialog: true, 
        templateDialogCardType: 'character' 
      };
      const result = hideTemplateDialog(openState);
      expect(result.showTemplateDialog).toBe(false);
      expect(result.templateDialogCardType).toBe('');
    });
  });

  describe('prepareUpdatePayload', () => {
    it('creates valid payload without validation', () => {
      const result = prepareUpdatePayload('name', 'Test Name');
      
      expect(result.isValid).toBe(true);
      expect(result.payload).toEqual({ name: 'Test Name' });
      expect(result.error).toBeUndefined();
    });

    it('creates valid payload with validation', () => {
      const validationFn = (value: string) => ({ isValid: true });
      const result = prepareUpdatePayload('name', 'Test Name', validationFn);
      
      expect(result.isValid).toBe(true);
      expect(result.payload).toEqual({ name: 'Test Name' });
    });

    it('returns error when validation fails', () => {
      const validationFn = (value: string) => ({ 
        isValid: false, 
        error: 'Invalid value' 
      });
      const result = prepareUpdatePayload('name', 'Bad Name', validationFn);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid value');
      expect(result.payload).toBeUndefined();
    });
  });

  describe('createFieldUpdateHandler', () => {
    it('creates update handler without validation', () => {
      const handler = createFieldUpdateHandler('name');
      const result = handler('Test Name');
      
      expect(result.isValid).toBe(true);
      expect(result.payload).toEqual({ name: 'Test Name' });
    });

    it('creates update handler with validation', () => {
      const validationFn = (value: string) => ({ isValid: value.length > 0 });
      const handler = createFieldUpdateHandler('name', validationFn);
      
      expect(handler('Valid').isValid).toBe(true);
      expect(handler('').isValid).toBe(false);
    });
  });

  describe('utility functions', () => {
    describe('isEditable', () => {
      it('returns true when editable and not updating', () => {
        expect(isEditable(true, false)).toBe(true);
      });

      it('returns false when not editable', () => {
        expect(isEditable(false, false)).toBe(false);
      });

      it('returns false when updating', () => {
        expect(isEditable(true, true)).toBe(false);
      });

      it('uses default updating value', () => {
        expect(isEditable(true)).toBe(true);
      });
    });

    describe('getContentEditableState', () => {
      it('returns correct state', () => {
        expect(getContentEditableState(true, false)).toBe(true);
        expect(getContentEditableState(false, false)).toBe(false);
        expect(getContentEditableState(true, true)).toBe(false);
      });
    });

    describe('shouldDisableElement', () => {
      it('returns correct disable state', () => {
        expect(shouldDisableElement(true, false)).toBe(false);
        expect(shouldDisableElement(false, false)).toBe(true);
        expect(shouldDisableElement(true, true)).toBe(true);
      });
    });
  });
});
