/**
 * Test suite for StatblockTemplateDialog.svelte.ts
 * 
 * Comprehensive tests for all extracted pure logic functions
 */

import { describe, it, expect } from 'vitest';
import {
  mapCardTypeToCategory,
  selectTemplate,
  validateSelectionForConfirm,
  confirmSelection,
  createCustom,
  resetDialogState,
  handleTemplateKeydown,
  handleCategoryChange,
  formatStatWithVocabulary,
  isConfirmDisabled,
  getConfirmButtonText,
  isValidCardType,
  getAvailableCategories,
  isValidCategory,
  type TemplateDialogState,
  type TemplateDialogAction
} from './StatblockTemplateDialog.svelte.ts';

import type { StatblockTemplate } from '../statblockTemplates';
import type { StatblockVocabulary } from '../types';

// Mock template data for testing
const mockTemplate: StatblockTemplate = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A test template',
  category: 'character',
  icon: '🧪',
  mechanics: [
    { type: 'health', name: 'Health', value: '10' },
    { type: 'strength', name: 'Strength', value: '15' }
  ]
};

const mockItemTemplate: StatblockTemplate = {
  id: 'test-item',
  name: 'Test Item',
  description: 'A test item template',
  category: 'item',
  icon: '⚔️',
  mechanics: [
    { type: 'damage', name: 'Damage', value: '1d6' },
    { type: 'weight', name: 'Weight', value: '2 lbs' },
    { type: 'value', name: 'Value', value: '50gp' }
  ]
};

const mockVocabulary: StatblockVocabulary = {
  health: 'Hit Points',
  strength: 'STR',
  damage: 'Attack',
  weight: 'Weight',
  value: 'Cost'
};

