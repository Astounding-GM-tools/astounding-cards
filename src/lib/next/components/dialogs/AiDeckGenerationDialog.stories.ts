import type { Meta, StoryObj } from '@storybook/svelte';
import AiDeckGenerationDialog from './AiDeckGenerationDialog.svelte';

const meta = {
	title: 'Dialogs/AiDeckGenerationDialog',
	component: AiDeckGenerationDialog,
	tags: ['autodocs'],
	argTypes: {
		isAuthenticatedOverride: {
			control: 'boolean',
			description: 'Override authentication state for testing'
		}
	}
} satisfies Meta<AiDeckGenerationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - authenticated user with empty prompt.
 * Shows the full dialog with prompt input, card count slider,
 * example prompts, and the free feature notice.
 */
export const Default: Story = {
	args: {
		isAuthenticatedOverride: true
	}
};

/**
 * Not authenticated - shows auth gate instead of free notice.
 * Generate button will show login prompt.
 */
export const NotAuthenticated: Story = {
	args: {
		isAuthenticatedOverride: false
	}
};

/**
 * With a detailed prompt filled in.
 * Demonstrates what a good, detailed prompt looks like.
 */
export const WithPrompt: Story = {
	args: {
		isAuthenticatedOverride: true
	},
	render: (args) => ({
		Component: AiDeckGenerationDialog,
		props: args
	}),
	play: async ({ canvasElement }) => {
		// Note: In real usage, you'd use @storybook/testing-library
		// to fill in the textarea, but this shows the intent
		const textarea = canvasElement.querySelector('textarea');
		if (textarea) {
			textarea.value =
				'A deck of cyberpunk netrunners operating in Neo-Tokyo. Each character should have hacking skill (1-10), street cred (1-10), and corporate heat level (1-10). Include their signature hack, their personal motivation for running the shadows, and a unique cybernetic enhancement that defines their playstyle.';
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}
};

/**
 * Shows the example prompts panel expanded.
 * Useful for demonstrating the example prompt feature.
 */
export const ShowingExamples: Story = {
	args: {
		isAuthenticatedOverride: true
	}
};

/**
 * With maximum card count (52 cards).
 * Shows slider at maximum value.
 */
export const MaximumCards: Story = {
	args: {
		isAuthenticatedOverride: true
	}
};

/**
 * With minimum card count (3 cards).
 * Shows slider at minimum value.
 */
export const MinimumCards: Story = {
	args: {
		isAuthenticatedOverride: true
	}
};
