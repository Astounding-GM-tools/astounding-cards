// Logic for CardStatsEditor component
import type { CardStat, StatDefinition } from '$lib/types';

export interface StatsEditorState {
  editingStats: CardStat[];
  selectedStatId: string;
  newStatValue: string | number;
  showAddStat: boolean;
  showCustomStatForm: boolean;
  customStatLabel: string;
  customStatIcon: string;
}

export interface DragState {
  draggedIndex: number | null;
  dragOverIndex: number | null;
}

export interface StatFormData {
  statId: string;
  value: string | number;
}

export interface AddStatResult {
  success: boolean;
  error?: string;
}

/**
 * Initialize stats editor state with default values
 */
export function initializeStatsEditorState(currentStats: CardStat[] = []): StatsEditorState {
  return {
    editingStats: [...currentStats],
    selectedStatId: '',
    newStatValue: '',
    showAddStat: false,
    showCustomStatForm: false,
    customStatLabel: '',
    customStatIcon: ''
  };
}

/**
 * Initialize drag state
 */
export function initializeDragState(): DragState {
  return {
    draggedIndex: null,
    dragOverIndex: null
  };
}

/**
 * Reset stats editor state to defaults
 */
export function resetStatsEditorState(state: StatsEditorState): StatsEditorState {
  return {
    ...state,
    selectedStatId: '',
    newStatValue: '',
    showAddStat: false,
    showCustomStatForm: false,
    customStatLabel: '',
    customStatIcon: ''
  };
}

/**
 * Update stats editor state with new values
 */
export function updateStatsEditorState(
  state: StatsEditorState,
  updates: Partial<StatsEditorState>
): StatsEditorState {
  return { ...state, ...updates };
}

/**
 * Check if a stat already exists in the current stats
 */
export function statExists(stats: CardStat[], statId: string): boolean {
  return stats.some(stat => stat.statId === statId);
}

/**
 * Validate stat form data before adding
 */
export function validateStatForm(data: StatFormData, existingStats: CardStat[]): {
  isValid: boolean;
  error?: string;
} {
  if (!data.statId.trim()) {
    return { isValid: false, error: 'Please select a stat type' };
  }

  if (data.value === '' || data.value === null || data.value === undefined) {
    return { isValid: false, error: 'Please enter a value' };
  }

  if (statExists(existingStats, data.statId)) {
    return { isValid: false, error: 'This stat is already added' };
  }

  return { isValid: true };
}

/**
 * Add a new stat to the stats array
 */
export function addStatToArray(stats: CardStat[], statId: string, value: string | number): CardStat[] {
  // Validate first
  const validation = validateStatForm({ statId, value }, stats);
  if (!validation.isValid) {
    return stats; // Return unchanged if invalid
  }

  return [...stats, { statId, value }];
}

/**
 * Remove a stat from the stats array
 */
export function removeStatFromArray(stats: CardStat[], statIdToRemove: string): CardStat[] {
  return stats.filter(stat => stat.statId !== statIdToRemove);
}

/**
 * Update a stat's value in the stats array
 */
export function updateStatInArray(
  stats: CardStat[],
  statId: string,
  newValue: string | number
): CardStat[] {
  return stats.map(stat => 
    stat.statId === statId ? { ...stat, value: newValue } : stat
  );
}

/**
 * Reorder stats array using drag and drop indices
 */
export function reorderStats(
  stats: CardStat[],
  fromIndex: number,
  toIndex: number
): CardStat[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return stats;
  }

  if (fromIndex >= stats.length || toIndex >= stats.length) {
    return stats;
  }

  const newStats = [...stats];
  const [movedStat] = newStats.splice(fromIndex, 1);
  newStats.splice(toIndex, 0, movedStat);
  
  return newStats;
}

/**
 * Start drag operation
 */
export function startDrag(dragState: DragState, index: number): DragState {
  return {
    ...dragState,
    draggedIndex: index,
    dragOverIndex: null
  };
}

/**
 * Handle drag over
 */
export function dragOver(dragState: DragState, index: number): DragState {
  return {
    ...dragState,
    dragOverIndex: index
  };
}

/**
 * Clear drag over state
 */
export function clearDragOver(dragState: DragState): DragState {
  return {
    ...dragState,
    dragOverIndex: null
  };
}

/**
 * End drag operation
 */
export function endDrag(): DragState {
  return {
    draggedIndex: null,
    dragOverIndex: null
  };
}

/**
 * Handle drop operation and reorder stats
 */
export function handleDrop(
  stats: CardStat[],
  dragState: DragState,
  dropIndex: number
): {
  stats: CardStat[];
  dragState: DragState;
} {
  if (dragState.draggedIndex === null || dragState.draggedIndex === dropIndex) {
    return {
      stats,
      dragState: endDrag()
    };
  }

  return {
    stats: reorderStats(stats, dragState.draggedIndex, dropIndex),
    dragState: endDrag()
  };
}

