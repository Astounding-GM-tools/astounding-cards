/**
 * Integration tests for StatblockTemplateDialog.svelte
 *
 * Verifies that all extracted functions can be imported and used correctly
 * with the actual component types and interfaces.
 */

import { describe, it, expect } from 'vitest';
import type {
	TemplateDialogState,
	TemplateDialogAction
} from './StatblockTemplateDialog.svelte.ts';

describe('StatblockTemplateDialog Integration Tests', () => {
	it('should import all extracted functions without errors', async () => {
		const {
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
			isValidCategory
		} = await import('./StatblockTemplateDialog.svelte.ts');

		// Verify all functions are available
		expect(typeof mapCardTypeToCategory).toBe('function');
		expect(typeof selectTemplate).toBe('function');
		expect(typeof validateSelectionForConfirm).toBe('function');
		expect(typeof confirmSelection).toBe('function');
		expect(typeof createCustom).toBe('function');
		expect(typeof resetDialogState).toBe('function');
		expect(typeof handleTemplateKeydown).toBe('function');
		expect(typeof handleCategoryChange).toBe('function');
		expect(typeof formatStatWithVocabulary).toBe('function');
		expect(typeof isConfirmDisabled).toBe('function');
		expect(typeof getConfirmButtonText).toBe('function');
		expect(typeof isValidCardType).toBe('function');
		expect(typeof getAvailableCategories).toBe('function');
		expect(typeof isValidCategory).toBe('function');

		// Verify types can be used
		const state: TemplateDialogState = {
			show: false,
			selectedTemplate: null,
			selectedCategory: 'character'
		};
		expect(state).toBeDefined();

		const action: TemplateDialogAction = { action: 'custom' };
		expect(action).toBeDefined();
	});

	it('should work with actual StatblockTemplate and StatblockVocabulary types', async () => {
		const { mapCardTypeToCategory, formatStatWithVocabulary } = await import(
			'./StatblockTemplateDialog.svelte.ts'
		);

		// Import actual types from the statblock system
		const { getTemplatesByCategory } = await import('../statblockTemplates');

		// Test with real template data if available
		const templates = getTemplatesByCategory('character');

		if (templates.length > 0) {
			const realTemplate = templates[0];

			// Verify our functions work with real data
			const category = mapCardTypeToCategory('character');
			expect(category).toBe('character');

			if (realTemplate.mechanics.length > 0) {
				const formattedStat = formatStatWithVocabulary(realTemplate.mechanics[0], null);
				expect(typeof formattedStat).toBe('string');
				expect(formattedStat.endsWith(':')).toBe(true);
			}
		}
	});
});
