import type { Meta, StoryObj } from '@storybook/svelte';
import StatFocus from './StatFocus.svelte';
import type { Stat } from '../../types/card';

const meta = {
	title: 'Card/Sub-components/StatFocus',
	component: StatFocus,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
		backgrounds: {
			default: 'light'
		}
	}
} satisfies Meta<StatFocus>;

export default meta;
type Story = StoryObj<typeof meta>;

// Typical stats (Power & Health)
export const Typical: Story = {
	args: {
		stats: [
			{ title: 'Power', value: 8, tracked: false, isPublic: true },
			{ title: 'Health', value: 10, tracked: true, isPublic: true }
		]
	}
};

// Single stat
export const Single: Story = {
	args: {
		stats: [{ title: 'Power', value: 5, tracked: false, isPublic: true }]
	}
};

// Many stats
export const Many: Story = {
	args: {
		stats: [
			{ title: 'Power', value: 8, tracked: false, isPublic: true },
			{ title: 'Health', value: 10, tracked: true, isPublic: true },
			{ title: 'Speed', value: 6, tracked: false, isPublic: true },
			{ title: 'Defense', value: 7, tracked: false, isPublic: true }
		]
	}
};

// High values
export const HighValues: Story = {
	args: {
		stats: [
			{ title: 'Power', value: 99, tracked: false, isPublic: true },
			{ title: 'Health', value: 100, tracked: true, isPublic: true }
		]
	}
};

// Low values
export const LowValues: Story = {
	args: {
		stats: [
			{ title: 'Power', value: 1, tracked: false, isPublic: true },
			{ title: 'Health', value: 1, tracked: true, isPublic: true }
		]
	}
};

// Zero values
export const Zero: Story = {
	args: {
		stats: [
			{ title: 'Power', value: 0, tracked: false, isPublic: true },
			{ title: 'Health', value: 0, tracked: true, isPublic: true }
		]
	}
};

// Long stat names
export const LongNames: Story = {
	args: {
		stats: [
			{ title: 'Attack Power', value: 8, tracked: false, isPublic: true },
			{ title: 'Max Health', value: 10, tracked: true, isPublic: true }
		]
	}
};

// Short stat names
export const ShortNames: Story = {
	args: {
		stats: [
			{ title: 'ATK', value: 8, tracked: false, isPublic: true },
			{ title: 'HP', value: 10, tracked: true, isPublic: true }
		]
	}
};

// Only public stats shown (filter demonstration)
export const PublicOnly: Story = {
	args: {
		stats: [
			{ title: 'Power', value: 8, tracked: false, isPublic: true },
			{ title: 'Health', value: 10, tracked: true, isPublic: true },
			{ title: 'Hidden', value: 5, tracked: false, isPublic: false } // Won't show
		]
	}
};

// Three-digit values
export const ThreeDigits: Story = {
	args: {
		stats: [
			{ title: 'Power', value: 999, tracked: false, isPublic: true },
			{ title: 'Health', value: 888, tracked: true, isPublic: true }
		]
	}
};

// Empty (no public stats)
export const Empty: Story = {
	args: {
		stats: []
	}
};
