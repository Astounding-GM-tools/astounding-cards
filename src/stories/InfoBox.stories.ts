import type { Meta, StoryObj } from '@storybook/svelte';
import InfoBox from '$lib/next/components/ui/InfoBox.svelte';
import {
	Info,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Sparkles,
	BookOpenCheck,
	LibraryBigIcon,
	Lightbulb
} from 'lucide-svelte';

const meta = {
	title: 'Components/InfoBox',
	component: InfoBox,
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['info', 'warning', 'success', 'danger', 'neutral'],
			description: 'Visual style variant'
		},
		dismissible: {
			control: 'boolean',
			description: 'Whether the box can be dismissed'
		}
	}
} satisfies Meta<InfoBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
	args: {
		variant: 'info',
		icon: Info
	},
	render: (args) => ({
		Component: InfoBox,
		props: args,
		children: '<strong>Info:</strong> This is an informational message with some useful details.'
	})
};

export const Warning: Story = {
	args: {
		variant: 'warning',
		icon: AlertTriangle
	},
	render: (args) => ({
		Component: InfoBox,
		props: args,
		children:
			'<strong>Warning!</strong> This action cannot be undone. Please proceed with caution.'
	})
};

export const Success: Story = {
	args: {
		variant: 'success',
		icon: CheckCircle
	},
	render: (args) => ({
		Component: InfoBox,
		props: args,
		children: '<strong>Success!</strong> Your changes have been saved successfully.'
	})
};

export const Danger: Story = {
	args: {
		variant: 'danger',
		icon: XCircle
	},
	render: (args) => ({
		Component: InfoBox,
		props: args,
		children: '<strong>Error:</strong> Something went wrong. Please try again later.'
	})
};

export const Neutral: Story = {
	args: {
		variant: 'neutral',
		icon: Lightbulb
	},
	render: (args) => ({
		Component: InfoBox,
		props: args,
		children: '<strong>Tip:</strong> You can use keyboard shortcuts to work faster.'
	})
};

export const Dismissible: Story = {
	args: {
		variant: 'info',
		icon: Info,
		dismissible: true,
		onDismiss: () => alert('InfoBox dismissed!')
	},
	render: (args) => ({
		Component: InfoBox,
		props: args,
		children: '<strong>Dismissible:</strong> Click the X button to dismiss this message.'
	})
};

export const WithoutIcon: Story = {
	args: {
		variant: 'info'
	},
	render: (args) => ({
		Component: InfoBox,
		props: args,
		children: 'This is an info box without an icon.'
	})
};

export const LongContent: Story = {
	args: {
		variant: 'info',
		icon: BookOpenCheck
	},
	render: (args) => ({
		Component: InfoBox,
		props: args,
		children:
			'<strong>Beta prices!</strong> We are testing the sustainability of our pricing model. It is likely that we will have to increase prices after the beta, but any unspent tokens bought during beta will be retained. This is a longer message to demonstrate how the component handles multiple lines of text with proper alignment.'
	})
};

export const DashboardExamples: Story = {
	render: () => ({
		Component: InfoBox,
		props: {},
		template: `
			<div style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px;">
				<InfoBox variant="warning" icon={Sparkles}>
					<strong>Coming Soon!</strong> Token purchasing will become available after Lemon Squeezy
					(hopefully) approves this website.
				</InfoBox>

				<InfoBox variant="info" icon={BookOpenCheck}>
					<strong>Beta prices!</strong> We are testing the sustainability of our pricing model.
					It is likely that we will have to increase prices after the beta, but any unspent tokens
					bought during beta will be retained.
				</InfoBox>

				<InfoBox variant="info" icon={LibraryBigIcon}>
					<strong>Terms of service</strong>
					Remember to read the full terms of service, but the most important bit is that Astounding
					Cards is a <strong>community driven service</strong>: All images generated on the platform
					becomes accessible to ALL members of the community as part of the Astounding Community
					Image Library!
				</InfoBox>
			</div>
		`
	})
};

export const AllVariants: Story = {
	render: () => ({
		Component: InfoBox,
		props: {},
		template: `
			<div style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px;">
				<InfoBox variant="info" icon={Info}>
					<strong>Info:</strong> This is an informational message.
				</InfoBox>

				<InfoBox variant="warning" icon={AlertTriangle}>
					<strong>Warning:</strong> Please be careful with this action.
				</InfoBox>

				<InfoBox variant="success" icon={CheckCircle}>
					<strong>Success:</strong> Operation completed successfully!
				</InfoBox>

				<InfoBox variant="danger" icon={XCircle}>
					<strong>Error:</strong> Something went wrong.
				</InfoBox>

				<InfoBox variant="neutral" icon={Lightbulb}>
					<strong>Tip:</strong> Here's a helpful suggestion.
				</InfoBox>

				<InfoBox variant="info" icon={Info} dismissible={true}>
					<strong>Dismissible:</strong> This one has a dismiss button.
				</InfoBox>
			</div>
		`
	})
};
