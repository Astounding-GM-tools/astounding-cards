import type { Preset } from '../types/deck';

/**
 * Defines the capabilities/features supported by each card preset.
 * This allows the UI to adapt based on what the preset actually uses,
 * rather than hardcoding preset name comparisons.
 */
export interface PresetCapabilities {
	// Display fields
	supportsTitle: boolean;
	supportsSubtitle: boolean;
	supportsDescription: boolean;
	supportsImage: boolean;

	// Data fields
	supportsStats: boolean;
	supportsTraits: boolean;

	// Layout options
	hasBackCard: boolean; // Whether preset uses card backs
}

/**
 * Define capabilities for each preset
 */
const PRESET_CAPABILITIES: Record<Preset, PresetCapabilities> = {
	minimal: {
		supportsTitle: true,
		supportsSubtitle: true,
		supportsDescription: true,
		supportsImage: true,
		supportsStats: false,
		supportsTraits: false,
		hasBackCard: true // Back shows description
	},
	trading: {
		supportsTitle: true,
		supportsSubtitle: true,
		supportsDescription: true,
		supportsImage: true,
		supportsStats: true,
		supportsTraits: true,
		hasBackCard: true // Back shows stats/traits
	}
};

/**
 * Get the capabilities for a specific preset
 */
export function getPresetCapabilities(preset: Preset): PresetCapabilities {
	return PRESET_CAPABILITIES[preset];
}

/**
 * Check if a preset supports a specific capability
 */
export function presetSupports(
	preset: Preset,
	capability: keyof PresetCapabilities
): boolean {
	return PRESET_CAPABILITIES[preset][capability];
}
