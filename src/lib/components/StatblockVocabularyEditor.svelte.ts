// Logic for StatblockVocabularyEditor component
import type { StatblockVocabulary } from '$lib/types';
import { getDefaultConfig, configToSimpleVocabulary } from '$lib/statblockConfigs';

export interface CustomStat {
  key: string;
  label: string;
}

export interface VocabularyEditorState {
  workingVocabulary: StatblockVocabulary;
  customStats: CustomStat[];
}

/**
 * Initialize the vocabulary editor state with the provided vocabulary
 */
export function initializeEditorState(vocabulary?: StatblockVocabulary): VocabularyEditorState {
  const defaultVocab = configToSimpleVocabulary(getDefaultConfig());
  const workingVocabulary = vocabulary ? { ...vocabulary } : { ...defaultVocab };
  
  const defaultStatKeys = Object.keys(defaultVocab);
  const customStats = Object.entries(workingVocabulary)
    .filter(([key]) => !defaultStatKeys.includes(key))
    .map(([key, label]) => ({ key, label }));

  return {
    workingVocabulary,
    customStats
  };
}

/**
 * Get the default vocabulary configuration
 */
export function getDefaultVocabulary(): StatblockVocabulary {
  return configToSimpleVocabulary(getDefaultConfig());
}

/**
 * Add a new custom stat to the editor state
 */
export function addCustomStat(state: VocabularyEditorState): VocabularyEditorState {
  const newKey = `custom_${Date.now()}`;
  const newStat = { key: newKey, label: '' };
  
  return {
    workingVocabulary: {
      ...state.workingVocabulary,
      [newKey]: ''
    },
    customStats: [...state.customStats, newStat]
  };
}

/**
 * Remove a custom stat from the editor state
 */
export function removeCustomStat(state: VocabularyEditorState, index: number): VocabularyEditorState {
  if (index < 0 || index >= state.customStats.length) {
    return state;
  }

  const statToRemove = state.customStats[index];
  const updatedCustomStats = state.customStats.filter((_, i) => i !== index);
  
  const updatedVocabulary = { ...state.workingVocabulary };
  delete updatedVocabulary[statToRemove.key];

  return {
    workingVocabulary: updatedVocabulary,
    customStats: updatedCustomStats
  };
}

/**
 * Update a custom stat's label
 */
export function updateCustomStat(
  state: VocabularyEditorState,
  index: number,
  newLabel: string
): VocabularyEditorState {
  if (index < 0 || index >= state.customStats.length) {
    return state;
  }

  const updatedCustomStats = [...state.customStats];
  updatedCustomStats[index] = { ...updatedCustomStats[index], label: newLabel };

  const statKey = updatedCustomStats[index].key;
  
  return {
    workingVocabulary: {
      ...state.workingVocabulary,
      [statKey]: newLabel
    },
    customStats: updatedCustomStats
  };
}

/**
 * Update a default stat's label in the vocabulary
 */
export function updateDefaultStat(
  state: VocabularyEditorState,
  statKey: string,
  newLabel: string
): VocabularyEditorState {
  return {
    ...state,
    workingVocabulary: {
      ...state.workingVocabulary,
      [statKey]: newLabel
    }
  };
}

/**
 * Reset vocabulary to default configuration
 */
export function resetToDefaults(state: VocabularyEditorState): VocabularyEditorState {
  return {
    workingVocabulary: { ...getDefaultVocabulary() },
    customStats: []
  };
}

/**
 * Clean up vocabulary by removing empty custom stats and invalid entries
 */
export function cleanVocabulary(vocabulary: StatblockVocabulary): StatblockVocabulary {
  const defaultStatKeys = Object.keys(getDefaultVocabulary());
  const cleaned = { ...vocabulary };

  Object.keys(cleaned).forEach(key => {
    const value = cleaned[key];
    // Remove custom stats (not in defaults) that are empty or invalid
    if (!defaultStatKeys.includes(key) && 
        (!value || typeof value !== 'string' || !value.trim())) {
      delete cleaned[key];
    }
  });

  return cleaned;
}

/**
 * Validate that a vocabulary has all required fields
 */
export function validateVocabulary(vocabulary: StatblockVocabulary): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const defaultVocab = getDefaultVocabulary();
  
  // Check that all default stats are present
  Object.keys(defaultVocab).forEach(key => {
    if (!(key in vocabulary)) {
      errors.push(`Missing required stat: ${key}`);
    } else if (!vocabulary[key] || typeof vocabulary[key] !== 'string') {
      errors.push(`Invalid value for stat: ${key}`);
    }
  });

  // Check for duplicate values (excluding empty ones)
  const values = Object.values(vocabulary)
    .filter(v => v && typeof v === 'string' && v.trim())
    .map(v => v.trim().toLowerCase());
  
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate stat names: ${[...new Set(duplicates)].join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if vocabulary has changed compared to original
 */
export function hasVocabularyChanged(
  original: StatblockVocabulary,
  current: StatblockVocabulary
): boolean {
  // Compare cleaned versions to handle empty custom stats properly
  const cleanedOriginal = cleanVocabulary(original);
  const cleanedCurrent = cleanVocabulary(current);
  
  return JSON.stringify(cleanedOriginal) !== JSON.stringify(cleanedCurrent);
}

/**
 * Get all stat labels from vocabulary for preview
 */
export function getStatLabelsForPreview(vocabulary: StatblockVocabulary): string[] {
  return Object.values(vocabulary)
    .filter(label => label && typeof label === 'string' && label.trim())
    .map(label => label.trim())
    .sort();
}
