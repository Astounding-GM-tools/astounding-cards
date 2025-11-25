import type { Meta, StoryObj } from '@storybook/svelte';
import CardWithFront from './CardWithFront.example.svelte';
import type { Card as CardType } from '../../types/card';

const meta = {
	title: 'Card/CardFrontContent',
	component: CardWithFront,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered'
	}
} satisfies Meta<typeof CardWithFront>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample cards with different characteristics
const dragonCard: CardType = {
	id: 'dragon-1',
	title: 'Fire Dragon',
	subtitle: 'Legendary Creature',
	description: 'An ancient dragon that breathes fire and rules the volcanic mountains.',
	image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/v3bi3n-1763378291920.png',
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Flying', description: 'Can attack flying creatures', isPublic: true },
		{ title: 'Fire Breath', description: 'Deals 3 damage to target', isPublic: true }
	],
	stats: [
		{ title: 'Power', value: 8, tracked: false, isPublic: true },
		{ title: 'Health', value: 10, tracked: true, isPublic: true }
	]
};

const wizardCard: CardType = {
	id: 'wizard-1',
	title: 'Mystic Scholar',
	subtitle: 'Human Wizard',
	description: 'A wise wizard who has studied magic for decades.',
	image: null,
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Spellcaster', description: 'Can cast spells', isPublic: true },
		{ title: 'Wisdom', description: 'Deep knowledge of magic', isPublic: true }
	],
	stats: [
		{ title: 'Power', value: 2, tracked: false, isPublic: true },
		{ title: 'Health', value: 3, tracked: true, isPublic: true }
	]
};

const goblinCard: CardType = {
	id: 'goblin-1',
	title: 'Goblin Raider',
	subtitle: 'Creature',
	description: 'A small, mischievous goblin.',
	image: null,
	imageBlob: null,
	imageMetadata: null,
	traits: [{ title: 'Quick', description: 'Moves fast', isPublic: true }],
	stats: [{ title: 'Power', value: 1, tracked: false, isPublic: true }]
};

const knightCard: CardType = {
	id: 'knight-1',
	title: 'Royal Knight',
	subtitle: 'Elite Warrior',
	description: 'A noble knight sworn to protect the kingdom.',
	image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/mfk86m-1763377336587.png',
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Armored', description: 'Protected by heavy armor', isPublic: true },
		{ title: 'Honorable', description: 'Fights with honor', isPublic: true },
		{ title: 'Mounted', description: 'Rides a warhorse', isPublic: true }
	],
	stats: [
		{ title: 'Power', value: 5, tracked: false, isPublic: true },
		{ title: 'Health', value: 7, tracked: true, isPublic: true },
		{ title: 'Defense', value: 8, tracked: false, isPublic: true }
	]
};

// Default - with image
export const WithImage: Story = {
	args: {
		card: dragonCard,
		preview: true
	}
};

// Without image
export const WithoutImage: Story = {
	args: {
		card: wizardCard,
		preview: true
	}
};

// Minimal content
export const Minimal: Story = {
	args: {
		card: goblinCard,
		preview: true
	}
};

// Multiple traits and stats
export const MultipleAttributes: Story = {
	args: {
		card: knightCard,
		preview: true
	}
};

// Long title and subtitle
const longTitleCard: CardType = {
	...dragonCard,
	id: 'long-title',
	title: 'Ancient Fire-Breathing Dragon of the Volcanic Mountains',
	subtitle: 'Legendary Elder Dragon Creature - Ultra Rare'
};

export const LongTitle: Story = {
	args: {
		card: longTitleCard,
		preview: true
	}
};

// No traits
const noTraitsCard: CardType = {
	...wizardCard,
	id: 'no-traits',
	traits: [],
	title: 'Simple Mage',
	subtitle: 'Beginner Spellcaster'
};

export const NoTraits: Story = {
	args: {
		card: noTraitsCard,
		preview: true
	}
};

// Many public traits
const manyTraitsCard: CardType = {
	id: 'many-traits',
	title: 'Versatile Hero',
	subtitle: 'Multi-talented Adventurer',
	description: 'A hero with many abilities.',
	image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/qkjql3-1763378174901.png',
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Swordfighting', description: 'Skilled with blade', isPublic: true },
		{ title: 'Archery', description: 'Expert marksman', isPublic: true },
		{ title: 'Stealth', description: 'Moves silently', isPublic: true },
		{ title: 'Tracking', description: 'Can follow trails', isPublic: true },
		{ title: 'Leadership', description: 'Inspires allies', isPublic: true }
	],
	stats: [
		{ title: 'Power', value: 6, tracked: false, isPublic: true },
		{ title: 'Health', value: 8, tracked: true, isPublic: true }
	]
};

export const ManyTraits: Story = {
	args: {
		card: manyTraitsCard,
		preview: true
	}
};

// High stat values
const powerfulCard: CardType = {
	...dragonCard,
	id: 'powerful',
	title: 'Elder God',
	subtitle: 'Divine Entity',
	stats: [
		{ title: 'Power', value: 99, tracked: false, isPublic: true },
		{ title: 'Health', value: 100, tracked: true, isPublic: true }
	]
};

export const HighStats: Story = {
	args: {
		card: powerfulCard,
		preview: true
	}
};
