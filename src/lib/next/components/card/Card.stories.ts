import type { Meta, StoryObj } from '@storybook/svelte';
import CardWithFront from './CardWithFront.example.svelte';
import CardWithBack from './CardWithBack.example.svelte';

const meta = {
	title: 'Card/Card Wrapper',
	component: CardWithFront,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered'
	}
} satisfies Meta<typeof CardWithFront>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample card data
const sampleCard = {
	id: 'card-1',
	title: 'Fire Dragon',
	subtitle: 'Legendary Creature',
	description: 'An ancient dragon that breathes fire and rules the volcanic mountains.',
	image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/v3bi3n-1763378291920.png',
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Flying', description: 'Can attack flying creatures', isPublic: true },
		{ title: 'Fire Breath', description: 'Deals 3 damage to target', isPublic: true },
		{ title: 'Ancient', description: 'Has lived for 1000 years', isPublic: false }
	],
	stats: [
		{ title: 'Power', value: 8, tracked: false, isPublic: true },
		{ title: 'Health', value: 10, tracked: true, isPublic: true },
		{ title: 'Mana', value: 6, tracked: false, isPublic: false }
	]
};

const cardWithoutImage = {
	...sampleCard,
	id: 'card-2',
	title: 'Mystic Scholar',
	subtitle: 'Human Wizard',
	image: null,
	traits: [
		{ title: 'Spellcaster', description: 'Can cast spells', isPublic: true },
		{ title: 'Wisdom', description: 'Deep knowledge of magic', isPublic: false }
	],
	stats: [
		{ title: 'Power', value: 2, tracked: false, isPublic: true },
		{ title: 'Health', value: 3, tracked: true, isPublic: true }
	]
};

const minimalCard = {
	id: 'card-minimal',
	title: 'Goblin',
	subtitle: 'Creature',
	description: 'A small, mischievous creature.',
	image: null,
	imageBlob: null,
	imageMetadata: null,
	traits: [{ title: 'Quick', description: 'Moves fast', isPublic: true }],
	stats: [{ title: 'Power', value: 1, tracked: false, isPublic: true }]
};

const complexCard = {
	id: 'card-complex',
	title: 'Archmage Supreme',
	subtitle: 'Legendary Wizard Lord',
	description: 'The most powerful wizard in the realm, master of all schools of magic.',
	image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/zyixci-1763375176585.png',
	imageBlob: null,
	imageMetadata: null,
	traits: [
		{ title: 'Arcane Mastery', description: 'Master of all magic schools', isPublic: true },
		{ title: 'Teleportation', description: 'Can teleport anywhere', isPublic: true },
		{ title: 'Time Manipulation', description: 'Can slow or speed time', isPublic: true },
		{ title: 'Immortal', description: 'Cannot die from aging', isPublic: false },
		{ title: 'Mind Reading', description: 'Can read thoughts', isPublic: false }
	],
	stats: [
		{ title: 'Power', value: 10, tracked: false, isPublic: true },
		{ title: 'Health', value: 15, tracked: true, isPublic: true },
		{ title: 'Mana', value: 20, tracked: true, isPublic: true },
		{ title: 'Defense', value: 8, tracked: false, isPublic: false },
		{ title: 'Speed', value: 7, tracked: false, isPublic: false }
	]
};

// Front face with image
export const FrontWithImage: Story = {
	args: {
		card: sampleCard,
		preview: true
	}
};

// Front face without image
export const FrontWithoutImage: Story = {
	args: {
		card: cardWithoutImage,
		preview: true
	}
};

// Minimal card
export const Minimal: Story = {
	args: {
		card: minimalCard,
		preview: true
	}
};

// Complex card with many attributes
export const Complex: Story = {
	args: {
		card: complexCard,
		preview: true
	}
};

// Back face
export const BackFace: Story = {
	render: () => ({
		Component: CardWithBack,
		props: {
			card: sampleCard
		}
	})
};

// Interactive mode (clickable)
export const Interactive: Story = {
	args: {
		card: sampleCard,
		preview: false,
		cardId: 'card-1'
	}
};
