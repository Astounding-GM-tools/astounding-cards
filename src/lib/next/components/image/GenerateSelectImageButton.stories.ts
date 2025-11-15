import type { Meta, StoryObj } from '@storybook/svelte';
import GenerateSelectImageButton from './GenerateSelectImageButton.svelte';

const meta = {
	title: 'Components/Image/GenerateSelectImageButton',
	component: GenerateSelectImageButton,
	tags: ['autodocs'],
	argTypes: {
		isAuthenticatedOverride: {
			control: 'boolean',
			description: 'Override auth state for testing (undefined = use real auth store)'
		}
	}
} satisfies Meta<GenerateSelectImageButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleCard = {
	id: 'sample-card-1',
	name: 'Fire Mage',
	description: 'A powerful spellcaster wielding flames',
	image: null,
	imageMetadata: {},
	stats: {
		health: 100,
		attack: 75,
		defense: 50,
		speed: 60
	},
	mechanics: {
		abilities: [],
		keywords: []
	}
};

/**
 * Button when user is NOT logged in.
 * Clicking shows auth gate dialog encouraging account creation.
 */
export const NotAuthenticated: Story = {
	args: {
		card: sampleCard,
		imageStyle: 'classic',
		isAuthenticatedOverride: false
	}
};

/**
 * Button when user IS logged in.
 * Clicking shows AI generation dialog (future: with Generate/Library tabs).
 */
export const Authenticated: Story = {
	args: {
		card: sampleCard,
		imageStyle: 'classic',
		isAuthenticatedOverride: true
	}
};

/**
 * Button with modern image style selected.
 */
export const ModernStyle: Story = {
	args: {
		card: sampleCard,
		imageStyle: 'modern',
		isAuthenticatedOverride: true
	}
};

/**
 * Button with inked image style selected.
 */
export const InkedStyle: Story = {
	args: {
		card: sampleCard,
		imageStyle: 'inked',
		isAuthenticatedOverride: true
	}
};

/**
 * Button for card that already has an image.
 * Still accessible - user can regenerate with different style.
 */
export const CardWithExistingImage: Story = {
	args: {
		card: {
			...sampleCard,
			image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
			imageMetadata: {
				source: 'generated',
				timestamp: Date.now()
			}
		},
		imageStyle: 'classic',
		isAuthenticatedOverride: true
	}
};

