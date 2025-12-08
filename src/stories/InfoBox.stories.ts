import type { Meta, StoryObj } from '@storybook/svelte';
import InfoBox from '$lib/next/components/ui/InfoBox.svelte';
import {
	Info as InfoIcon,
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

