import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCardData,
  resolveActiveTheme,
  processNameFromBlur,
  nameHasChanged,
  processDescriptionFromElement,
  shouldUpdateDescription,
  processSecretsFromElement,
  secretsHaveChanged,
  addSecretToArray,
  applyTemplateWithVocabulary,
  isEditableMode,
  shouldBeContentEditable
} from './CardBack.logic.clean.js';
import type { Card } from '$lib/types';
import type { StatblockTemplate } from '$lib/statblockTemplates';

describe('CardBack Pure Logic - Only Used Functions', () => {
  let mockCard: Card;
  let mockDeckCards: Card[];
  let mockTemplate: StatblockTemplate;

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

  describe('processNameFromBlur', () => {
    it('extracts trimmed name from blur event', () => {
      const mockTarget = { textContent: '  Test Name  ' };
      const mockEvent = { target: mockTarget } as FocusEvent;
      
      const result = processNameFromBlur(mockEvent);
      expect(result).toBe('Test Name');
    });

    it('returns empty string for null textContent', () => {
      const mockTarget = { textContent: null };
      const mockEvent = { target: mockTarget } as FocusEvent;
      
      const result = processNameFromBlur(mockEvent);
      expect(result).toBe('');
    });

    it('returns empty string for whitespace-only textContent', () => {
      const mockTarget = { textContent: '   ' };
      const mockEvent = { target: mockTarget } as FocusEvent;
      
      const result = processNameFromBlur(mockEvent);
      expect(result).toBe('');
    });
  });

  describe('nameHasChanged', () => {
    it('detects name changes', () => {
      expect(nameHasChanged('New Name', 'Old Name')).toBe(true);
    });

    it('detects no change', () => {
      expect(nameHasChanged('Same Name', 'Same Name')).toBe(false);
    });

    it('handles empty strings', () => {
      expect(nameHasChanged('', 'Old Name')).toBe(true);
      expect(nameHasChanged('', '')).toBe(false);
    });
  });

  describe('processDescriptionFromElement', () => {
    it('extracts trimmed description from element', () => {
      const mockElement = { innerText: '  Test Description  ' } as HTMLElement;
      
      const result = processDescriptionFromElement(mockElement);
      expect(result).toBe('Test Description');
    });

    it('returns null for null element', () => {
      const result = processDescriptionFromElement(null);
      expect(result).toBe(null);
    });

    it('returns null for empty description', () => {
      const mockElement = { innerText: '   ' } as HTMLElement;
      
      const result = processDescriptionFromElement(mockElement);
      expect(result).toBe(null);
    });
  });

  describe('shouldUpdateDescription', () => {
    it('returns true when description has changed and is non-empty', () => {
      expect(shouldUpdateDescription('New Description', 'Old Description')).toBe(true);
    });

    it('returns false when description is unchanged', () => {
      expect(shouldUpdateDescription('Same Description', 'Same Description')).toBe(false);
    });

    it('returns false when new description is null', () => {
      expect(shouldUpdateDescription(null, 'Old Description')).toBe(false);
    });

    it('returns false when new description is empty', () => {
      expect(shouldUpdateDescription('', 'Old Description')).toBe(false);
    });
  });

  describe('processSecretsFromElement', () => {
    it('processes secrets from HTML element', () => {
      const mockElement = { 
        innerHTML: '<span class="secret-label">HP:</span> 100' 
      } as HTMLElement;
      
      const result = processSecretsFromElement(mockElement);
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array for null element', () => {
      const result = processSecretsFromElement(null);
      expect(result).toEqual([]);
    });
  });

  describe('secretsHaveChanged', () => {
    it('detects no change', () => {
      const secrets1 = [{ label: 'HP', value: '100' }];
      const secrets2 = [{ label: 'HP', value: '100' }];
      
      expect(secretsHaveChanged(secrets1, secrets2)).toBe(false);
    });

    it('detects changes', () => {
      const secrets1 = [{ label: 'HP', value: '100' }];
      const secrets2 = [{ label: 'HP', value: '150' }];
      
      expect(secretsHaveChanged(secrets1, secrets2)).toBe(true);
    });

    it('detects length changes', () => {
      const secrets1 = [{ label: 'HP', value: '100' }];
      const secrets2 = [{ label: 'HP', value: '100' }, { label: 'MP', value: '50' }];
      
      expect(secretsHaveChanged(secrets1, secrets2)).toBe(true);
    });
  });

  describe('addSecretToArray', () => {
    it('adds a new secret to existing secrets', () => {
      const secrets = [{ label: 'HP', value: '100' }];
      const result = addSecretToArray(secrets);
      
      expect(result.length).toBeGreaterThan(secrets.length);
    });

    it('does not modify the original array', () => {
      const originalSecrets = [{ label: 'HP', value: '100' }];
      const originalLength = originalSecrets.length;
      
      addSecretToArray(originalSecrets);
      
      expect(originalSecrets.length).toBe(originalLength);
    });
  });

  describe('applyTemplateWithVocabulary', () => {
    it('applies template without config', async () => {
      const result = await applyTemplateWithVocabulary(mockTemplate);
      expect(Array.isArray(result)).toBe(true);
    });

    it('applies template with config loader', async () => {
      const mockConfigLoader = vi.fn().mockResolvedValue({ vocabulary: {} });
      
      const result = await applyTemplateWithVocabulary(
        mockTemplate, 
        'test-config', 
        mockConfigLoader
      );
      
      expect(Array.isArray(result)).toBe(true);
      expect(mockConfigLoader).toHaveBeenCalledWith('test-config');
    });

    it('falls back when config loading fails', async () => {
      const mockConfigLoader = vi.fn().mockRejectedValue(new Error('Load failed'));
      
      const result = await applyTemplateWithVocabulary(
        mockTemplate, 
        'test-config', 
        mockConfigLoader
      );
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('applies template without config when no config ID provided', async () => {
      const mockConfigLoader = vi.fn();
      
      const result = await applyTemplateWithVocabulary(
        mockTemplate, 
        undefined, 
        mockConfigLoader
      );
      
      expect(Array.isArray(result)).toBe(true);
      expect(mockConfigLoader).not.toHaveBeenCalled();
    });
  });

  describe('isEditableMode', () => {
    it('returns true when editable', () => {
      expect(isEditableMode(true)).toBe(true);
    });

    it('returns false when not editable', () => {
      expect(isEditableMode(false)).toBe(false);
    });
  });

  describe('shouldBeContentEditable', () => {
    it('returns true when editable and not updating', () => {
      expect(shouldBeContentEditable(true, false)).toBe(true);
    });

    it('returns false when not editable', () => {
      expect(shouldBeContentEditable(false, false)).toBe(false);
    });

    it('returns false when updating', () => {
      expect(shouldBeContentEditable(true, true)).toBe(false);
    });

    it('returns false when not editable and updating', () => {
      expect(shouldBeContentEditable(false, true)).toBe(false);
    });
  });
});
