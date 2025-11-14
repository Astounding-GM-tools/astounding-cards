// Default statblock configurations for different RPG system styles
import type { StatblockConfig, StatblockVocabulary } from './types';
import { MechanicType } from './types';

// Default "Modern RPG" configuration - what we currently use
export const defaultConfig: StatblockConfig = {
	id: 'default-modern',
	name: 'Modern RPG',
	description: 'Standard terminology for contemporary RPG systems',
	vocabulary: {
		[MechanicType.HEALTH]: {
			name: 'Health',
			defaultValue: 15,
			tracked: true
		},
		[MechanicType.DEFENSE]: {
			name: 'Defense',
			defaultValue: 12,
			tracked: false
		},
		[MechanicType.INITIATIVE]: {
			name: 'Initiative',
			defaultValue: '+1',
			tracked: false
		},
		[MechanicType.MOVEMENT]: {
			name: 'Movement',
			defaultValue: '30 ft',
			tracked: false
		},
		[MechanicType.ATTACK]: {
			name: 'Attack',
			defaultValue: '+3',
			tracked: false
		},
		[MechanicType.RESOURCE]: {
			name: 'Resource',
			defaultValue: 5,
			tracked: true
		}
	},
	isOfficial: true,
	created: new Date(),
	updated: new Date()
};

// OSR-style configuration
export const osrConfig: StatblockConfig = {
	id: 'osr-classic',
	name: 'Old School Revival',
	description: 'Classic RPG terminology with traditional mechanics',
	vocabulary: {
		[MechanicType.HEALTH]: {
			name: 'Hit Dice',
			defaultValue: '3+1',
			tracked: false
		},
		[MechanicType.DEFENSE]: {
			name: 'Armor Class',
			defaultValue: 15,
			tracked: false
		},
		[MechanicType.INITIATIVE]: {
			name: 'Initiative',
			defaultValue: '+1',
			tracked: false
		},
		[MechanicType.MOVEMENT]: {
			name: 'Movement',
			defaultValue: "120' (40')",
			tracked: false
		},
		[MechanicType.ATTACK]: {
			name: 'Attack Bonus',
			defaultValue: '+2',
			tracked: false
		},
		[MechanicType.RESOURCE]: {
			name: 'Special',
			defaultValue: '1/day',
			tracked: false
		}
	},
	isOfficial: true,
	created: new Date(),
	updated: new Date()
};

// Narrative/Story game configuration
export const narrativeConfig: StatblockConfig = {
	id: 'narrative-story',
	name: 'Narrative Systems',
	description: 'Story-focused terminology for narrative RPG systems',
	vocabulary: {
		[MechanicType.HEALTH]: {
			name: 'Stress',
			defaultValue: 4,
			tracked: true
		},
		[MechanicType.DEFENSE]: {
			name: 'Composure',
			defaultValue: 2,
			tracked: false
		},
		[MechanicType.INITIATIVE]: {
			name: 'Reflexes',
			defaultValue: 'Good',
			tracked: false
		},
		[MechanicType.MOVEMENT]: {
			name: 'Mobility',
			defaultValue: 'Average',
			tracked: false
		},
		[MechanicType.ATTACK]: {
			name: 'Force',
			defaultValue: 'Fair',
			tracked: false
		},
		[MechanicType.RESOURCE]: {
			name: 'Fate Points',
			defaultValue: 3,
			tracked: true
		}
	},
	isOfficial: true,
	created: new Date(),
	updated: new Date()
};

// Investigation/Horror systems (like Trail of Cthulhu, etc.)
export const investigationConfig: StatblockConfig = {
	id: 'investigation-horror',
	name: 'Investigation Systems',
	description: 'Resource-based terminology for investigation and horror RPGs',
	vocabulary: {
		[MechanicType.HEALTH]: {
			name: 'Stability',
			defaultValue: 8,
			tracked: true
		},
		[MechanicType.DEFENSE]: {
			name: 'Sense Trouble',
			defaultValue: 6,
			tracked: false
		},
		[MechanicType.INITIATIVE]: {
			name: 'Athletics',
			defaultValue: 4,
			tracked: false
		},
		[MechanicType.MOVEMENT]: {
			name: 'Athletics',
			defaultValue: 4,
			tracked: false
		},
		[MechanicType.ATTACK]: {
			name: 'Scuffling',
			defaultValue: 3,
			tracked: false
		},
		[MechanicType.RESOURCE]: {
			name: 'Investigative Pool',
			defaultValue: 12,
			tracked: true
		}
	},
	isOfficial: true,
	created: new Date(),
	updated: new Date()
};

// All official configurations
export const officialConfigs: StatblockConfig[] = [
	defaultConfig,
	osrConfig,
	narrativeConfig,
	investigationConfig
];

// Utility functions
export function getConfigById(id: string): StatblockConfig | undefined {
	return officialConfigs.find((config) => config.id === id);
}

export function getDefaultConfig(): StatblockConfig {
	return defaultConfig;
}

// Create a new custom configuration based on an existing one
export function createCustomConfig(
	basedOn: StatblockConfig,
	name: string,
	description?: string
): StatblockConfig {
	return {
		id: crypto.randomUUID(),
		name,
		description: description || `Custom configuration based on ${basedOn.name}`,
		vocabulary: { ...basedOn.vocabulary }, // Deep copy the vocabulary
		isOfficial: false,
		created: new Date(),
		updated: new Date()
	};
}

// Helper to get the vocabulary for a mechanic type from a config
export function getVocabularyForType(
	config: StatblockConfig,
	type: MechanicType
): { name: string; defaultValue: string | number; tracked?: boolean } {
	return config.vocabulary[type];
}

// Helper to create a new mechanic using the config's vocabulary
export function createMechanicFromConfig(
	config: StatblockConfig,
	type: MechanicType
): Omit<import('./types').CardMechanic, 'id'> {
	const vocab = getVocabularyForType(config, type);
	return {
		name: vocab.name,
		value: vocab.defaultValue,
		description: '',
		tracked: vocab.tracked ?? false,
		type
	};
}

// Convert complex StatblockConfig vocabulary to simple StatblockVocabulary for editing
export function configToSimpleVocabulary(config: StatblockConfig): StatblockVocabulary {
	const simple: StatblockVocabulary = {};

	// Convert default mechanic types
	Object.entries(config.vocabulary).forEach(([mechanicType, vocab]) => {
		simple[mechanicType] = vocab.name;
	});

	return simple;
}

// Convert simple StatblockVocabulary back to complex vocabulary structure
export function simpleVocabularyToConfig(
	simpleVocab: StatblockVocabulary,
	baseConfig: StatblockConfig = defaultConfig
): StatblockConfig['vocabulary'] {
	const complexVocab: StatblockConfig['vocabulary'] = {} as StatblockConfig['vocabulary'];

	// Handle default mechanic types
	Object.values(MechanicType).forEach((mechanicType) => {
		const baseVocab = baseConfig.vocabulary[mechanicType];
		complexVocab[mechanicType] = {
			name: simpleVocab[mechanicType] || baseVocab.name,
			defaultValue: baseVocab.defaultValue,
			tracked: baseVocab.tracked
		};
	});

	return complexVocab;
}
