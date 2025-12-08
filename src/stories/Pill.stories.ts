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


