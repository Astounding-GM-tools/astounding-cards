import type { Meta, StoryObj } from '@storybook/svelte';
import Pill from '$lib/next/components/ui/Pill.svelte';
import {
	Megaphone,
	AlertTriangle,
	Star,
	Globe,
	Palette,
	Calendar,
	Heart
} from 'lucide-svelte';

const meta = {
	title: 'Components/Pill',
	component: Pill,
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['published', 'warning', 'mine', 'community', 'remix', 'info', 'default'],
			description: 'Visual style variant'
		},
		title: {
			control: 'text',
			description: 'Tooltip text (optional)'
		}
	}
} satisfies Meta<Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		variant: 'default'
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Default Pill'
	})
};

export const Published: Story = {
	args: {
		variant: 'published',
		icon: Megaphone
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Published'
	})
};

export const Warning: Story = {
	args: {
		variant: 'warning',
		icon: AlertTriangle
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Needs sync'
	})
};

export const Mine: Story = {
	args: {
		variant: 'mine',
		icon: Star
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Created by me'
	})
};

export const Community: Story = {
	args: {
		variant: 'community',
		icon: Globe,
		title: 'Created by Jane Doe'
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Community deck'
	})
};

export const Remix: Story = {
	args: {
		variant: 'remix',
		icon: Palette
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Remix'
	})
};

export const Info: Story = {
	args: {
		variant: 'info',
		icon: Calendar,
		title: 'Created: January 1, 2025'
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: '2 days ago'
	})
};

export const WithoutIcon: Story = {
	args: {
		variant: 'published'
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'No Icon'
	})
};

export const LongText: Story = {
	args: {
		variant: 'community',
		icon: Globe
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'This is a longer pill with more text'
	})
};

export const AllVariants: Story = {
	render: () => ({
		Component: Pill,
		props: {},
		// Create a wrapper component to show all variants
		template: `
			<div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
				<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
					<Pill variant="published" icon={Megaphone}>Published</Pill>
					<Pill variant="warning" icon={AlertTriangle}>Needs sync</Pill>
					<Pill variant="mine" icon={Star}>Created by me</Pill>
				</div>
				<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
					<Pill variant="community" icon={Globe} title="Created by Jane">Community deck</Pill>
					<Pill variant="remix" icon={Palette}>Remix</Pill>
					<Pill variant="info" icon={Calendar}>2 days ago</Pill>
				</div>
				<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
					<Pill variant="default">Default</Pill>
					<Pill variant="info" icon={Heart}>42 likes</Pill>
				</div>
			</div>
		`
	})
};
