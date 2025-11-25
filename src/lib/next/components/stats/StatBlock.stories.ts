import type { Meta, StoryObj } from '@storybook/svelte';
import StatBlock from './StatBlock.svelte';
import type { Stat } from '../../types/card';

const meta = {
	title: 'Card/Sub-components/StatBlock',
	component: StatBlock,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded'
	}
} satisfies Meta<StatBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// Typical private stats (shown on card back)
export const Typical: Story = {
	args: {
		stats: [
			{ title: 'Mana Cost', value: 6, tracked: false, isPublic: false },
			{ title: 'Defense', value: 7, tracked: false, isPublic: false }
		]
	}
};

// With tracking boxes (health/resources)
export const WithTracking: Story = {
	args: {
		stats: [
			{ title: 'Health', value: 10, tracked: true, isPublic: false },
			{ title: 'Mana', value: 8, tracked: true, isPublic: false }
		]
	}
};

// High value tracking (> 12, uses smaller boxes)
export const HighValueTracking: Story = {
	args: {
		stats: [
			{ title: 'Health', value: 25, tracked: true, isPublic: false },
			{ title: 'Energy', value: 15, tracked: true, isPublic: false }
		]
	}
};

// With descriptions
export const WithDescriptions: Story = {
	args: {
		stats: [
			{
				title: 'Mana',
				value: 10,
				tracked: true,
				isPublic: false,
				description: 'Magical energy used to cast spells'
			},
			{
				title: 'Armor',
				value: 5,
				tracked: false,
				isPublic: false,
				description: 'Reduces physical damage taken'
			}
		]
	}
};

// Long descriptions
export const LongDescriptions: Story = {
	args: {
		stats: [
			{
				title: 'Mana',
				value: 10,
				tracked: true,
				isPublic: false,
				description:
					'Magical energy that flows through the caster, used to power spells and abilities. Regenerates slowly over time.'
			},
			{
				title: 'Shield',
				value: 5,
				tracked: false,
				isPublic: false,
				description:
					'A magical barrier that absorbs incoming damage before health is affected. Can be depleted and must recharge.'
			}
		]
	}
};

// Many stats
export const Many: Story = {
	args: {
		stats: [
			{ title: 'Mana', value: 10, tracked: true, isPublic: false },
			{ title: 'Stamina', value: 8, tracked: true, isPublic: false },
			{ title: 'Armor', value: 5, tracked: false, isPublic: false },
			{ title: 'Magic Resist', value: 3, tracked: false, isPublic: false },
			{ title: 'Speed', value: 7, tracked: false, isPublic: false }
		]
	}
};

// Single stat
export const Single: Story = {
	args: {
		stats: [{ title: 'Mana Cost', value: 6, tracked: false, isPublic: false }]
	}
};

// Low values with tracking
export const LowValueTracking: Story = {
	args: {
		stats: [
			{ title: 'Health', value: 3, tracked: true, isPublic: false },
			{ title: 'Mana', value: 2, tracked: true, isPublic: false }
		]
	}
};

// Edge case: exactly 12 (boundary for box style change)
export const Exactly12: Story = {
	args: {
		stats: [{ title: 'Health', value: 12, tracked: true, isPublic: false }]
	}
};

// Edge case: exactly 13 (just over boundary)
export const Exactly13: Story = {
	args: {
		stats: [{ title: 'Health', value: 13, tracked: true, isPublic: false }]
	}
};

// Very high value
export const VeryHighValue: Story = {
	args: {
		stats: [{ title: 'Max Health', value: 100, tracked: true, isPublic: false }]
	}
};

// Mixed: some tracked, some not, some with descriptions
export const Mixed: Story = {
	args: {
		stats: [
			{
				title: 'Health',
				value: 10,
				tracked: true,
				isPublic: false,
				description: 'Life points'
			},
			{ title: 'Mana', value: 8, tracked: true, isPublic: false },
			{
				title: 'Armor',
				value: 5,
				tracked: false,
				isPublic: false,
				description: 'Physical protection'
			},
			{ title: 'Speed', value: 7, tracked: false, isPublic: false }
		]
	}
};

// Only private stats shown (filter demonstration)
export const PrivateOnly: Story = {
	args: {
		stats: [
			{ title: 'Power', value: 8, tracked: false, isPublic: true }, // Won't show
			{ title: 'Mana Cost', value: 6, tracked: false, isPublic: false },
			{ title: 'Defense', value: 7, tracked: false, isPublic: false }
		]
	}
};

// Empty (no private stats)
export const Empty: Story = {
	args: {
		stats: []
	}
};
