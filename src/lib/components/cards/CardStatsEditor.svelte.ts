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

  if (existingStats.some(stat => stat.statId === data.statId)) {
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

