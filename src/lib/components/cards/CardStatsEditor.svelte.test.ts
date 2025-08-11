import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initializeStatsEditorState,
  initializeDragState,
  resetStatsEditorState,
  updateStatsEditorState,
  statExists,
  validateStatForm,
  addStatToArray,
  removeStatFromArray,
  updateStatInArray,
  reorderStats,
  startDrag,
  dragOver,
  clearDragOver,
  endDrag,
  handleDrop,
  getAvailableStats,
  getUsedStatIds,
  isStatUsed,
  findStatDefinition,
  getStatLabel,
  getStatIcon,
  groupStatsByCategory,
  validateCustomStat,
  createCustomStatDefinition,
  generateCustomStatId,
  statsChanged,
  sortStats,
  getStatsSummary,
  type StatsEditorState,
  type DragState,
  type StatFormData
} from './CardStatsEditor.svelte.js';
import type { CardStat, StatDefinition } from '$lib/types';

describe('CardStatsEditor Logic', () => {
  let mockStats: CardStat[];
  let mockDefinitions: StatDefinition[];

  beforeEach(() => {
    mockStats = [
      { statId: 'health', value: 100 },
      { statId: 'attack', value: 75 },
      { statId: 'defense', value: 50 }
    ];

    mockDefinitions = [
      { id: 'health', label: 'Health', icon: 'heart', category: 'Core' },
      { id: 'attack', label: 'Attack', icon: 'sword', category: 'Combat' },
      { id: 'defense', label: 'Defense', icon: 'shield', category: 'Combat' },
      { id: 'magic', label: 'Magic', icon: 'star', category: 'Special' },
      { id: 'custom_stat', label: 'Custom Stat', icon: 'gear', category: 'Custom' }
    ];

    // Mock Date.now for consistent testing
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  describe('initializeStatsEditorState', () => {
    it('initializes with default values and empty stats', () => {
      const state = initializeStatsEditorState();
      
      expect(state).toEqual({
        editingStats: [],
        selectedStatId: '',
        newStatValue: '',
        showAddStat: false,
        showCustomStatForm: false,
        customStatLabel: '',
        customStatIcon: ''
      });
    });

    it('initializes with provided stats', () => {
      const state = initializeStatsEditorState(mockStats);
      
      expect(state.editingStats).toEqual(mockStats);
      expect(state.editingStats).not.toBe(mockStats); // Should be a copy
    });
  });

  describe('initializeDragState', () => {
    it('initializes drag state with null values', () => {
      const state = initializeDragState();
      
      expect(state).toEqual({
        draggedIndex: null,
        dragOverIndex: null
      });
    });
  });

  describe('resetStatsEditorState', () => {
    it('resets form fields while preserving editingStats', () => {
      const state: StatsEditorState = {
        editingStats: mockStats,
        selectedStatId: 'health',
        newStatValue: '50',
        showAddStat: true,
        showCustomStatForm: true,
        customStatLabel: 'My Stat',
        customStatIcon: 'star'
      };

      const reset = resetStatsEditorState(state);
      
      expect(reset).toEqual({
        editingStats: mockStats,
        selectedStatId: '',
        newStatValue: '',
        showAddStat: false,
        showCustomStatForm: false,
        customStatLabel: '',
        customStatIcon: ''
      });
    });
  });

  describe('updateStatsEditorState', () => {
    it('updates state with partial values', () => {
      const state = initializeStatsEditorState();
      const updates = { selectedStatId: 'health', newStatValue: 100 };
      
      const newState = updateStatsEditorState(state, updates);
      
      expect(newState.selectedStatId).toBe('health');
      expect(newState.newStatValue).toBe(100);
      expect(newState.showAddStat).toBe(false); // Other fields unchanged
    });

    it('does not modify original state', () => {
      const state = initializeStatsEditorState();
      updateStatsEditorState(state, { selectedStatId: 'health' });
      
      expect(state.selectedStatId).toBe('');
    });
  });

  describe('statExists', () => {
    it('returns true for existing stat', () => {
      expect(statExists(mockStats, 'health')).toBe(true);
      expect(statExists(mockStats, 'attack')).toBe(true);
    });

    it('returns false for non-existing stat', () => {
      expect(statExists(mockStats, 'magic')).toBe(false);
      expect(statExists(mockStats, 'nonexistent')).toBe(false);
    });

    it('handles empty stats array', () => {
      expect(statExists([], 'health')).toBe(false);
    });
  });

  describe('validateStatForm', () => {
    it('validates correct form data', () => {
      const data: StatFormData = { statId: 'magic', value: 25 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects empty stat ID', () => {
      const data: StatFormData = { statId: '', value: 25 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please select a stat type');
    });

    it('rejects whitespace-only stat ID', () => {
      const data: StatFormData = { statId: '   ', value: 25 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please select a stat type');
    });

    it('rejects empty value', () => {
      const data: StatFormData = { statId: 'magic', value: '' };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a value');
    });

    it('rejects null value', () => {
      const data: StatFormData = { statId: 'magic', value: null as any };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a value');
    });

    it('rejects undefined value', () => {
      const data: StatFormData = { statId: 'magic', value: undefined as any };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a value');
    });

    it('rejects duplicate stat', () => {
      const data: StatFormData = { statId: 'health', value: 25 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This stat is already added');
    });

    it('accepts zero as valid value', () => {
      const data: StatFormData = { statId: 'magic', value: 0 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('addStatToArray', () => {
    it('adds valid stat to array', () => {
      const result = addStatToArray(mockStats, 'magic', 30);
      
      expect(result).toHaveLength(4);
      expect(result[3]).toEqual({ statId: 'magic', value: 30 });
    });

    it('does not modify original array', () => {
      const original = [...mockStats];
      addStatToArray(mockStats, 'magic', 30);
      
      expect(mockStats).toEqual(original);
    });

    it('ignores invalid stat (empty ID)', () => {
      const result = addStatToArray(mockStats, '', 30);
      
      expect(result).toEqual(mockStats);
    });

    it('ignores duplicate stat', () => {
      const result = addStatToArray(mockStats, 'health', 200);
      
      expect(result).toEqual(mockStats);
    });

    it('accepts string values', () => {
      const result = addStatToArray(mockStats, 'magic', 'high');
      
      expect(result[3]).toEqual({ statId: 'magic', value: 'high' });
    });
  });

  describe('removeStatFromArray', () => {
    it('removes existing stat', () => {
      const result = removeStatFromArray(mockStats, 'attack');
      
      expect(result).toHaveLength(2);
      expect(result.find(s => s.statId === 'attack')).toBeUndefined();
    });

    it('does not modify original array', () => {
      const originalLength = mockStats.length;
      removeStatFromArray(mockStats, 'attack');
      
      expect(mockStats).toHaveLength(originalLength);
    });

    it('handles non-existent stat gracefully', () => {
      const result = removeStatFromArray(mockStats, 'nonexistent');
      
      expect(result).toEqual(mockStats);
    });

    it('handles empty array', () => {
      const result = removeStatFromArray([], 'health');
      
      expect(result).toEqual([]);
    });
  });

  describe('updateStatInArray', () => {
    it('updates existing stat value', () => {
      const result = updateStatInArray(mockStats, 'health', 150);
      
      expect(result.find(s => s.statId === 'health')?.value).toBe(150);
      expect(result.find(s => s.statId === 'attack')?.value).toBe(75); // Others unchanged
    });

    it('does not modify original array', () => {
      const original = [...mockStats];
      updateStatInArray(mockStats, 'health', 150);
      
      expect(mockStats).toEqual(original);
    });

    it('handles non-existent stat gracefully', () => {
      const result = updateStatInArray(mockStats, 'nonexistent', 100);
      
      expect(result).toEqual(mockStats);
    });

    it('accepts string values', () => {
      const result = updateStatInArray(mockStats, 'health', 'maximum');
      
      expect(result.find(s => s.statId === 'health')?.value).toBe('maximum');
    });
  });

  describe('reorderStats', () => {
    it('reorders stats correctly', () => {
      // Move first item (health) to last position
      const result = reorderStats(mockStats, 0, 2);
      
      expect(result[0].statId).toBe('attack');
      expect(result[1].statId).toBe('defense');
      expect(result[2].statId).toBe('health');
    });

    it('moves item from end to beginning', () => {
      const result = reorderStats(mockStats, 2, 0);
      
      expect(result[0].statId).toBe('defense');
      expect(result[1].statId).toBe('health');
      expect(result[2].statId).toBe('attack');
    });

    it('handles same source and destination', () => {
      const result = reorderStats(mockStats, 1, 1);
      
      expect(result).toEqual(mockStats);
    });

    it('handles invalid indices', () => {
      expect(reorderStats(mockStats, -1, 1)).toEqual(mockStats);
      expect(reorderStats(mockStats, 1, -1)).toEqual(mockStats);
      expect(reorderStats(mockStats, 5, 1)).toEqual(mockStats);
      expect(reorderStats(mockStats, 1, 5)).toEqual(mockStats);
    });

    it('does not modify original array', () => {
      const original = [...mockStats];
      reorderStats(mockStats, 0, 2);
      
      expect(mockStats).toEqual(original);
    });
  });

  describe('startDrag', () => {
    it('sets dragged index and clears drag over', () => {
      const dragState = initializeDragState();
      const result = startDrag(dragState, 1);
      
      expect(result.draggedIndex).toBe(1);
      expect(result.dragOverIndex).toBe(null);
    });
  });

  describe('dragOver', () => {
    it('sets drag over index', () => {
      const dragState = { draggedIndex: 0, dragOverIndex: null };
      const result = dragOver(dragState, 2);
      
      expect(result.draggedIndex).toBe(0);
      expect(result.dragOverIndex).toBe(2);
    });
  });

  describe('clearDragOver', () => {
    it('clears drag over index', () => {
      const dragState = { draggedIndex: 0, dragOverIndex: 2 };
      const result = clearDragOver(dragState);
      
      expect(result.draggedIndex).toBe(0);
      expect(result.dragOverIndex).toBe(null);
    });
  });

  describe('endDrag', () => {
    it('clears all drag state', () => {
      const result = endDrag();
      
      expect(result.draggedIndex).toBe(null);
      expect(result.dragOverIndex).toBe(null);
    });
  });

  describe('handleDrop', () => {
    it('handles successful drop with reordering', () => {
      const dragState = { draggedIndex: 0, dragOverIndex: null };
      const result = handleDrop(mockStats, dragState, 2);
      
      expect(result.stats[2].statId).toBe('health');
      expect(result.dragState).toEqual(endDrag());
    });

    it('handles drop on same position', () => {
      const dragState = { draggedIndex: 1, dragOverIndex: null };
      const result = handleDrop(mockStats, dragState, 1);
      
      expect(result.stats).toEqual(mockStats);
      expect(result.dragState).toEqual(endDrag());
    });

    it('handles drop with null dragged index', () => {
      const dragState = { draggedIndex: null, dragOverIndex: null };
      const result = handleDrop(mockStats, dragState, 2);
      
      expect(result.stats).toEqual(mockStats);
      expect(result.dragState).toEqual(endDrag());
    });
  });

  describe('getAvailableStats', () => {
    it('returns unused stats', () => {
      const result = getAvailableStats(mockDefinitions, mockStats);
      
      expect(result).toHaveLength(2);
      expect(result.find(s => s.id === 'magic')).toBeDefined();
      expect(result.find(s => s.id === 'custom_stat')).toBeDefined();
    });

    it('handles empty used stats', () => {
      const result = getAvailableStats(mockDefinitions, []);
      
      expect(result).toEqual(mockDefinitions);
    });

    it('handles all stats used', () => {
      const allUsed = mockDefinitions.map(def => ({ statId: def.id, value: 10 }));
      const result = getAvailableStats(mockDefinitions, allUsed);
      
      expect(result).toEqual([]);
    });
  });

  describe('getUsedStatIds', () => {
    it('returns set of used stat IDs', () => {
      const result = getUsedStatIds(mockStats);
      
      expect(result).toEqual(new Set(['health', 'attack', 'defense']));
    });

    it('handles empty stats', () => {
      const result = getUsedStatIds([]);
      
      expect(result).toEqual(new Set());
    });
  });

  describe('isStatUsed', () => {
    it('returns true for used stat', () => {
      expect(isStatUsed('health', mockStats)).toBe(true);
    });

    it('returns false for unused stat', () => {
      expect(isStatUsed('magic', mockStats)).toBe(false);
    });
  });

  describe('findStatDefinition', () => {
    it('finds existing definition', () => {
      const result = findStatDefinition('health', mockDefinitions);
      
      expect(result).toEqual(mockDefinitions[0]);
    });

    it('returns undefined for non-existent definition', () => {
      const result = findStatDefinition('nonexistent', mockDefinitions);
      
      expect(result).toBeUndefined();
    });
  });

  describe('getStatLabel', () => {
    it('returns label from definition', () => {
      const result = getStatLabel('health', mockDefinitions);
      
      expect(result).toBe('Health');
    });

    it('returns stat ID when definition not found', () => {
      const result = getStatLabel('unknown', mockDefinitions);
      
      expect(result).toBe('unknown');
    });
  });

  describe('getStatIcon', () => {
    it('returns icon from definition', () => {
      const result = getStatIcon('health', mockDefinitions);
      
      expect(result).toBe('heart');
    });

    it('returns default icon when definition not found', () => {
      const result = getStatIcon('unknown', mockDefinitions);
      
      expect(result).toBe('question-mark');
    });
  });

  describe('groupStatsByCategory', () => {
    it('groups stats by category', () => {
      const result = groupStatsByCategory(mockDefinitions);
      
      expect(result['Core']).toHaveLength(1);
      expect(result['Combat']).toHaveLength(2);
      expect(result['Special']).toHaveLength(1);
      expect(result['Custom']).toHaveLength(1);
    });

    it('handles stats without category', () => {
      const statsWithoutCategory = [
        { id: 'test', label: 'Test', icon: 'star' } as StatDefinition
      ];
      
      const result = groupStatsByCategory(statsWithoutCategory);
      
      expect(result['Other']).toHaveLength(1);
    });
  });

  describe('validateCustomStat', () => {
    it('validates correct custom stat', () => {
      const result = validateCustomStat('My Custom Stat', 'star');
      
      expect(result.isValid).toBe(true);
    });

    it('rejects empty label', () => {
      const result = validateCustomStat('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Custom stat label is required');
    });

    it('rejects whitespace-only label', () => {
      const result = validateCustomStat('   ');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Custom stat label is required');
    });

    it('rejects too short label', () => {
      const result = validateCustomStat('A');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Label must be at least 2 characters');
    });

    it('rejects too long label', () => {
      const longLabel = 'A'.repeat(51);
      const result = validateCustomStat(longLabel);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Label cannot exceed 50 characters');
    });

    it('accepts label at boundaries', () => {
      expect(validateCustomStat('AB').isValid).toBe(true);
      expect(validateCustomStat('A'.repeat(50)).isValid).toBe(true);
    });
  });

  describe('createCustomStatDefinition', () => {
    it('creates custom stat with all fields', () => {
      const result = createCustomStatDefinition('test', 'Test Stat', 'gear', 'Special');
      
      expect(result).toEqual({
        id: 'test',
        label: 'Test Stat',
        icon: 'gear',
        category: 'Special'
      });
    });

    it('uses default values for optional fields', () => {
      const result = createCustomStatDefinition('test', 'Test Stat');
      
      expect(result.icon).toBe('star');
      expect(result.category).toBe('Custom');
    });

    it('trims input values', () => {
      const result = createCustomStatDefinition('  test  ', '  Test Stat  ', '  gear  ', '  Special  ');
      
      expect(result.id).toBe('test');
      expect(result.label).toBe('Test Stat');
      expect(result.icon).toBe('gear');
      expect(result.category).toBe('Special');
    });

    it('handles empty icon gracefully', () => {
      const result = createCustomStatDefinition('test', 'Test Stat', '');
      
      expect(result.icon).toBe('star');
    });
  });

  describe('generateCustomStatId', () => {
    it('generates ID from label', () => {
      const result = generateCustomStatId('My Custom Stat');
      
      expect(result).toBe('custom_my_custom_stat_1704110400000');
    });

    it('handles special characters', () => {
      const result = generateCustomStatId('Test & Special-Stat!');
      
      expect(result).toBe('custom_test_special_stat_1704110400000');
    });

    it('handles multiple spaces and underscores', () => {
      const result = generateCustomStatId('Test    Multiple___Spaces');
      
      expect(result).toBe('custom_test_multiple_spaces_1704110400000');
    });

    it('removes leading and trailing underscores', () => {
      const result = generateCustomStatId('___Test___');
      
      expect(result).toBe('custom_test_1704110400000');
    });
  });

  describe('statsChanged', () => {
    it('detects no change', () => {
      const result = statsChanged(mockStats, [...mockStats]);
      
      expect(result).toBe(false);
    });

    it('detects length change', () => {
      const modified = [...mockStats, { statId: 'magic', value: 30 }];
      const result = statsChanged(mockStats, modified);
      
      expect(result).toBe(true);
    });

    it('detects value change', () => {
      const modified = mockStats.map((stat, i) => 
        i === 0 ? { ...stat, value: 200 } : stat
      );
      const result = statsChanged(mockStats, modified);
      
      expect(result).toBe(true);
    });

    it('detects stat ID change', () => {
      const modified = mockStats.map((stat, i) => 
        i === 0 ? { ...stat, statId: 'magic' } : stat
      );
      const result = statsChanged(mockStats, modified);
      
      expect(result).toBe(true);
    });

    it('detects reordering', () => {
      const modified = [mockStats[1], mockStats[0], mockStats[2]];
      const result = statsChanged(mockStats, modified);
      
      expect(result).toBe(true);
    });
  });

  describe('sortStats', () => {
    it('sorts by label ascending', () => {
      const result = sortStats(mockStats, mockDefinitions, 'label');
      
      expect(result[0].statId).toBe('attack');  // Attack
      expect(result[1].statId).toBe('defense'); // Defense
      expect(result[2].statId).toBe('health');  // Health
    });

    it('sorts by value descending', () => {
      const result = sortStats(mockStats, mockDefinitions, 'value');
      
      expect(result[0].value).toBe(100); // health
      expect(result[1].value).toBe(75);  // attack
      expect(result[2].value).toBe(50);  // defense
    });

    it('sorts by category', () => {
      const mixedStats = [
        { statId: 'magic', value: 30 },
        { statId: 'health', value: 100 },
        { statId: 'attack', value: 75 }
      ];
      
      const result = sortStats(mixedStats, mockDefinitions, 'category');
      
      // Combat (attack) comes before Core (health) comes before Special (magic)
      expect(result[0].statId).toBe('attack');
      expect(result[1].statId).toBe('health');
      expect(result[2].statId).toBe('magic');
    });

    it('handles missing definitions gracefully', () => {
      const statsWithMissing = [
        ...mockStats,
        { statId: 'unknown', value: 25 }
      ];
      
      const result = sortStats(statsWithMissing, mockDefinitions, 'label');
      
      expect(result).toHaveLength(4);
      // Should not throw error
    });

    it('does not modify original array', () => {
      const original = [...mockStats];
      sortStats(mockStats, mockDefinitions, 'label');
      
      expect(mockStats).toEqual(original);
    });
  });

  describe('getStatsSummary', () => {
    it('calculates summary for numeric stats', () => {
      const result = getStatsSummary(mockStats);
      
      expect(result.count).toBe(3);
      expect(result.hasNumericValues).toBe(true);
      expect(result.totalNumericValue).toBe(225); // 100 + 75 + 50
    });

    it('handles mixed numeric and string values', () => {
      const mixedStats = [
        ...mockStats,
        { statId: 'mood', value: 'happy' },
        { statId: 'power', value: '25' } // String number
      ];
      
      const result = getStatsSummary(mixedStats);
      
      expect(result.count).toBe(5);
      expect(result.hasNumericValues).toBe(true);
      expect(result.totalNumericValue).toBe(250); // 225 + 25 from string
    });

    it('handles all non-numeric values', () => {
      const nonNumericStats = [
        { statId: 'mood', value: 'happy' },
        { statId: 'state', value: 'confused' }
      ];
      
      const result = getStatsSummary(nonNumericStats);
      
      expect(result.count).toBe(2);
      expect(result.hasNumericValues).toBe(false);
      expect(result.totalNumericValue).toBe(0);
    });

    it('handles empty stats array', () => {
      const result = getStatsSummary([]);
      
      expect(result.count).toBe(0);
      expect(result.hasNumericValues).toBe(false);
      expect(result.totalNumericValue).toBe(0);
    });

    it('handles zero values correctly', () => {
      const statsWithZero = [
        { statId: 'health', value: 0 },
        { statId: 'attack', value: 10 }
      ];
      
      const result = getStatsSummary(statsWithZero);
      
      expect(result.hasNumericValues).toBe(true);
      expect(result.totalNumericValue).toBe(10);
    });
  });
});
