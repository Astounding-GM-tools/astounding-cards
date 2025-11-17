import type { Meta, StoryObj } from '@storybook/svelte';
import AiBatchImageGenerationDialog from './AiBatchImageGenerationDialog.svelte';
import type { Card } from '../../types/card';

// Sample cards with various states
const cardWithImage: Card = {
	id: '1',
	title: 'Elara Moonwhisper',
	subtitle: 'Elven Ranger',
	description: 'A skilled archer with silver hair and piercing green eyes',
	image: 'https://picsum.photos/seed/elara/350/490',
	imageMetadata: {
		imageId: 'img-classic-1',
		source: 'ai-generation',
		imageStyle: 'classic',
		addedAt: Date.now()
	},
	traits: [{ title: 'Agile', description: 'Quick and nimble', isPublic: true }],
	stats: [{ title: 'Dexterity', value: 15, tracked: false, isPublic: true }]
};

const cardWithDifferentStyleImage: Card = {
	id: '2',
	title: 'Grimm Ironforge',
	subtitle: 'Dwarven Warrior',
	description: 'A battle-hardened dwarf with a mighty warhammer',
	image: 'https://picsum.photos/seed/grimm/350/490',
	imageMetadata: {
		imageId: 'img-modern-2',
		source: 'ai-generation',
		imageStyle: 'modern', // Different style
		addedAt: Date.now()
	},
	traits: [{ title: 'Sturdy', description: 'Built like a mountain', isPublic: true }],
	stats: [{ title: 'Strength', value: 18, tracked: false, isPublic: true }]
};

const cardWithExternalImage: Card = {
	id: '3',
	title: 'Zephyr Nightshade',
	subtitle: 'Tiefling Rogue',
	description: 'A cunning infiltrator with dark magic',
	image: 'https://picsum.photos/seed/zephyr/350/490',
	// No imageMetadata = external image
	traits: [{ title: 'Stealthy', description: 'Moves in shadows', isPublic: true }],
	stats: [{ title: 'Stealth', value: 16, tracked: false, isPublic: true }]
};

const cardWithoutImage: Card = {
	id: '4',
	title: 'Lyra Stormcaller',
	subtitle: 'Human Mage',
	description: 'Commands the power of storms and lightning',
	image: null,
	traits: [{ title: 'Arcane', description: 'Wielder of magic', isPublic: true }],
	stats: [{ title: 'Intelligence', value: 17, tracked: false, isPublic: true }]
};

const cardWithoutImage2: Card = {
	id: '5',
	title: 'Thorne Blackwood',
	subtitle: 'Half-Orc Paladin',
	description: 'A righteous defender sworn to justice',
	image: null,
	traits: [{ title: 'Honorable', description: 'Lives by a code', isPublic: true }],
	stats: [{ title: 'Wisdom', value: 14, tracked: false, isPublic: true }]
};

// Card sets for different scenarios
const mixedCards = [
	cardWithImage,
	cardWithDifferentStyleImage,
	cardWithExternalImage,
	cardWithoutImage,
	cardWithoutImage2
];

const cardsWithoutImages = [cardWithoutImage, cardWithoutImage2];

const cardsAllWithImages = [
	cardWithImage,
	{ ...cardWithImage, id: '6', title: 'Aria Moonstone' },
	{ ...cardWithImage, id: '7', title: 'Kael Shadowbane' }
];

const meta = {
	title: 'Dialogs/AiBatchImageGenerationDialog',
	component: AiBatchImageGenerationDialog,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
# Batch Image Generation Dialog

A sophisticated dialog for generating AI images for multiple cards at once.

## Features

- **Variant Detection**: Checks if images already exist in target style (free switch)
- **Smart Cost Calculation**: Only charges for cards needing new generation
- **Progress Tracking**: Shows time-based progress bar during generation
- **In-Dialog State**: No separate loading dialog - UI updates in place
- **External Image Handling**: Detects and handles non-AI images

## States

The dialog handles multiple states:
- Loading/checking variants
- Configuration (style selection, card checkbox management)
- Cost calculation with balance validation
- Generation in progress with time-based progress
- Completion with success/error feedback

## Cost Model

- New image generation: 25 tokens per card
- Style variant switching: 0 tokens (free)
- External image replacement: 25 tokens per card
				`
			}
		}
	},
	argTypes: {
		isAuthenticatedOverride: {
			control: 'boolean',
			description: 'Override authentication state (for testing)'
		},
		deckThemeOverride: {
			control: 'select',
			options: ['classic', 'modern', 'inked', 'cyberpunk', 'fantasy'],
			description: 'Override deck theme (affects default style selection)'
		}
	}
} satisfies Meta<AiBatchImageGenerationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with mixed cards - some with images, some without.
 * Shows smart cost calculation and variant detection.
 */
export const Default: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: mixedCards,
		deckThemeOverride: 'fantasy'
	}
};

/**
 * All cards without images - will generate for all selected cards.
 */
export const AllCardsWithoutImages: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: cardsWithoutImages,
		deckThemeOverride: 'cyberpunk'
	}
};

/**
 * External images (not AI-generated) require new generation.
 * Shows that external images are unchecked by default but can be
 * opted in for AI generation.
 */
export const ExternalImages: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: [cardWithExternalImage, cardWithoutImage],
		deckThemeOverride: 'modern'
	}
};

/**
 * User not authenticated - shows sign-up/login prompt.
 */
export const NotAuthenticated: Story = {
	args: {
		isAuthenticatedOverride: false,
		cardsOverride: mixedCards,
		deckThemeOverride: 'fantasy'
	}
};

/**
 * Large deck (10+ cards) to demonstrate scrolling and cost at scale.
 */
export const LargeDeck: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: Array.from({ length: 12 }, (_, i) => ({
			...cardWithoutImage,
			id: `card-${i}`,
			title: `Character ${i + 1}`
		})),
		deckThemeOverride: 'inked'
	}
};

/**
 * All cards already have correct style images - shows "no change" state.
 * When deck theme matches all card image styles, nothing needs generation.
 */
export const AllCardsUpToDate: Story = {
	args: {
		isAuthenticatedOverride: true,
		cardsOverride: cardsAllWithImages,
		deckThemeOverride: 'classic' // Same as all card styles
	}
};
