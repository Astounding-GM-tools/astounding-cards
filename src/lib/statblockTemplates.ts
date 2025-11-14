// Statblock Templates - Contextual stat suggestions for different entity types
import type { CardMechanic } from './types';
import { MechanicType } from './types';

export interface StatblockTemplate {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: 'character' | 'item' | 'location' | 'creature' | 'spell' | 'other';
	mechanics: Omit<CardMechanic, 'id'>[]; // Templates don't have IDs yet
}

// Character templates
export const characterTemplates: StatblockTemplate[] = [
	{
		id: 'character-simple',
		name: 'Simple',
		description: 'Basic character stats',
		icon: '👤',
		category: 'character',
		mechanics: [
			{
				name: 'Health',
				value: '12',
				description: '',
				tracked: true,
				type: MechanicType.HEALTH
			},
			{
				name: 'Defense',
				value: '15',
				description: '',
				tracked: false,
				type: MechanicType.DEFENSE
			},
			{
				name: 'Attack',
				value: '+3',
				description: '',
				tracked: false,
				type: MechanicType.ATTACK
			}
		]
	},
	{
		id: 'character-advanced',
		name: 'Advanced',
		description: 'Full character stats with resources and abilities',
		icon: '🧙',
		category: 'character',
		mechanics: [
			{
				name: 'Health',
				value: '25',
				description: '',
				tracked: true,
				type: MechanicType.HEALTH
			},
			{
				name: 'Defense',
				value: '16',
				description: '',
				tracked: false,
				type: MechanicType.DEFENSE
			},
			{
				name: 'Initiative',
				value: '+2',
				description: '',
				tracked: false,
				type: MechanicType.INITIATIVE
			},
			{
				name: 'Movement',
				value: '30 ft',
				description: '',
				tracked: false,
				type: MechanicType.MOVEMENT
			},
			{
				name: 'Melee',
				value: '+5',
				description: '',
				tracked: false,
				type: MechanicType.ATTACK
			},
			{
				name: 'Ranged!',
				value: '+3',
				description: 'Cool ability name. 8 charges',
				tracked: true,
				type: MechanicType.ATTACK
			},
			{
				name: 'Spell Points',
				value: '6',
				description: '',
				tracked: true,
				type: MechanicType.RESOURCE
			}
		]
	}
];

// Item templates
export const itemTemplates: StatblockTemplate[] = [
	{
		id: 'item-weapon',
		name: 'Weapon',
		description: 'Melee or ranged weapon',
		icon: '⚔️',
		category: 'item',
		mechanics: [
			{
				name: 'Attack Bonus',
				value: '+2',
				description: '',
				tracked: false,
				type: MechanicType.ATTACK
			},
			{
				name: 'Damage',
				value: '1d8+2',
				description: '',
				tracked: false,
				type: MechanicType.ATTACK
			}
		]
	},
	{
		id: 'item-armor',
		name: 'Armor',
		description: 'Protective equipment',
		icon: '🛡️',
		category: 'item',
		mechanics: [
			{
				name: 'Armor Class',
				value: '16',
				description: '',
				tracked: false,
				type: MechanicType.DEFENSE
			}
		]
	},
	{
		id: 'item-consumable',
		name: 'Consumable',
		description: 'Potions, ammo, limited-use items',
		icon: '🧪',
		category: 'item',
		mechanics: [
			{
				name: 'Charges',
				value: '5',
				description: '',
				tracked: true,
				type: MechanicType.RESOURCE
			}
		]
	}
];

// Location templates (removed as per feedback)
export const locationTemplates: StatblockTemplate[] = [];

// Creature/NPC templates (now merged into character)
export const creatureTemplates: StatblockTemplate[] = [];

// Spell/Ability templates (simplified)
export const spellTemplates: StatblockTemplate[] = [
	{
		id: 'spell-basic',
		name: 'Ability',
		description: 'Special power or spell',
		icon: '✨',
		category: 'spell',
		mechanics: [
			{
				name: 'Attack Bonus',
				value: '+4',
				description: '',
				tracked: false,
				type: MechanicType.ATTACK
			},
			{
				name: 'Effect',
				value: '2d6 fire',
				description: '',
				tracked: false,
				type: MechanicType.ATTACK
			},
			{
				name: 'Uses',
				value: '3',
				description: 'per day',
				tracked: true,
				type: MechanicType.RESOURCE
			}
		]
	}
];

// All templates combined
export const allTemplates: StatblockTemplate[] = [
	...characterTemplates,
	...itemTemplates,
	...locationTemplates,
	...creatureTemplates,
	...spellTemplates
];

// Helper functions
export function getTemplatesByCategory(
	categories: StatblockTemplate['category'] | StatblockTemplate['category'][]
): StatblockTemplate[] {
	const categoryArray = Array.isArray(categories) ? categories : [categories];
	return allTemplates.filter((template) => categoryArray.includes(template.category));
}

export function getTemplateById(id: string): StatblockTemplate | undefined {
	return allTemplates.find((template) => template.id === id);
}

// Convert template mechanics to actual CardMechanics with IDs
export function instantiateTemplate(template: StatblockTemplate): CardMechanic[] {
	return template.mechanics.map((mechanic) => ({
		...mechanic,
		id: crypto.randomUUID()
	}));
}

// Convert template mechanics to actual CardMechanics with IDs, using custom vocabulary
export function instantiateTemplateWithVocabulary(
	template: StatblockTemplate,
	vocabulary: Record<string, string>
): CardMechanic[] {
	return template.mechanics.map((mechanic) => {
		// Use vocabulary mapping if available for this mechanic type
		const customName = vocabulary[mechanic.type];

		return {
			...mechanic,
			name: customName || mechanic.name, // Use custom name or fallback to template name
			id: crypto.randomUUID()
		};
	});
}
