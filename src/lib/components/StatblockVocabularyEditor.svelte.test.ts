import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	initializeEditorState,
	getDefaultVocabulary,
	addCustomStat,
	removeCustomStat,
	updateCustomStat,
	updateDefaultStat,
	resetToDefaults,
	cleanVocabulary,
	validateVocabulary,
	getStatLabelsForPreview,
	type VocabularyEditorState
} from './StatblockVocabularyEditor.svelte.js';
import type { StatblockVocabulary } from '$lib/types';

// Mock the statblockConfigs module
vi.mock('$lib/statblockConfigs', () => ({
	getDefaultConfig: () => ({
		id: 'default',
		name: 'Default',
		vocabulary: {
			health: 'Health',
			attack: 'Attack',
			defense: 'Defense'
		}
	}),
	configToSimpleVocabulary: (config: any) => config.vocabulary
}));

describe('StatblockVocabularyEditor Logic', () => {
	let mockDefaultVocabulary: StatblockVocabulary;
	let mockCustomVocabulary: StatblockVocabulary;

	beforeEach(() => {
		mockDefaultVocabulary = {
			health: 'Health',
			attack: 'Attack',
			defense: 'Defense'
		};

		mockCustomVocabulary = {
			health: 'Hit Points',
			attack: 'Damage',
			defense: 'Armor Class',
			custom_123: 'Mana',
			custom_456: 'Sanity'
		};
	});

	describe('getDefaultVocabulary', () => {
		it('returns the default vocabulary configuration', () => {
			const result = getDefaultVocabulary();
			expect(result).toEqual(mockDefaultVocabulary);
		});
	});

	describe('initializeEditorState', () => {
		it('initializes with default vocabulary when no input provided', () => {
			const state = initializeEditorState();

			expect(state.workingVocabulary).toEqual(mockDefaultVocabulary);
			expect(state.customStats).toEqual([]);
		});

		it('initializes with provided vocabulary', () => {
			const state = initializeEditorState(mockCustomVocabulary);

			expect(state.workingVocabulary).toEqual(mockCustomVocabulary);
			expect(state.customStats).toEqual([
				{ key: 'custom_123', label: 'Mana' },
				{ key: 'custom_456', label: 'Sanity' }
			]);
		});

		it('creates a copy of input vocabulary (immutable)', () => {
			const input = { ...mockCustomVocabulary };
			const state = initializeEditorState(input);

			// Modify the original input
			input.health = 'Modified';

			// State should not be affected
			expect(state.workingVocabulary.health).toBe('Hit Points');
		});
	});

	describe('addCustomStat', () => {
		it('adds a new custom stat to empty state', () => {
			const initialState = initializeEditorState();
			const newState = addCustomStat(initialState);

			expect(newState.customStats).toHaveLength(1);
			expect(newState.customStats[0].key).toMatch(/^custom_\d+$/);
			expect(newState.customStats[0].label).toBe('');
			expect(newState.workingVocabulary[newState.customStats[0].key]).toBe('');
		});

		it('adds a new custom stat to existing state', () => {
			const initialState = initializeEditorState(mockCustomVocabulary);
			const newState = addCustomStat(initialState);

			expect(newState.customStats).toHaveLength(3);
			expect(newState.customStats[2].key).toMatch(/^custom_\d+$/);
			expect(newState.customStats[2].label).toBe('');
		});

		it('does not modify the original state', () => {
			const initialState = initializeEditorState();
			const newState = addCustomStat(initialState);

			expect(initialState.customStats).toHaveLength(0);
			expect(newState.customStats).toHaveLength(1);
		});
	});

	describe('removeCustomStat', () => {
		let stateWithCustomStats: VocabularyEditorState;

		beforeEach(() => {
			stateWithCustomStats = initializeEditorState(mockCustomVocabulary);
		});

		it('removes custom stat at valid index', () => {
			const newState = removeCustomStat(stateWithCustomStats, 0);

			expect(newState.customStats).toHaveLength(1);
			expect(newState.customStats[0].key).toBe('custom_456');
			expect(newState.workingVocabulary.custom_123).toBeUndefined();
			expect(newState.workingVocabulary.custom_456).toBe('Sanity');
		});

		it('removes last custom stat', () => {
			const newState = removeCustomStat(stateWithCustomStats, 1);

			expect(newState.customStats).toHaveLength(1);
			expect(newState.customStats[0].key).toBe('custom_123');
			expect(newState.workingVocabulary.custom_456).toBeUndefined();
		});

		it('handles invalid index (negative)', () => {
			const newState = removeCustomStat(stateWithCustomStats, -1);

			expect(newState).toBe(stateWithCustomStats);
		});

		it('handles invalid index (too large)', () => {
			const newState = removeCustomStat(stateWithCustomStats, 10);

			expect(newState).toBe(stateWithCustomStats);
		});

		it('does not modify original state', () => {
			const originalLength = stateWithCustomStats.customStats.length;
			removeCustomStat(stateWithCustomStats, 0);

			expect(stateWithCustomStats.customStats).toHaveLength(originalLength);
		});
	});

	describe('updateCustomStat', () => {
		let stateWithCustomStats: VocabularyEditorState;

		beforeEach(() => {
			stateWithCustomStats = initializeEditorState(mockCustomVocabulary);
		});

		it('updates custom stat label at valid index', () => {
			const newState = updateCustomStat(stateWithCustomStats, 0, 'Magic Points');

			expect(newState.customStats[0].label).toBe('Magic Points');
			expect(newState.workingVocabulary.custom_123).toBe('Magic Points');
			expect(newState.customStats[1].label).toBe('Sanity'); // Other stats unchanged
		});

		it('handles empty label', () => {
			const newState = updateCustomStat(stateWithCustomStats, 0, '');

			expect(newState.customStats[0].label).toBe('');
			expect(newState.workingVocabulary.custom_123).toBe('');
		});

		it('handles invalid index (negative)', () => {
			const newState = updateCustomStat(stateWithCustomStats, -1, 'Invalid');

			expect(newState).toBe(stateWithCustomStats);
		});

		it('handles invalid index (too large)', () => {
			const newState = updateCustomStat(stateWithCustomStats, 10, 'Invalid');

			expect(newState).toBe(stateWithCustomStats);
		});

		it('does not modify original state', () => {
			const originalLabel = stateWithCustomStats.customStats[0].label;
			updateCustomStat(stateWithCustomStats, 0, 'Changed');

			expect(stateWithCustomStats.customStats[0].label).toBe(originalLabel);
		});
	});

	describe('updateDefaultStat', () => {
		it('updates default stat label', () => {
			const initialState = initializeEditorState(mockCustomVocabulary);
			const newState = updateDefaultStat(initialState, 'health', 'Life Force');

			expect(newState.workingVocabulary.health).toBe('Life Force');
			expect(newState.workingVocabulary.attack).toBe('Damage'); // Others unchanged
		});

		it('adds new stat if key does not exist', () => {
			const initialState = initializeEditorState();
			const newState = updateDefaultStat(initialState, 'newStat', 'New Value');

			expect(newState.workingVocabulary.newStat).toBe('New Value');
		});

		it('does not modify original state', () => {
			const initialState = initializeEditorState();
			const originalValue = initialState.workingVocabulary.health;
			updateDefaultStat(initialState, 'health', 'Changed');

			expect(initialState.workingVocabulary.health).toBe(originalValue);
		});
	});

	describe('resetToDefaults', () => {
		it('resets vocabulary to defaults', () => {
			const customState = initializeEditorState(mockCustomVocabulary);
			const resetState = resetToDefaults(customState);

			expect(resetState.workingVocabulary).toEqual(mockDefaultVocabulary);
			expect(resetState.customStats).toEqual([]);
		});

		it('does not modify original state', () => {
			const customState = initializeEditorState(mockCustomVocabulary);
			const originalLength = customState.customStats.length;
			resetToDefaults(customState);

			expect(customState.customStats).toHaveLength(originalLength);
		});
	});

	describe('cleanVocabulary', () => {
		it('removes empty custom stats', () => {
			const dirtyVocabulary = {
				health: 'Health',
				attack: 'Attack',
				defense: 'Defense',
				custom_1: 'Valid Custom',
				custom_2: '', // Empty
				custom_3: '   ', // Whitespace only
				custom_4: null as any // Null
			};

			const cleaned = cleanVocabulary(dirtyVocabulary);

			expect(cleaned).toEqual({
				health: 'Health',
				attack: 'Attack',
				defense: 'Defense',
				custom_1: 'Valid Custom'
			});
		});

		it('keeps default stats even if empty', () => {
			const dirtyVocabulary = {
				health: '',
				attack: '   ',
				defense: null as any,
				custom_1: ''
			};

			const cleaned = cleanVocabulary(dirtyVocabulary);

			expect(cleaned).toEqual({
				health: '',
				attack: '   ',
				defense: null
			});
		});

		it('does not modify original vocabulary', () => {
			const original = {
				health: 'Health',
				custom_1: ''
			};
			const cleaned = cleanVocabulary(original);

			expect(original.custom_1).toBe('');
			expect(cleaned.custom_1).toBeUndefined();
		});
	});

	describe('validateVocabulary', () => {
		it('validates complete valid vocabulary', () => {
			const result = validateVocabulary(mockCustomVocabulary);

			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('detects missing required stats', () => {
			const incomplete = {
				health: 'Health'
				// missing attack and defense
			};

			const result = validateVocabulary(incomplete);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Missing required stat: attack');
			expect(result.errors).toContain('Missing required stat: defense');
		});

		it('detects invalid stat values', () => {
			const invalid = {
				health: '',
				attack: null as any,
				defense: 'Defense'
			};

			const result = validateVocabulary(invalid);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Invalid value for stat: health');
			expect(result.errors).toContain('Invalid value for stat: attack');
		});

		it('detects duplicate stat names', () => {
			const duplicates = {
				health: 'Power',
				attack: 'Power', // Duplicate
				defense: 'Shield'
			};

			const result = validateVocabulary(duplicates);

			expect(result.isValid).toBe(false);
			expect(result.errors.some((e) => e.includes('Duplicate stat names'))).toBe(true);
			expect(result.errors.some((e) => e.includes('power'))).toBe(true);
		});

		it('ignores case in duplicate detection', () => {
			const duplicates = {
				health: 'Power',
				attack: 'POWER',
				defense: 'Shield'
			};

			const result = validateVocabulary(duplicates);

			expect(result.isValid).toBe(false);
			expect(result.errors.some((e) => e.includes('Duplicate stat names'))).toBe(true);
		});

		it('ignores whitespace in duplicate detection', () => {
			const duplicates = {
				health: 'Power',
				attack: '  Power  ',
				defense: 'Shield'
			};

			const result = validateVocabulary(duplicates);

			expect(result.isValid).toBe(false);
		});
	});

	describe('getStatLabelsForPreview', () => {
		it('returns sorted non-empty labels', () => {
			const vocabulary = {
				health: 'Zebra',
				attack: 'Alpha',
				defense: 'Beta',
				custom_1: '',
				custom_2: '   ',
				custom_3: 'Charlie'
			};

			const labels = getStatLabelsForPreview(vocabulary);

			expect(labels).toEqual(['Alpha', 'Beta', 'Charlie', 'Zebra']);
		});

		it('handles empty vocabulary', () => {
			const labels = getStatLabelsForPreview({});

			expect(labels).toEqual([]);
		});

		it('trims whitespace from labels', () => {
			const vocabulary = {
				stat1: '  Health  ',
				stat2: 'Attack',
				stat3: ''
			};

			const labels = getStatLabelsForPreview(vocabulary);

			expect(labels).toEqual(['Attack', 'Health']);
		});

		it('filters out non-string values', () => {
			const vocabulary = {
				stat1: 'Health',
				stat2: null as any,
				stat3: undefined as any,
				stat4: 123 as any,
				stat5: 'Attack'
			};

			const labels = getStatLabelsForPreview(vocabulary);

			expect(labels).toEqual(['Attack', 'Health']);
		});
	});
});
