import type { Meta, StoryObj } from '@storybook/svelte';
import MainHeader from './MainHeader.svelte';
import DeckPageExample from './MainHeader.DeckPageExample.svelte';
import GalleryExample from './MainHeader.GalleryExample.svelte';
import DashboardExample from './MainHeader.DashboardExample.svelte';
import DeckPreviewExample from './MainHeader.DeckPreviewExample.svelte';

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
		mockDeckCount: 6,
		mockTokenBalance: 1500
	}
};

// With title only
export const WithTitle: Story = {
	args: {
		title: 'My Deck',
		mockIsAuthenticated: true,
		mockUserEmail: 'user@example.com',
		mockDeckCount: 3,
		mockTokenBalance: 250
	}
};

// With editable title
export const EditableTitle: Story = {
	args: {
		title: 'Click the edit icon →',
		onTitleEdit: () => alert('Edit title clicked!'),
		mockIsAuthenticated: true,
		mockDeckCount: 5,
		mockTokenBalance: 3200
	}
};

// Gallery Page - with search and filters
export const GalleryPageFull: Story = {
	render: () => ({
		Component: GalleryExample
	})
};

// Dashboard Page - with deck creation actions
export const DashboardPageFull: Story = {
	render: () => ({
		Component: DashboardExample
	})
};

// Full Deck Page - with metadata and actions (editing own deck)
export const DeckPageFull: Story = {
	render: () => ({
		Component: DeckPageExample
	})
};

// Deck Preview Page - viewing someone else's published deck (read-only)
export const DeckPreviewPageFull: Story = {
	render: () => ({
		Component: DeckPreviewExample
	})
};
