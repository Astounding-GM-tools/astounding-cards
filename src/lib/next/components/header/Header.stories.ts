import type { Meta, StoryObj } from '@storybook/svelte';
import Header from './Header.svelte';

const meta = {
	title: 'Card/Sub-components/Header',
	component: Header,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded'
	}
} satisfies Meta<Header>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default header
export const Default: Story = {
	args: {
		title: 'Fire Dragon',
		subtitle: 'Legendary Creature'
	}
};

// Long title
export const LongTitle: Story = {
	args: {
		title: 'Ancient Fire-Breathing Dragon of the Volcanic Mountains',
		subtitle: 'Legendary Creature'
	}
};

// Long subtitle
export const LongSubtitle: Story = {
	args: {
		title: 'Fire Dragon',
		subtitle: 'Legendary Elder Dragon Creature - Ultra Rare Mythic Card'
	}
};

// Both long
export const BothLong: Story = {
	args: {
		title: 'Ancient Fire-Breathing Dragon of the Volcanic Mountains',
		subtitle: 'Legendary Elder Dragon Creature - Ultra Rare Mythic Card from the Ancient Realms'
	}
};

// Short text
export const Short: Story = {
	args: {
		title: 'Goblin',
		subtitle: 'Creature'
	}
};

// Special characters
export const SpecialCharacters: Story = {
	args: {
		title: 'Æther Mage ✨',
		subtitle: 'Mystical Entity • Spellcaster'
	}
};

// Numbers in title
export const WithNumbers: Story = {
	args: {
		title: 'Dragon Mk. II',
		subtitle: 'Version 2.0 - Upgraded'
	}
};
