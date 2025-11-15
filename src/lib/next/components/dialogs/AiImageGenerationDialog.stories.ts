import type { Meta, StoryObj } from '@storybook/svelte';
import AiImageGenerationDialog from './AiImageGenerationDialog.svelte';
import type { Card } from '../../types/card';

const meta = {
	title: 'Dialogs/AiImageGenerationDialog',
	component: AiImageGenerationDialog,
	tags: ['autodocs'],
	argTypes: {
		deckImageStyle: {
			control: 'select',
			options: ['classic', 'modern', 'inked']
		},
		isAuthenticatedOverride: {
			control: 'boolean'
		},
		tokenBalanceOverride: {
			control: 'number'
		}
	}
} satisfies Meta<AiImageGenerationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleCard: Card = {
	id: '1',
	title: 'Elara Moonwhisper',
	subtitle: 'Elven Ranger',
	description: 'A skilled archer with silver hair and piercing green eyes',
	image: null,
	traits: [
		{ title: 'Agile', description: 'Quick and nimble', isPublic: true },
		{ title: 'Wise', description: 'Ancient knowledge', isPublic: true }
	],
	stats: [
		{ title: 'Strength', value: 7, tracked: false, isPublic: true },
		{ title: 'Dexterity', value: 15, tracked: false, isPublic: true }
	]
};

const cardWithImage: Card = {
	...sampleCard,
	image: 'https://picsum.photos/350/490',
	imageMetadata: {
		originalName: 'hero-image.png',
		addedAt: Date.now(),
		source: 'upload',
		size: 150000
	}
};

/**
 * Default state - user logged in with sufficient tokens (500).
 * Shows affordability with green checkmark.
 */
export const Default: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		tokenBalanceOverride: 500
	}
};

/**
 * Card already has an image - will be used as style reference for generation.
 */
export const WithExistingImage: Story = {
	args: {
		card: cardWithImage,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		tokenBalanceOverride: 500
	}
};

/**
 * Modern image style selected.
 */
export const ModernStyle: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'modern',
		isAuthenticatedOverride: true,
		tokenBalanceOverride: 500
	}
};

/**
 * Inked image style selected.
 */
export const InkedStyle: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'inked',
		isAuthenticatedOverride: true,
		tokenBalanceOverride: 500
	}
};

/**
 * Image is locked - note shown in UI (future feature).
 */
export const LockedImage: Story = {
	args: {
		card: {
			...cardWithImage,
			imageMetadata: {
				...cardWithImage.imageMetadata!,
				imageLocked: true
			}
		},
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		tokenBalanceOverride: 500
	}
};

/**
 * User not logged in - shows auth gate.
 */
export const NotLoggedIn: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: false,
		tokenBalanceOverride: 500
	}
};

/**
 * User logged in with insufficient tokens (40) - shows red X and buy tokens button.
 */
export const InsufficientTokens: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		tokenBalanceOverride: 40
	}
};

/**
 * User logged in with no tokens (0) - shows buy tokens CTA.
 */
export const NoTokens: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		tokenBalanceOverride: 0
	}
};

/**
 * User has exactly enough tokens (100) - edge case.
 */
export const ExactlyEnoughTokens: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		tokenBalanceOverride: 100
	}
};
