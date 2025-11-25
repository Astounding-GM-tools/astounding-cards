// Card stats and types
export type CardSize = 'poker' | 'tarot';

// Flexible stats system types (imported from stats.ts)
export interface StatDefinition {
	id: string; // Unique identifier: 'attack', 'defense', 'custom-magic'
	label: string; // Display name: 'Attack', 'Defense', 'Magic Power'
	icon: string; // Icon filename without extension: 'attack', 'defense'
	category: string; // Grouping: 'combat', 'physical', 'magic', 'utility', 'custom'
}

export interface CardStat {
	statId: string; // References StatDefinition.id
	value: string | number; // The actual stat value
}

// Game mechanics system types (back card) - simplified for GM reference cards
export enum MechanicType {
	DEFENSE = 'defense', // AC, Dodge, Armor rating
	INITIATIVE = 'initiative', // Turn order, speed bonus
	MOVEMENT = 'movement', // Movement rate, zones
	ATTACK = 'attack', // Weapons, offensive abilities
	HEALTH = 'health', // HP, Stress, vitality tracking
	RESOURCE = 'resource' // Ammo, spell slots, limited abilities
}

export interface CardMechanic {
	id: string;
	name: string; // "Longsword", "Hit Points", "Bullets"
	value: string | number; // "+5, 1d8+3 slashing", 25, "AC 18"
	description?: string; // "ring mail and shield", "crossbow bolts"
	tracked: boolean; // true = render tracking boxes for printed cards
	type: MechanicType; // Category for UI organization
}

// Simple vocabulary type for easy editing
export type StatblockVocabulary = Record<string, string>;

// Deck-level statblock configuration system
export interface StatblockConfig {
	id: string;
	name: string; // "Traditional RPG", "OSR Style", etc.
	description?: string;

	// Vocabulary mapping - customize display names for MechanicTypes
	vocabulary: {
		[K in MechanicType]: {
			name: string; // "Health" or "Hit Points" or "Stress"
			defaultValue: string | number; // Default value when adding this type
			tracked?: boolean; // Default tracking state
		};
	};

	// Metadata
	isOfficial: boolean;
	created: Date;
	updated: Date;
}

// Game preset system - DEPRECATED, keeping for migration
export interface GamePreset {
	id: string;
	name: string; // "GM Reference", "Old School Revival", etc.
	description?: string;
	version: string;
	author?: string;

	// Front card stats (attributes, skills, etc.)
	frontStats: StatDefinition[];

	// Back card mechanics (armor class, hit points, saves, etc.)
	backMechanics: CardMechanic[];

	// Metadata
	isOfficial: boolean; // Curated vs user-created
	tags: string[]; // "fantasy", "modern", "horror", "sci-fi"
	created: Date;
	updated: Date;
}

// Legacy types - kept for migration
export type Portability = 'negligible' | 'light' | 'medium' | 'heavy' | 'stationary';

export type AreaReference = {
	type: 'hard' | 'soft';
	value: string; // Card ID for hard links, area name for soft links
};

export type LegacyCardStat =
	| {
			type: 'character';
			value: string; // age
	  }
	| {
			type: 'item';
			value: Portability;
	  }
	| {
			type: 'location';
			value: AreaReference;
	  };

// Optional ruleset reference for game systems
export type RulesetRef = {
	name: string; // e.g. "D&D 5E", "Pathfinder 2E", etc.
	url?: string; // Optional link to ruleset documentation/reference
};

// Base card type
export interface Card {
	id: string;
	name: string;
	role: string;
	image: string | null;
	imageBlob?: Blob;
	traits: string[];
	secrets: string[];
	desc: string;
	type: 'character' | 'location' | 'item' | string;

	// NEW flexible stats system (replaces stat)
	stats?: CardStat[]; // Array of icon+value pairs for front card

	// NEW flexible mechanics system for back card
	mechanics?: CardMechanic[]; // Array of game mechanics for back card

	// LEGACY - kept for migration
	stat?: LegacyCardStat;

	theme?: string; // Override deck theme
	gameStats?: { [key: string]: string | number }; // Flexible game system stats (back card) - DEPRECATED
}

// Deck type
export interface Deck {
	id: string;
	meta: {
		name: string;
		theme: string;
		cardSize: CardSize;
		lastEdited: number;
		createdAt: number;
		description?: string;
		tags?: string[];
		rulesetRef?: RulesetRef;
		customStats?: StatDefinition[]; // Deck-specific custom stat definitions
		statblockConfigId?: string; // Reference to StatblockConfig for this deck
	};
	cards: Card[];
}

// Validation types
export type ValidationError = {
	field: string;
	message: string;
};

