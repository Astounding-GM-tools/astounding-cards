import type { Meta, StoryObj } from '@storybook/svelte';
import AiBatchImageGenerationDialog from './AiBatchImageGenerationDialog.svelte';
import type { Card } from '../../types/card';

// Sample cards for testing
const sampleCards: Card[] = [
	{
		id: '1',
		title: 'Elara Moonwhisper',
		subtitle: 'Elven Ranger',
		description: 'A skilled archer with silver hair and piercing green eyes',
		image: 'https://picsum.photos/seed/elara/350/490',
		traits: [{ title: 'Agile', description: 'Quick and nimble', isPublic: true }],
		stats: [{ title: 'Dexterity', value: 15, tracked: false, isPublic: true }]
	},
	{
		id: '2',
		title: 'Grimm Ironforge',
		subtitle: 'Dwarven Warrior',
		description: 'A battle-hardened dwarf with a mighty warhammer',
		image: null,
		traits: [{ title: 'Sturdy', description: 'Built like a mountain', isPublic: true }],
		stats: [{ title: 'Strength', value: 18, tracked: false, isPublic: true }]
	},
	{
		id: '3',
		title: 'Zephyr Nightshade',
		subtitle: 'Tiefling Rogue',
		description: 'A cunning infiltrator with dark magic',
		image: null,
		traits: [{ title: 'Stealthy', description: 'Moves in shadows', isPublic: true }],
		stats: [{ title: 'Stealth', value: 16, tracked: false, isPublic: true }]
	},
	{
		id: '4',
		title: 'Lyra Stormcaller',
		subtitle: 'Human Mage',
		description: 'Commands the power of storms and lightning',
		image: 'https://picsum.photos/seed/lyra/350/490',
		traits: [{ title: 'Arcane', description: 'Wielder of magic', isPublic: true }],
		stats: [{ title: 'Intelligence', value: 17, tracked: false, isPublic: true }]
	},
	{
		id: '5',
		title: 'Thorne Blackwood',
		subtitle: 'Half-Orc Paladin',
		description: 'A righteous defender sworn to justice',
		image: null,
		traits: [{ title: 'Honorable', description: 'Lives by a code', isPublic: true }],
		stats: [{ title: 'Wisdom', value: 14, tracked: false, isPublic: true }]
	}
];

const meta = {
	title: 'Dialogs/AiBatchImageGenerationDialog',
	component: AiBatchImageGenerationDialog,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered'
	},
	argTypes: {
		isAuthenticatedOverride: { control: 'boolean' },
		deckThemeOverride: {
			control: 'select',
			options: ['classic', 'modern', 'inked', 'cyberpunk', 'fantasy']
		}
	}
} satisfies Meta<AiBatchImageGenerationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default batch image generation dialog for authenticated user with sufficient tokens.
 * Shows style selector, card list, and cost breakdown.
 */
export const Default: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: sampleCards,
		deckThemeOverride: 'fantasy'
	}
};

/**
 * Dialog shown to unauthenticated users - prompts for sign up/login.
 */
export const NotAuthenticated: Story = {
	args: {
		isAuthenticatedOverride: false,
		cardsOverride: sampleCards,
		deckThemeOverride: 'fantasy'
	}
};

/**
 * User with insufficient tokens - shows "Buy More Tokens" button.
 */
export const InsufficientTokens: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: sampleCards,
		deckThemeOverride: 'fantasy'
	}
};

/**
 * Generating state - shows progress and safe-to-close message.
 */
export const Generating: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: sampleCards,
		deckThemeOverride: 'cyberpunk'
	}
};

/**
 * Deck with mix of cards with and without images.
 * Shows smart cost calculation excluding cards that already have images.
 */
export const MixedCards: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: sampleCards, // 2 cards have images, 3 don't
		deckThemeOverride: 'modern'
	}
};