describe('StatblockTemplateDialog Pure Logic Functions', () => {
  
  describe('mapCardTypeToCategory', () => {
    it('should map standard card types correctly', () => {
      expect(mapCardTypeToCategory('character')).toBe('character');
      expect(mapCardTypeToCategory('item')).toBe('item');
      expect(mapCardTypeToCategory('spell')).toBe('spell');
    });

    it('should handle case-insensitive mapping', () => {
      expect(mapCardTypeToCategory('CHARACTER')).toBe('character');
      expect(mapCardTypeToCategory('Item')).toBe('item');
      expect(mapCardTypeToCategory('SPELL')).toBe('spell');
    });

    it('should map creature to character category', () => {
      expect(mapCardTypeToCategory('creature')).toBe('character');
      expect(mapCardTypeToCategory('CREATURE')).toBe('character');
    });

    it('should return character as fallback for unknown types', () => {
      expect(mapCardTypeToCategory('unknown')).toBe('character');
      expect(mapCardTypeToCategory('vehicle')).toBe('character');
      expect(mapCardTypeToCategory('')).toBe('character');
    });

    it('should handle edge cases gracefully', () => {
      expect(mapCardTypeToCategory(' character ')).toBe('character');
      expect(mapCardTypeToCategory('123')).toBe('character');
    });
  });

  describe('selectTemplate', () => {
    it('should return the provided template', () => {
      const result = selectTemplate(mockTemplate);
      expect(result).toBe(mockTemplate);
      expect(result.id).toBe('test-template');
    });

    it('should work with different template types', () => {
      const result = selectTemplate(mockItemTemplate);
      expect(result).toBe(mockItemTemplate);
      expect(result.category).toBe('item');
    });
  });

  describe('validateSelectionForConfirm', () => {
    it('should return true when template is selected', () => {
      expect(validateSelectionForConfirm(mockTemplate, 'character')).toBe(true);
      expect(validateSelectionForConfirm(mockItemTemplate, 'item')).toBe(true);
    });

    it('should return true when other category is selected (custom)', () => {
      expect(validateSelectionForConfirm(null, 'other')).toBe(true);
    });

    it('should return false when no template and not other category', () => {
      expect(validateSelectionForConfirm(null, 'character')).toBe(false);
      expect(validateSelectionForConfirm(null, 'item')).toBe(false);
      expect(validateSelectionForConfirm(null, 'spell')).toBe(false);
    });

    it('should handle mixed valid scenarios', () => {
      // Template selected overrides category
      expect(validateSelectionForConfirm(mockTemplate, 'other')).toBe(true);
      expect(validateSelectionForConfirm(mockItemTemplate, 'character')).toBe(true);
    });
  });

  describe('confirmSelection', () => {
    it('should return select action when template is selected', () => {
      const result = confirmSelection(mockTemplate, 'character');
      expect(result).toEqual({
        action: 'select',
        template: mockTemplate
      });
    });

    it('should return custom action when other category is selected', () => {
      const result = confirmSelection(null, 'other');
      expect(result).toEqual({
        action: 'custom'
      });
    });

    it('should prioritize template over other category', () => {
      const result = confirmSelection(mockTemplate, 'other');
      expect(result).toEqual({
        action: 'select',
        template: mockTemplate
      });
    });

    it('should return custom as fallback for invalid states', () => {
      const result = confirmSelection(null, 'character');
      expect(result).toEqual({
        action: 'custom'
      });
    });
  });

  describe('createCustom', () => {
    it('should return custom action object', () => {
      const result = createCustom();
      expect(result).toEqual({
        action: 'custom'
      });
    });

    it('should always return the same structure', () => {
      const result1 = createCustom();
      const result2 = createCustom();
      expect(result1).toEqual(result2);
    });
  });

  describe('resetDialogState', () => {
    it('should return reset state object', () => {
      const result = resetDialogState();
      expect(result).toEqual({
        show: false,
        selectedTemplate: null
      });
    });

    it('should always return the same reset state', () => {
      const result1 = resetDialogState();
      const result2 = resetDialogState();
      expect(result1).toEqual(result2);
    });
  });

  describe('handleTemplateKeydown', () => {
    it('should return cancel action for Escape key', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const result = handleTemplateKeydown(escapeEvent);
      expect(result).toEqual({ action: 'cancel' });
    });

    it('should return none action for other keys', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const result = handleTemplateKeydown(enterEvent);
      expect(result).toEqual({ action: 'none' });
    });

    it('should handle various key combinations', () => {
      const keys = ['Tab', 'Space', 'ArrowDown', 'ArrowUp', 'a', '1'];
      keys.forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        const result = handleTemplateKeydown(event);
        expect(result).toEqual({ action: 'none' });
      });
    });

    it('should be case sensitive for Escape', () => {
      const event = new KeyboardEvent('keydown', { key: 'escape' });
      const result = handleTemplateKeydown(event);
      expect(result).toEqual({ action: 'none' });
    });
  });

  describe('handleCategoryChange', () => {
    it('should return new category with reset template', () => {
      const result = handleCategoryChange('item');
      expect(result).toEqual({
        selectedCategory: 'item',
        selectedTemplate: null
      });
    });

    it('should work with all valid categories', () => {
      const categories: StatblockTemplate['category'][] = ['character', 'item', 'spell', 'other'];
      categories.forEach(category => {
        const result = handleCategoryChange(category);
        expect(result).toEqual({
          selectedCategory: category,
          selectedTemplate: null
        });
      });
    });

    it('should always reset template selection', () => {
      const result = handleCategoryChange('other');
      expect(result.selectedTemplate).toBeNull();
    });
  });

  describe('formatStatWithVocabulary', () => {
    it('should use vocabulary when available', () => {
      const mechanic = { type: 'health', name: 'Health' };
      const result = formatStatWithVocabulary(mechanic, mockVocabulary);
      expect(result).toBe('Hit Points:');
    });

    it('should fallback to mechanic name when no vocabulary', () => {
      const mechanic = { type: 'health', name: 'Health' };
      const result = formatStatWithVocabulary(mechanic, null);
      expect(result).toBe('Health:');
    });

    it('should fallback to mechanic name when type not in vocabulary', () => {
      const mechanic = { type: 'unknown', name: 'Unknown Stat' };
      const result = formatStatWithVocabulary(mechanic, mockVocabulary);
      expect(result).toBe('Unknown Stat:');
    });

    it('should handle empty vocabulary object', () => {
      const mechanic = { type: 'health', name: 'Health' };
      const result = formatStatWithVocabulary(mechanic, {});
      expect(result).toBe('Health:');
    });

    it('should always add colon suffix', () => {
      const mechanic = { type: 'strength', name: 'Strength' };
      const result = formatStatWithVocabulary(mechanic, mockVocabulary);
      expect(result).toBe('STR:');
      expect(result.endsWith(':')).toBe(true);
    });

    it('should handle edge cases in mechanic data', () => {
      const edgeCases = [
        { type: '', name: 'Empty Type' },
        { type: 'health', name: '' },
        { type: '', name: '' }
      ];

      edgeCases.forEach(mechanic => {
        const result = formatStatWithVocabulary(mechanic, mockVocabulary);
        expect(result.endsWith(':')).toBe(true);
      });
    });
  });

  describe('isConfirmDisabled', () => {
    it('should return false when template is selected', () => {
      expect(isConfirmDisabled(mockTemplate, 'character')).toBe(false);
      expect(isConfirmDisabled(mockItemTemplate, 'item')).toBe(false);
    });

    it('should return false when other category is selected', () => {
      expect(isConfirmDisabled(null, 'other')).toBe(false);
    });

    it('should return true when no valid selection', () => {
      expect(isConfirmDisabled(null, 'character')).toBe(true);
      expect(isConfirmDisabled(null, 'item')).toBe(true);
      expect(isConfirmDisabled(null, 'spell')).toBe(true);
    });

    it('should mirror validateSelectionForConfirm logic', () => {
      const testCases = [
        [mockTemplate, 'character' as const],
        [null, 'other' as const],
        [null, 'character' as const],
        [mockItemTemplate, 'spell' as const]
      ] as const;

      testCases.forEach(([template, category]) => {
        const isDisabled = isConfirmDisabled(template, category);
        const isValid = validateSelectionForConfirm(template, category);
        expect(isDisabled).toBe(!isValid);
      });
    });
  });

  describe('getConfirmButtonText', () => {
    it('should return "Create Custom" for other category', () => {
      expect(getConfirmButtonText(null, 'other')).toBe('Create Custom');
      expect(getConfirmButtonText(mockTemplate, 'other')).toBe('Create Custom');
    });

    it('should return stats count text when template is selected', () => {
      expect(getConfirmButtonText(mockTemplate, 'character')).toBe('Add 2 Stats');
      expect(getConfirmButtonText(mockItemTemplate, 'item')).toBe('Add 3 Stats');
    });

    it('should return "Select Template" when no selection', () => {
      expect(getConfirmButtonText(null, 'character')).toBe('Select Template');
      expect(getConfirmButtonText(null, 'item')).toBe('Select Template');
      expect(getConfirmButtonText(null, 'spell')).toBe('Select Template');
    });

    it('should prioritize other category over template selection', () => {
      // When category is 'other', it should return custom text even if template is selected
      expect(getConfirmButtonText(mockTemplate, 'other')).toBe('Create Custom');
    });

    it('should handle templates with different mechanic counts', () => {
      const singleMechanicTemplate: StatblockTemplate = {
        ...mockTemplate,
        mechanics: [{ type: 'health', name: 'Health', value: '10' }]
      };
      expect(getConfirmButtonText(singleMechanicTemplate, 'character')).toBe('Add 1 Stats');

      const noMechanicsTemplate: StatblockTemplate = {
        ...mockTemplate,
        mechanics: []
      };
      expect(getConfirmButtonText(noMechanicsTemplate, 'character')).toBe('Add 0 Stats');
    });
  });

  describe('isValidCardType', () => {
    it('should validate standard card types', () => {
      expect(isValidCardType('character')).toBe(true);
      expect(isValidCardType('creature')).toBe(true);
      expect(isValidCardType('item')).toBe(true);
      expect(isValidCardType('spell')).toBe(true);
    });

    it('should handle case insensitive validation', () => {
      expect(isValidCardType('CHARACTER')).toBe(true);
      expect(isValidCardType('Item')).toBe(true);
      expect(isValidCardType('SPELL')).toBe(true);
    });

    it('should reject invalid card types', () => {
      expect(isValidCardType('unknown')).toBe(false);
      expect(isValidCardType('vehicle')).toBe(false);
      expect(isValidCardType('')).toBe(false);
      expect(isValidCardType('123')).toBe(false);
    });
  });

  describe('getAvailableCategories', () => {
    it('should return all valid categories', () => {
      const categories = getAvailableCategories();
      expect(categories).toEqual(['character', 'item', 'spell', 'other']);
    });

    it('should return consistent results', () => {
      const categories1 = getAvailableCategories();
      const categories2 = getAvailableCategories();
      expect(categories1).toEqual(categories2);
    });

    it('should include other category', () => {
      const categories = getAvailableCategories();
      expect(categories).toContain('other');
    });
  });

  describe('isValidCategory', () => {
    it('should validate all available categories', () => {
      const categories = getAvailableCategories();
      categories.forEach(category => {
        expect(isValidCategory(category)).toBe(true);
      });
    });

    it('should reject invalid categories', () => {
      expect(isValidCategory('invalid')).toBe(false);
      expect(isValidCategory('unknown')).toBe(false);
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory('123')).toBe(false);
    });

    it('should provide type narrowing', () => {
      const testString: string = 'character';
      if (isValidCategory(testString)) {
        // TypeScript should narrow the type here
        const category: StatblockTemplate['category'] = testString;
        expect(category).toBe('character');
      }
    });
  });

  describe('Type definitions', () => {
    it('should have correct TemplateDialogState structure', () => {
      const state: TemplateDialogState = {
        show: true,
        selectedTemplate: mockTemplate,
        selectedCategory: 'character'
      };
      expect(state.show).toBe(true);
      expect(state.selectedTemplate).toBe(mockTemplate);
      expect(state.selectedCategory).toBe('character');
    });

    it('should have correct TemplateDialogAction variations', () => {
      const selectAction: TemplateDialogAction = {
        action: 'select',
        template: mockTemplate
      };
      expect(selectAction.action).toBe('select');
      expect(selectAction.template).toBe(mockTemplate);

      const customAction: TemplateDialogAction = { action: 'custom' };
      expect(customAction.action).toBe('custom');

      const cancelAction: TemplateDialogAction = { action: 'cancel' };
      expect(cancelAction.action).toBe('cancel');

      const noneAction: TemplateDialogAction = { action: 'none' };
      expect(noneAction.action).toBe('none');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow for template selection', () => {
      // 1. Map card type to category
      const category = mapCardTypeToCategory('character');
      expect(category).toBe('character');

      // 2. Select template
      const selected = selectTemplate(mockTemplate);
      expect(selected).toBe(mockTemplate);

      // 3. Validate selection
      const isValid = validateSelectionForConfirm(selected, category);
      expect(isValid).toBe(true);

      // 4. Confirm selection
      const confirmation = confirmSelection(selected, category);
      expect(confirmation.action).toBe('select');

      // 5. Check button state
      const isDisabled = isConfirmDisabled(selected, category);
      expect(isDisabled).toBe(false);

      // 6. Get button text
      const buttonText = getConfirmButtonText(selected, category);
      expect(buttonText).toBe('Add 2 Stats');
    });

    it('should handle complete workflow for custom creation', () => {
      // 1. Change to other category
      const categoryChange = handleCategoryChange('other');
      expect(categoryChange.selectedCategory).toBe('other');
      expect(categoryChange.selectedTemplate).toBeNull();

      // 2. Validate custom selection
      const isValid = validateSelectionForConfirm(null, 'other');
      expect(isValid).toBe(true);

      // 3. Create custom
      const custom = createCustom();
      expect(custom.action).toBe('custom');

      // 4. Check button state for custom
      const isDisabled = isConfirmDisabled(null, 'other');
      expect(isDisabled).toBe(false);

      // 5. Get custom button text
      const buttonText = getConfirmButtonText(null, 'other');
      expect(buttonText).toBe('Create Custom');
    });

    it('should handle vocabulary formatting in preview context', () => {
      const mechanics = mockTemplate.mechanics;
      const formattedStats = mechanics.map(mechanic => 
        formatStatWithVocabulary(mechanic, mockVocabulary)
      );

      expect(formattedStats).toEqual(['Hit Points:', 'STR:']);
    });
  });
});
