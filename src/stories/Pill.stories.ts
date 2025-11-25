import type { Meta, StoryObj } from '@storybook/svelte';
import Pill from '$lib/next/components/ui/Pill.svelte';
import { Check, AlertTriangle, Info as InfoIcon, XCircle } from 'lucide-svelte';

const meta = {
	title: 'Components/Pill',
	component: Pill,
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['info', 'warning', 'success', 'danger', 'neutral'],
			description: 'AlertVariant type for consistent styling'
		},
		size: {
			control: 'select',
			options: ['sm', 'md'],
			description: 'Size variant (sm = 0.75rem, md = 0.875rem)'
		},
		title: {
			control: 'text',
			description: 'Tooltip text (optional)'
		}
	}
} satisfies Meta<Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
	args: {
		variant: 'info',
		icon: InfoIcon
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: '2 days ago'
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

export const Success: Story = {
	args: {
		variant: 'success',
		icon: Check
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Published'
	})
};

export const Danger: Story = {
	args: {
		variant: 'danger',
		icon: XCircle
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Error'
	})
};

export const Neutral: Story = {
	args: {
		variant: 'neutral'
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Neutral'
	})
};

export const WithoutIcon: Story = {
	args: {
		variant: 'success'
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'No Icon'
	})
};

export const LongText: Story = {
	args: {
		variant: 'info',
		icon: InfoIcon
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'This is a longer pill with more text'
	})
};

export const SmallSize: Story = {
	args: {
		variant: 'success',
		size: 'sm',
		icon: Check
	},
	render: (args) => ({
		Component: Pill,
		props: args,
		children: 'Small'
	})
};

export const AllVariants: Story = {
	render: () => ({
		Component: Pill,
		props: {},
		// Create a wrapper component to show all variants
		template: `
			<div style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px;">
				<h3 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: #64748b;">All Variants (Medium)</h3>
				<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
					<Pill variant="info" icon={InfoIcon}>Info</Pill>
					<Pill variant="warning" icon={AlertTriangle}>Warning</Pill>
					<Pill variant="success" icon={Check}>Success</Pill>
					<Pill variant="danger" icon={XCircle}>Danger</Pill>
					<Pill variant="neutral">Neutral</Pill>
				</div>
				<h3 style="margin: 1rem 0 0 0; font-size: 0.875rem; font-weight: 600; color: #64748b;">All Variants (Small)</h3>
				<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
					<Pill variant="info" size="sm" icon={InfoIcon}>Info</Pill>
					<Pill variant="warning" size="sm" icon={AlertTriangle}>Warning</Pill>
					<Pill variant="success" size="sm" icon={Check}>Success</Pill>
					<Pill variant="danger" size="sm" icon={XCircle}>Danger</Pill>
					<Pill variant="neutral" size="sm">Neutral</Pill>
				</div>
			</div>
		`
	})
};
