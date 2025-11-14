// Flexible Card Stats System
// Replaces the complex CardStat with simple, extensible icon+value pairs

import type { StatDefinition, CardStat } from './types';

// Common stat definitions - these are built into the system
export const COMMON_STATS: StatDefinition[] = [
	// Combat Stats
	{ id: 'attack', label: 'Attack', icon: 'attack', category: 'combat' },
	{ id: 'defense', label: 'Defense', icon: 'defense', category: 'combat' },
	{ id: 'damage', label: 'Damage', icon: 'damage', category: 'combat' },
	{ id: 'health', label: 'Health', icon: 'health', category: 'combat' },

	// Physical Stats
	{ id: 'age', label: 'Age', icon: 'age', category: 'physical' },
	{ id: 'speed', label: 'Speed', icon: 'speed', category: 'physical' },
	{ id: 'weight', label: 'Weight', icon: 'weight', category: 'physical' },

	// Magic/Fantasy Stats
	{ id: 'mana', label: 'Mana', icon: 'mana', category: 'magic' },
	{ id: 'level', label: 'Level', icon: 'level', category: 'magic' },

	// Utility Stats
	{ id: 'value', label: 'Value', icon: 'value', category: 'utility' },
	{ id: 'rarity', label: 'Rarity', icon: 'rarity', category: 'utility' },
	{ id: 'area', label: 'Area', icon: 'area', category: 'utility' }
];

// Helper functions
export function getStatDefinition(
	statId: string,
	customStats: StatDefinition[] = []
): StatDefinition | undefined {
	return [...COMMON_STATS, ...customStats].find((stat) => stat.id === statId);
}

export function getStatsByCategory(customStats: StatDefinition[] = []): {
	[category: string]: StatDefinition[];
} {
	const allStats = [...COMMON_STATS, ...customStats];
	const grouped: { [category: string]: StatDefinition[] } = {};

	for (const stat of allStats) {
		if (!grouped[stat.category]) {
			grouped[stat.category] = [];
		}
		grouped[stat.category].push(stat);
	}

	return grouped;
}

export function createCustomStatId(label: string): string {
	// Convert label to kebab-case ID
	return label
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, '') // Remove special chars
		.replace(/\s+/g, '-') // Replace spaces with dashes
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

export function validateStatId(id: string): boolean {
	return /^[a-z0-9-]+$/.test(id) && id.length > 0 && id.length <= 50;
}