/**
 * Get available stats that haven't been used yet
 */
export function getAvailableStats(
  allStats: StatDefinition[],
  usedStats: CardStat[]
): StatDefinition[] {
  const usedStatIds = new Set(usedStats.map(stat => stat.statId));
  return allStats.filter(stat => !usedStatIds.has(stat.id));
}

/**
 * Get stats that are currently in use
 */
export function getUsedStatIds(stats: CardStat[]): Set<string> {
  return new Set(stats.map(stat => stat.statId));
}

/**
 * Check if a stat definition is already used
 */
export function isStatUsed(statId: string, usedStats: CardStat[]): boolean {
  return usedStats.some(stat => stat.statId === statId);
}

/**
 * Find stat definition by ID
 */
export function findStatDefinition(
  statId: string,
  definitions: StatDefinition[]
): StatDefinition | undefined {
  return definitions.find(def => def.id === statId);
}

/**
 * Get stat label from definition or fallback to ID
 */
export function getStatLabel(
  statId: string,
  definitions: StatDefinition[]
): string {
  const definition = findStatDefinition(statId, definitions);
  return definition?.label || statId;
}

/**
 * Get stat icon from definition or fallback
 */
export function getStatIcon(
  statId: string,
  definitions: StatDefinition[]
): string {
  const definition = findStatDefinition(statId, definitions);
  return definition?.icon || 'question-mark';
}

/**
 * Group stats by category for display
 */
export function groupStatsByCategory(
  stats: StatDefinition[]
): Record<string, StatDefinition[]> {
  return stats.reduce((acc, stat) => {
    const category = stat.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(stat);
    return acc;
  }, {} as Record<string, StatDefinition[]>);
}

/**
 * Validate custom stat data
 */
export function validateCustomStat(label: string, icon?: string): {
  isValid: boolean;
  error?: string;
} {
  if (!label.trim()) {
    return { isValid: false, error: 'Custom stat label is required' };
  }

  if (label.trim().length < 2) {
    return { isValid: false, error: 'Label must be at least 2 characters' };
  }

  if (label.trim().length > 50) {
    return { isValid: false, error: 'Label cannot exceed 50 characters' };
  }

  return { isValid: true };
}

/**
 * Create a custom stat definition
 */
export function createCustomStatDefinition(
  id: string,
  label: string,
  icon: string = 'star',
  category: string = 'Custom'
): StatDefinition {
  return {
    id: id.trim(),
    label: label.trim(),
    icon: icon.trim() || 'star',
    category: category.trim() || 'Custom'
  };
}

/**
 * Generate a unique stat ID for custom stats
 */
export function generateCustomStatId(label: string): string {
  const baseId = label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  return `custom_${baseId}_${Date.now()}`;
}

/**
 * Check if stats have changed compared to original
 */
export function statsChanged(original: CardStat[], current: CardStat[]): boolean {
  if (original.length !== current.length) {
    return true;
  }

  // Check if any stat ID or value has changed
  for (let i = 0; i < original.length; i++) {
    if (original[i].statId !== current[i].statId || 
        original[i].value !== current[i].value) {
      return true;
    }
  }

  return false;
}

/**
 * Sort stats by a given criteria
 */
export function sortStats(
  stats: CardStat[],
  definitions: StatDefinition[],
  sortBy: 'label' | 'value' | 'category' = 'label'
): CardStat[] {
  return [...stats].sort((a, b) => {
    const defA = findStatDefinition(a.statId, definitions);
    const defB = findStatDefinition(b.statId, definitions);

    switch (sortBy) {
      case 'label':
        const labelA = defA?.label || a.statId;
        const labelB = defB?.label || b.statId;
        return labelA.localeCompare(labelB);
      
      case 'value':
        const valueA = typeof a.value === 'number' ? a.value : parseFloat(String(a.value)) || 0;
        const valueB = typeof b.value === 'number' ? b.value : parseFloat(String(b.value)) || 0;
        return valueB - valueA; // Descending order
      
      case 'category':
        const categoryA = defA?.category || 'Other';
        const categoryB = defB?.category || 'Other';
        return categoryA.localeCompare(categoryB);
      
      default:
        return 0;
    }
  });
}

/**
 * Get stats summary for display
 */
export function getStatsSummary(stats: CardStat[]): {
  count: number;
  hasNumericValues: boolean;
  totalNumericValue: number;
} {
  const count = stats.length;
  let hasNumericValues = false;
  let totalNumericValue = 0;

  for (const stat of stats) {
    const numValue = typeof stat.value === 'number' ? stat.value : parseFloat(String(stat.value));
    if (!isNaN(numValue)) {
      hasNumericValues = true;
      totalNumericValue += numValue;
    }
  }

  return {
    count,
    hasNumericValues,
    totalNumericValue
  };
}
