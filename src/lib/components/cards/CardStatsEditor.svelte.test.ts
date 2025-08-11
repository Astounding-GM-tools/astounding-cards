import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initializeStatsEditorState,
  initializeDragState,
  resetStatsEditorState,
  updateStatsEditorState,
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
  findStatDefinition,
  getStatLabel,
  getStatIcon,
  groupStatsByCategory,
  statsChanged,
  type StatsEditorState,
  type DragState
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

  describe('validateStatForm', () => {
    it('validates correct form data', () => {
      const data = { statId: 'magic', value: 25 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects empty stat ID', () => {
      const data = { statId: '', value: 25 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please select a stat type');
    });

    it('rejects whitespace-only stat ID', () => {
      const data = { statId: '   ', value: 25 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please select a stat type');
    });

    it('rejects empty value', () => {
      const data = { statId: 'magic', value: '' };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a value');
    });

    it('rejects null value', () => {
      const data = { statId: 'magic', value: null as any };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a value');
    });

    it('rejects undefined value', () => {
      const data = { statId: 'magic', value: undefined as any };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a value');
    });

    it('rejects duplicate stat', () => {
      const data = { statId: 'health', value: 25 };
      const result = validateStatForm(data, mockStats);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This stat is already added');
    });

    it('accepts zero as valid value', () => {
      const data = { statId: 'magic', value: 0 };
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
});
