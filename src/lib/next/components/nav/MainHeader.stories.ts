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

