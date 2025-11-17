import type { Meta, StoryObj } from '@storybook/svelte';
import AuthGatedCtaButton from './AuthGatedCtaButton.svelte';
import { CTA_CONFIGS } from '$lib/config/cta-configs';

const meta = {
	title: 'Components/AuthGatedCtaButton',
	component: AuthGatedCtaButton,
	tags: ['autodocs'],
	argTypes: {
		isAuthenticatedOverride: {
			control: 'boolean',
			description: 'Override auth state for testing (undefined = use real auth store)'
		}
	}
} satisfies Meta<AuthGatedCtaButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Image generation CTA - unauthenticated state.
 * Shows auth gate dialog when clicked.
 */
export const ImageGenerationUnauth: Story = {
	args: {
		config: CTA_CONFIGS.IMAGE_GENERATION,
		onAuthenticatedClick: () => console.log('Would open image generation dialog'),
		isAuthenticatedOverride: false
	}
};

/**
 * Image generation CTA - authenticated state.
 * Executes action handler when clicked.
 */
export const ImageGenerationAuth: Story = {
	args: {
		config: CTA_CONFIGS.IMAGE_GENERATION,
		onAuthenticatedClick: () => console.log('Opening image generation dialog'),
		isAuthenticatedOverride: true
	}
};

/**
 * Deck generation CTA - unauthenticated state.
 */
export const DeckGenerationUnauth: Story = {
	args: {
		config: CTA_CONFIGS.DECK_GENERATION,
		onAuthenticatedClick: () => console.log('Would open deck generation dialog'),
		isAuthenticatedOverride: false
	}
};

/**
 * Deck generation CTA - authenticated state.
 */
export const DeckGenerationAuth: Story = {
	args: {
		config: CTA_CONFIGS.DECK_GENERATION,
		onAuthenticatedClick: () => console.log('Opening deck generation dialog'),
		isAuthenticatedOverride: true
	}
};

/**
 * Cloud sync CTA - unauthenticated state.
 */
export const CloudSyncUnauth: Story = {
	args: {
		config: CTA_CONFIGS.CLOUD_SYNC,
		onAuthenticatedClick: () => console.log('Would save to cloud'),
		isAuthenticatedOverride: false
	}
};

/**
 * Cloud sync CTA - authenticated state.
 */
export const CloudSyncAuth: Story = {
	args: {
		config: CTA_CONFIGS.CLOUD_SYNC,
		onAuthenticatedClick: () => console.log('Saving to cloud'),
		isAuthenticatedOverride: true
	}
};

/**
 * Sharing CTA - unauthenticated state.
 */
export const SharingUnauth: Story = {
	args: {
		config: CTA_CONFIGS.SHARING,
		onAuthenticatedClick: () => console.log('Would open sharing dialog'),
		isAuthenticatedOverride: false
	}
};

/**
 * Sharing CTA - authenticated state.
 */
export const SharingAuth: Story = {
	args: {
		config: CTA_CONFIGS.SHARING,
		onAuthenticatedClick: () => console.log('Opening sharing dialog'),
		isAuthenticatedOverride: true
	}
};
