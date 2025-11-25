// Game system presets with predefined stats and mechanics

import type { GamePreset, CardMechanic, StatDefinition } from './types';
import { MechanicType } from './types';
// generateId replaced with inline crypto.randomUUID() calls

// Default front card stats - minimal, universal suggestions
const defaultFrontStats: StatDefinition[] = [
	{
		id: 'role',
		label: 'Role',
		icon: 'person',
		category: 'identity'
	},
	{
		id: 'status',
		label: 'Status',
		icon: 'crown',
		category: 'identity'
	},
	{
		id: 'drive',
		label: 'Drive',
		icon: 'target',
		category: 'narrative'
	}
];

// Default back card mechanics - GM reference essentials
const defaultBackMechanics: CardMechanic[] = [
	{
		id: crypto.randomUUID(),
		name: 'Defense',
		value: 12,
		description: 'AC, Dodge, Armor',
		tracked: false,
		type: MechanicType.DEFENSE
	},
	{
		id: crypto.randomUUID(),
		name: 'Initiative',
		value: '+1',
		description: 'Turn order bonus',
		tracked: false,
		type: MechanicType.INITIATIVE
	},
	{
		id: crypto.randomUUID(),
		name: 'Movement',
		value: '30 ft',
		description: 'Movement rate',
		tracked: false,
		type: MechanicType.MOVEMENT
	},
	{
		id: crypto.randomUUID(),
		name: 'Attack',
		value: '+3, 1d6 damage',
		description: 'Primary weapon',
		tracked: false,
		type: MechanicType.ATTACK
	},
	{
		id: crypto.randomUUID(),
		name: 'Health',
		value: 15,
		description: 'Hit points',
		tracked: true,
		type: MechanicType.HEALTH
	}
];

// Default GM Reference preset
const defaultPreset: GamePreset = {
	id: 'gm-reference',
	name: 'GM Reference',
	description: 'Universal mechanics for any RPG system - adaptable reference cards for GMs',
	version: '1.0.0',
	author: 'System',
	frontStats: defaultFrontStats,
	backMechanics: defaultBackMechanics,
	isOfficial: true,
	tags: ['universal', 'gm-tools', 'reference'],
	created: new Date(),
	updated: new Date()
};

// Available presets
export const officialPresets: GamePreset[] = [defaultPreset];

// Function to initialize official presets in the database
export async function initializeOfficialPresets() {
	const { putGamePreset, getAllGamePresets } = await import('./db');

	try {
		const existing = await getAllGamePresets();
		const existingIds = existing.map((p) => p.id);

		// Only add presets that don't already exist
		for (const preset of officialPresets) {
			if (!existingIds.includes(preset.id)) {
				await putGamePreset(preset);
			}
		}

		// Official game presets initialized
	} catch (error) {
		// Surface via caller if needed; keep console clean in production
	}
}

// Utility function to get a preset by ID
export function getPresetById(id: string): GamePreset | undefined {
	return officialPresets.find((p) => p.id === id);
}

// Utility functions for creating presets
export function createPresetFromTemplate(templateId: string, name: string): GamePreset | null {
	const template = getPresetById(templateId);
	if (!template) return null;

	return {
		...template,
		id: crypto.randomUUID(),
		name,
		author: 'User',
		isOfficial: false,
		created: new Date(),
		updated: new Date()
	};
}

// Create a new custom preset template
export function createCustomPreset(
	name: string,
	description?: string,
	author?: string
): GamePreset {
	return {
		id: crypto.randomUUID(),
		name,
		description: description || 'Custom game preset',
		version: '1.0.0',
		author: author || 'User',
		frontStats: [...defaultFrontStats], // Copy default as starting point
		backMechanics: [...defaultBackMechanics], // Copy default as starting point
		isOfficial: false,
		tags: ['custom'],
		created: new Date(),
		updated: new Date()
	};
}
