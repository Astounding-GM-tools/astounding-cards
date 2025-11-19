import type { Meta, StoryObj } from '@storybook/svelte';
import CardWithBack from './CardWithBack.example.svelte';
import type { Card as CardType } from '../../types/card';

const meta = {
	title: 'Card/CardBackContent',
	component: CardWithBack,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered'
	}
} satisfies Meta<typeof CardWithBack>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample cards with different characteristics
const dragonCard: CardType = {
	id: 'dragon-1',
	title: 'Fire Dragon',
	subtitle: 'Legendary Creature',
	description:
		'An ancient dragon that breathes fire and rules the volcanic mountains. Its scales shimmer with heat, and its roar can be heard for miles.',
	image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/v3bi3n-1763378291920.png',
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Flying', description: 'Can attack flying creatures', isPublic: true },
		{ title: 'Fire Breath', description: 'Deals 3 damage to target', isPublic: true },
		{ title: 'Ancient Knowledge', description: 'Knows secrets of old', isPublic: false },
		{ title: 'Treasure Hoard', description: 'Guards vast wealth', isPublic: false }
	],
	stats: [
		{ title: 'Power', value: 8, tracked: false, isPublic: true },
		{ title: 'Health', value: 10, tracked: true, isPublic: true },
		{ title: 'Mana Cost', value: 6, tracked: false, isPublic: false },
		{ title: 'Defense', value: 7, tracked: false, isPublic: false }
	]
};

const wizardCard: CardType = {
	id: 'wizard-1',
	title: 'Mystic Scholar',
	subtitle: 'Human Wizard',
	description:
		'A wise wizard who has studied the arcane arts for decades. Their knowledge of spells is unmatched.',
	image: null,
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Spellcaster', description: 'Can cast spells', isPublic: true },
		{ title: 'Library Access', description: 'Can research spells', isPublic: false }
	],
	stats: [
		{ title: 'Power', value: 2, tracked: false, isPublic: true },
		{ title: 'Health', value: 3, tracked: true, isPublic: true },
		{ title: 'Mana', value: 10, tracked: true, isPublic: false }
	]
};

const rogueCard: CardType = {
	id: 'rogue-1',
	title: 'Shadow Thief',
	subtitle: 'Rogue Assassin',
	description:
		'A master of stealth and deception. Strikes from the shadows when least expected.',
	image: null,
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Quick', description: 'Moves fast', isPublic: true },
		{ title: 'Backstab', description: 'Deal double damage from behind', isPublic: false },
		{ title: 'Poison', description: 'Weapons are poisoned', isPublic: false },
		{ title: 'Shadow Blend', description: 'Invisible in darkness', isPublic: false }
	],
	stats: [
		{ title: 'Power', value: 4, tracked: false, isPublic: true },
		{ title: 'Speed', value: 9, tracked: false, isPublic: false },
		{ title: 'Stealth', value: 10, tracked: false, isPublic: false }
	]
};

// Default - with description and hidden traits/stats
export const Default: Story = {
	args: {
		card: dragonCard,
		preview: true
	}
};

// Simple card with minimal hidden content
export const MinimalHidden: Story = {
	args: {
		card: wizardCard,
		preview: true
	}
};

// Card with many hidden traits
export const ManyHiddenTraits: Story = {
	args: {
		card: rogueCard,
		preview: true
	}
};

// Long description
const longDescCard: CardType = {
	...dragonCard,
	id: 'long-desc',
	description:
		'An ancient dragon that has lived for millennia in the volcanic mountains. Its scales shimmer with an otherworldly heat that can melt steel. The dragon guards a vast treasure hoard accumulated over countless centuries. Legends say it was once a noble guardian of the realm, but centuries of isolation have made it fierce and territorial. Its roar can be heard across three kingdoms, and wise travelers avoid its domain.'
};

export const LongDescription: Story = {
	args: {
		card: longDescCard,
		preview: true
	}
};

// Short description
const shortDescCard: CardType = {
	...wizardCard,
	id: 'short-desc',
	description: 'A wizard.'
};

export const ShortDescription: Story = {
	args: {
		card: shortDescCard,
		preview: true
	}
};

// No hidden traits - only shows stats
const noHiddenTraitsCard: CardType = {
	id: 'no-hidden-traits',
	title: 'Simple Warrior',
	subtitle: 'Basic Fighter',
	description: 'A straightforward warrior with no secrets.',
	image: null,
	imageBlob: null,
	imageMetadata: null,
	traits: [{ title: 'Strong', description: 'Has great strength', isPublic: true }],
	stats: [
		{ title: 'Power', value: 5, tracked: false, isPublic: true },
		{ title: 'Stamina', value: 8, tracked: true, isPublic: false }
	]
};

export const NoHiddenTraits: Story = {
	args: {
		card: noHiddenTraitsCard,
		preview: true
	}
};

// No hidden stats - only shows traits
const noHiddenStatsCard: CardType = {
	id: 'no-hidden-stats',
	title: 'Mysterious Entity',
	subtitle: 'Unknown Origin',
	description: 'Its power cannot be measured.',
	image: null,
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Ethereal', description: 'Partially incorporeal', isPublic: true },
		{ title: 'Telepathy', description: 'Communicates mentally', isPublic: false },
		{ title: 'Phasing', description: 'Can pass through walls', isPublic: false }
	],
	stats: [{ title: 'Power', value: 7, tracked: false, isPublic: true }]
};

export const NoHiddenStats: Story = {
	args: {
		card: noHiddenStatsCard,
		preview: true
	}
};

// Everything hidden (unusual but possible)
const allHiddenCard: CardType = {
	id: 'all-hidden',
	title: 'Secret Agent',
	subtitle: 'Classified',
	description: 'All information about this entity is confidential.',
	image: null,
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Classified Ability 1', description: 'Top secret', isPublic: false },
		{ title: 'Classified Ability 2', description: 'Redacted', isPublic: false }
	],
	stats: [
		{ title: 'Threat Level', value: 10, tracked: false, isPublic: false },
		{ title: 'Clearance', value: 5, tracked: false, isPublic: false }
	]
};

export const AllHidden: Story = {
	args: {
		card: allHiddenCard,
		preview: true
	}
};

// Many hidden stats
const manyHiddenStatsCard: CardType = {
	id: 'many-stats',
	title: 'Complex Mechanism',
	subtitle: 'Artifact Construct',
	description: 'A complex magical construct with many hidden properties and mechanisms.',
	image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/yfq6ig-1763456832344.png',
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Mechanical', description: 'Not alive', isPublic: true },
		{ title: 'Self-Repairing', description: 'Fixes damage over time', isPublic: false }
	],
	stats: [
		{ title: 'Power', value: 6, tracked: false, isPublic: true },
		{ title: 'Energy Core', value: 100, tracked: true, isPublic: false },
		{ title: 'Armor Rating', value: 9, tracked: false, isPublic: false },
		{ title: 'Efficiency', value: 85, tracked: false, isPublic: false },
		{ title: 'Heat Threshold', value: 500, tracked: false, isPublic: false },
		{ title: 'Maintenance', value: 2, tracked: false, isPublic: false }
	]
};

export const ManyHiddenStats: Story = {
	args: {
		card: manyHiddenStatsCard,
		preview: true
	}
};
