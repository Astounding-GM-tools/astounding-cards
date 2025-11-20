import type { Meta, StoryObj } from '@storybook/svelte';
import ActionButton from '$lib/next/components/actions/ActionButton.svelte';
import { actionButtonContent } from '$lib/next/components/actions/actionButtonContent';
import { Share2, Upload, Eye, Heart, Plus } from 'lucide-svelte';

const meta = {
	title: 'Components/Actions/ActionButton',
	component: ActionButton,
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['primary', 'secondary', 'success', 'warning', 'danger']
		},
		disabled: { control: 'boolean' },
		loading: { control: 'boolean' }
	}
} satisfies Meta<ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Share: Story = {
	args: {
		icon: Share2,
		...actionButtonContent.share,
		variant: 'primary'
	}
};

export const Publish: Story = {
	args: {
		icon: Upload,
		...actionButtonContent.publish,
		variant: 'success'
	}
};

export const Republish: Story = {
	args: {
		icon: Upload,
		...actionButtonContent.republish,
		variant: 'warning'
	}
};

export const PublishedSynced: Story = {
	args: {
		icon: Upload,
		...actionButtonContent.published,
		variant: 'success'
	}
};

export const ViewPublic: Story = {
	args: {
		icon: Eye,
		...actionButtonContent.viewPublic,
		variant: 'secondary'
	}
};

export const Like: Story = {
	args: {
		icon: Heart,
		...actionButtonContent.like,
		variant: 'danger'
	}
};

export const Liked: Story = {
	args: {
		icon: Heart,
		...actionButtonContent.liked,
		variant: 'danger',
		filled: true
	}
};

export const AddToLibrary: Story = {
	args: {
		icon: Heart,
		...actionButtonContent.addToLibrary,
		variant: 'primary'
	}
};

export const RemoveFromLibrary: Story = {
	args: {
		icon: Heart,
		...actionButtonContent.removeFromLibrary,
		variant: 'success'
	}
};

export const AddCard: Story = {
	args: {
		icon: Plus,
		...actionButtonContent.addCard,
		variant: 'primary'
	}
};

export const Disabled: Story = {
	args: {
		icon: Share2,
		...actionButtonContent.shareDisabled,
		variant: 'primary',
		disabled: true
	}
};

export const Loading: Story = {
	args: {
		icon: Upload,
		title: 'Publish',
		variant: 'success',
		loading: true
	}
};

// Show all variants in a row
export const AllVariants: Story = {
	render: () => ({
		Component: ActionButton,
		props: {}
	}),
	decorators: [
		() => ({
			template: `
				<div style="display: flex; flex-wrap: wrap; gap: 1rem; padding: 1rem;">
					<story />
				</div>
			`
		})
	]
};
