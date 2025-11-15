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
		hasTokensOverride: {
			control: 'boolean'
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

// Happy path - user can generate
export const Default: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		hasTokensOverride: true
	}
};

export const WithExistingImage: Story = {
	args: {
		card: cardWithImage,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		hasTokensOverride: true
	}
};

export const ModernStyle: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'modern',
		isAuthenticatedOverride: true,
		hasTokensOverride: true
	}
};

export const InkedStyle: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'inked',
		isAuthenticatedOverride: true,
		hasTokensOverride: true
	}
};

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
		hasTokensOverride: true
	}
};

// Auth/Token states
export const NotLoggedIn: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: false,
		hasTokensOverride: true
	}
};

export const LoggedInNoTokens: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: true,
		hasTokensOverride: false
	}
};

export const NotLoggedInNoTokens: Story = {
	args: {
		card: sampleCard,
		deckImageStyle: 'classic',
		isAuthenticatedOverride: false,
		hasTokensOverride: false
	}
};
