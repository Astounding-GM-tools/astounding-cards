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


