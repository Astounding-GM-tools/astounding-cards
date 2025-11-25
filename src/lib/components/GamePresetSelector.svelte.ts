import type { GamePreset } from '../types';

/**
 * State interface for GamePresetSelector component
 */
export interface GamePresetSelectorState {
	showCustom: boolean;
}

/**
 * Creates initial state for the GamePresetSelector component
 */
export function createGamePresetSelectorState(): GamePresetSelectorState {
	return {
		showCustom: false
	};
}

/**
 * Toggles the visibility of custom presets section
 */
export function toggleCustomPresets(state: GamePresetSelectorState): GamePresetSelectorState {
	return {
		...state,
		showCustom: !state.showCustom
	};
}

/**
 * Formats an array of tags into a comma-separated string for display
 * @param tags Array of tag strings
 * @returns Formatted string of tags
 */
export function formatTags(tags: string[]): string {
	return tags.join(', ');
}

/**
 * Determines the appropriate icon for a game preset based on its tags
 * @param preset Game preset to get icon for
 * @returns Emoji string representing the preset's theme
 */
export function getPresetIcon(preset: GamePreset): string {
	if (preset.tags.includes('fantasy')) return '🐉';
	if (preset.tags.includes('sci-fi')) return '🚀';
	if (preset.tags.includes('horror')) return '👻';
	if (preset.tags.includes('modern')) return '🏢';
	if (preset.tags.includes('pbta')) return '📖';
	if (preset.tags.includes('old-school')) return '📜';
	return '🎲';
}

/**
 * Creates preset statistics display string
 * @param preset Game preset to get stats for
 * @returns Formatted string showing stat and mechanic counts
 */
export function getPresetStatsText(preset: GamePreset): string {
	return `${preset.frontStats.length} stats, ${preset.backMechanics.length} mechanics`;
}
