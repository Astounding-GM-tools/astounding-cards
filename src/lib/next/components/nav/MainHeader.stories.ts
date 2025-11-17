import type { Meta, StoryObj } from '@storybook/svelte';
import MainHeader from './MainHeader.svelte';
import DeckPageExample from './MainHeader.DeckPageExample.svelte';

const meta = {
	title: 'Components/MainHeader',
	component: MainHeader,
	tags: ['autodocs']
} satisfies Meta<MainHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// Just the header - no content
export const Default: Story = {
	args: {
		mockIsAuthenticated: false,
		mockDeckCount: 0
	}
};

// Authenticated with decks
export const Authenticated: Story = {
	args: {
		mockIsAuthenticated: true,
		mockUserEmail: 'user@example.com',
		mockDeckCount: 6
	}
};

// With title only
export const WithTitle: Story = {
	args: {
		title: 'My Deck',
		mockIsAuthenticated: true,
		mockUserEmail: 'user@example.com',
		mockDeckCount: 3
	}
};

// With editable title
export const EditableTitle: Story = {
	args: {
		title: 'Click the edit icon →',
		onTitleEdit: () => alert('Edit title clicked!'),
		mockIsAuthenticated: true,
		mockDeckCount: 5
	}
};

// Gallery page variant
export const GalleryPage: Story = {
	args: {
		title: 'Gallery',
		mockIsAuthenticated: false,
		mockDeckCount: 0
	}
};

// Dashboard page variant  
export const DashboardPage: Story = {
	args: {
		title: 'Dashboard',
		mockIsAuthenticated: true,
		mockUserEmail: 'user@example.com',
		mockDeckCount: 12
	}
};

// Full Deck Page - with metadata and actions
export const DeckPageFull: Story = {
	render: () => ({
		Component: DeckPageExample
	})
};