// Validation functions
export function validateCard(card: Partial<Card>): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!card.name?.trim()) {
		errors.push({ field: 'name', message: 'Name is required' });
	}

	if (!card.role?.trim()) {
		errors.push({ field: 'role', message: 'Role is required' });
	}

	if (!card.desc?.trim()) {
		errors.push({ field: 'desc', message: 'Description is required' });
	}

	if (!Array.isArray(card.traits)) {
		errors.push({ field: 'traits', message: 'Traits must be an array' });
	}

	if (!Array.isArray(card.secrets)) {
		errors.push({ field: 'secrets', message: 'Secrets must be an array' });
	}

	if (!card.type) {
		errors.push({ field: 'type', message: 'Card type is required' });
	}

	// Validate new stats array
	if (card.stats) {
		if (!Array.isArray(card.stats)) {
			errors.push({ field: 'stats', message: 'Stats must be an array' });
		} else {
			card.stats.forEach((stat, index) => {
				if (!stat.statId || typeof stat.statId !== 'string') {
					errors.push({ field: `stats[${index}].statId`, message: 'Stat ID is required' });
				}
				if (stat.value === undefined || stat.value === null) {
					errors.push({ field: `stats[${index}].value`, message: 'Stat value is required' });
				}
			});
		}
	}

	// Validate new mechanics array
	if (card.mechanics) {
		if (!Array.isArray(card.mechanics)) {
			errors.push({ field: 'mechanics', message: 'Mechanics must be an array' });
		} else {
			card.mechanics.forEach((mechanic, index) => {
				if (!mechanic.id || typeof mechanic.id !== 'string') {
					errors.push({ field: `mechanics[${index}].id`, message: 'Mechanic ID is required' });
				}
				if (!mechanic.name || typeof mechanic.name !== 'string') {
					errors.push({ field: `mechanics[${index}].name`, message: 'Mechanic name is required' });
				}
				if (mechanic.value === undefined || mechanic.value === null) {
					errors.push({
						field: `mechanics[${index}].value`,
						message: 'Mechanic value is required'
					});
				}
				if (!Object.values(MechanicType).includes(mechanic.type)) {
					errors.push({ field: `mechanics[${index}].type`, message: 'Invalid mechanic type' });
				}
			});
		}
	}

	// Legacy validation - keep during migration
	if (card.stat) {
		// Legacy validation logic (simplified)
	}

	// Optional fields don't need validation unless present
	if (card.theme !== undefined && typeof card.theme !== 'string') {
		errors.push({ field: 'theme', message: 'Theme must be a string' });
	}

	if (card.gameStats !== undefined && typeof card.gameStats !== 'object') {
		errors.push({ field: 'gameStats', message: 'Game stats must be an object' });
	}

	return errors;
}

export function validateDeck(deck: Partial<Deck>, allowEmpty = false): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!deck.meta?.name?.trim()) {
		errors.push({ field: 'meta.name', message: 'Deck name is required' });
	}

	if (!deck.meta?.theme?.trim()) {
		errors.push({ field: 'meta.theme', message: 'Theme is required' });
	}

	if (!deck.meta?.cardSize || !['poker', 'tarot'].includes(deck.meta.cardSize)) {
		errors.push({ field: 'meta.cardSize', message: 'Invalid card size' });
	}

	if (!Array.isArray(deck.cards)) {
		errors.push({ field: 'cards', message: 'Cards must be an array' });
	} else if (!allowEmpty && deck.cards.length === 0) {
		errors.push({ field: 'cards', message: 'At least one card is required' });
	}

	// Optional fields don't need validation unless present
	if (deck.meta?.description !== undefined && typeof deck.meta.description !== 'string') {
		errors.push({ field: 'meta.description', message: 'Description must be a string' });
	}

	if (deck.meta?.tags !== undefined && !Array.isArray(deck.meta.tags)) {
		errors.push({ field: 'meta.tags', message: 'Tags must be an array' });
	}

	if (deck.meta?.rulesetRef !== undefined) {
		if (typeof deck.meta.rulesetRef !== 'object') {
			errors.push({ field: 'meta.rulesetRef', message: 'Ruleset reference must be an object' });
		} else if (!deck.meta.rulesetRef.name) {
			errors.push({ field: 'meta.rulesetRef.name', message: 'Ruleset name is required' });
		}
	}

	// Validate each card
	if (deck.cards?.length) {
		deck.cards.forEach((card, index) => {
			const cardErrors = validateCard(card);
			if (cardErrors.length > 0) {
				errors.push({
					field: `cards[${index}]`,
					message: `Invalid card: ${cardErrors.map((e) => e.message).join(', ')}`
				});
			}
		});
	}

	return errors;
}

// Type guards
export function isCard(card: unknown): card is Card {
	return (
		typeof card === 'object' &&
		card !== null &&
		typeof (card as Card).id === 'string' &&
		typeof (card as Card).name === 'string' &&
		typeof (card as Card).role === 'string' &&
		typeof (card as Card).desc === 'string' &&
		typeof (card as Card).type === 'string' &&
		Array.isArray((card as Card).traits) &&
		Array.isArray((card as Card).secrets) &&
		(card as Card).traits.every((trait) => typeof trait === 'string') &&
		(card as Card).secrets.every((secret) => typeof secret === 'string')
	);
}

export function isDeck(deck: unknown): deck is Deck {
	return (
		typeof deck === 'object' &&
		deck !== null &&
		typeof (deck as Deck).id === 'string' &&
		typeof (deck as Deck).meta === 'object' &&
		typeof (deck as Deck).meta.name === 'string' &&
		typeof (deck as Deck).meta.theme === 'string' &&
		Array.isArray((deck as Deck).cards) &&
		(deck as Deck).cards.every(isCard)
	);
}
