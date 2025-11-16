import type { Meta, StoryObj } from '@storybook/svelte';
import AuthGateDialog from './AuthGateDialog.svelte';

const meta = {
	title: 'Dialogs/AuthGateDialog',
	component: AuthGateDialog,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered'
	}
} satisfies Meta<AuthGateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default auth gate dialog for AI Image Generation feature.
 */
export const Default: Story = {
	args: {
		feature: 'AI Image Generation',
		description:
			'Generate stunning card artwork with AI or browse our premium image library. Create a free account to unlock these exclusive features!'
	}
};

/**
 * Auth gate for Cloud Sync feature.
 */
export const CloudSyncFeature: Story = {
	args: {
		feature: 'Cloud Sync',
		description:
			'Sync your decks across devices and never lose your work. Access your collection from anywhere with a free account.'
	}
};

/**
 * Auth gate for Premium Library feature.
 */
export const PremiumLibraryFeature: Story = {
	args: {
		feature: 'Premium Image Library',
		description:
			'Browse thousands of professional fantasy artwork assets. Filter by style, theme, and character type to find the perfect image for your cards.'
	}
};

/**
 * Auth gate for Sharing feature.
 */
export const SharingFeature: Story = {
	args: {
		feature: 'Deck Sharing',
		description:
			'Share your custom decks with the community or collaborate with friends. Get feedback and discover amazing creations from other creators.'
	}
};

/**
 * Minimal feature gate with short description.
 */
export const MinimalGate: Story = {
	args: {
		feature: 'Advanced Features',
		description: 'Sign up for free to unlock all premium features.'
	}
};
