import type { Meta, StoryObj } from '@storybook/svelte';
import TraitList from './TraitList.svelte';
import type { Trait } from '../../types/card';

const meta = {
	title: 'Card/Sub-components/TraitList',
	component: TraitList,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded'
	}
} satisfies Meta<TraitList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Few traits
export const Few: Story = {
	args: {
		traits: [
			{ title: 'Flying', description: 'Can attack flying creatures', isPublic: true },
			{ title: 'Fire Breath', description: 'Deals 3 damage to target', isPublic: true }
		]
	}
};

// Many traits
export const Many: Story = {
	args: {
		traits: [
			{ title: 'Flying', description: 'Can attack flying creatures', isPublic: true },
			{ title: 'Fire Breath', description: 'Deals 3 damage', isPublic: true },
			{ title: 'Armored', description: 'Reduced damage', isPublic: true },
			{ title: 'Ancient', description: 'Very old', isPublic: true },
			{ title: 'Magical', description: 'Uses magic', isPublic: true }
		]
	}
};

// Single trait
export const Single: Story = {
	args: {
		traits: [{ title: 'Quick', description: 'Moves fast', isPublic: true }]
	}
};

// Empty
export const Empty: Story = {
	args: {
		traits: []
	}
};

// Long descriptions
export const LongDescriptions: Story = {
	args: {
		traits: [
			{
				title: 'Fire Breath',
				description:
					'Can breathe fire in a cone, dealing massive damage to all creatures in the area of effect',
				isPublic: true
			},
			{
				title: 'Ancient Knowledge',
				description:
					'Has lived for millennia and accumulated vast wisdom about the world, its history, and forgotten lore',
				isPublic: true
			}
		]
	}
};

// Long trait names
export const LongNames: Story = {
	args: {
		traits: [
			{
				title: 'Extremely Powerful Fire Breathing',
				description: 'Breathes fire',
				isPublic: true
			},
			{
				title: 'Ancient Draconic Knowledge',
				description: 'Knows old secrets',
				isPublic: true
			}
		]
	}
};

// Short names and descriptions
export const Short: Story = {
	args: {
		traits: [
			{ title: 'Fast', description: 'Quick', isPublic: true },
			{ title: 'Big', description: 'Large', isPublic: true },
			{ title: 'Red', description: 'Red', isPublic: true }
		]
	}
};

// Mixed public and private (though component doesn't filter)
export const Mixed: Story = {
	args: {
		traits: [
			{ title: 'Flying', description: 'Can fly', isPublic: true },
			{ title: 'Hidden Ability', description: 'Secret power', isPublic: false }
		]
	}
};

// Special characters
export const SpecialCharacters: Story = {
	args: {
		traits: [
			{ title: 'Æther Touch', description: 'Channels æther energy', isPublic: true },
			{ title: 'Fire • Ice', description: 'Dual element mastery', isPublic: true },
			{ title: 'Poison ☠', description: 'Toxic damage', isPublic: true }
		]
	}
};
