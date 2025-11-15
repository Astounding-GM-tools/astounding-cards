import type { Meta, StoryObj } from '@storybook/svelte';
import InlineImageSelector from './InlineImageSelector.svelte';

const meta = {
	title: 'Components/InlineImageSelector',
	component: InlineImageSelector,
	tags: ['autodocs'],
	argTypes: {
		cardSize: {
			control: 'select',
			options: ['tarot', 'poker']
		}
	}
} satisfies Meta<InlineImageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base story - no image
export const NoImage: Story = {
	args: {
		cardSize: 'tarot',
		hasExistingImage: false,
		onImageChange: (blob, sourceUrl, filename) => {
			console.log('Image changed:', { blob, sourceUrl, filename });
		},
		onGenerateImage: () => {
			console.log('Generate AI image clicked');
		},
	}
};

// With existing image - uploaded
export const WithUploadedImage: Story = {
	args: {
		cardSize: 'tarot',
		hasExistingImage: true,
		existingImageInfo: {
			filename: 'hero-portrait.png',
			source: 'uploaded',
			timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
			status: 'ok'
		},
		imageLocked: false,
		onRemoveImage: () => {
			console.log('Remove image clicked');
		},
		onGenerateImage: () => {
			console.log('Generate AI image clicked');
		},
		onToggleLock: (locked) => {
			console.log('Lock toggled:', locked);
		},
	}
};

// With existing image - downloaded from URL
export const WithDownloadedImage: Story = {
	args: {
		cardSize: 'tarot',
		hasExistingImage: true,
		existingImageInfo: {
			filename: 'character-art.jpg',
			source: 'downloaded',
			timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
			status: 'ok'
		},
		imageLocked: false,
		onRemoveImage: () => {
			console.log('Remove image clicked');
		},
		onGenerateImage: () => {
			console.log('Generate AI image clicked');
		},
		onToggleLock: (locked) => {
			console.log('Lock toggled:', locked);
		},
	}
};

// Locked image
export const LockedImage: Story = {
	args: {
		cardSize: 'tarot',
		hasExistingImage: true,
		existingImageInfo: {
			filename: 'final-hero-art.png',
			source: 'generated',
			timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
			status: 'ok'
		},
		imageLocked: true,
		onRemoveImage: () => {
			console.log('Remove image clicked');
		},
		onGenerateImage: () => {
			console.log('Generate AI image clicked');
		},
		onToggleLock: (locked) => {
			console.log('Lock toggled:', locked);
		},
	}
};

// No image - generate button disabled (not authenticated)
export const NotAuthenticated: Story = {
	args: {
		cardSize: 'tarot',
		hasExistingImage: false,
		onGenerateImage: () => {
			console.log('Generate AI image clicked');
		},
	}
};

// Add image encouragement
export const AddImageEncouragement: Story = {
	args: {
		cardSize: 'tarot',
		hasExistingImage: false,
		existingImageInfo: {
			filename: 'Add an image',
			status: 'add-image',
			message: 'Cards look better with images!'
		},
		onImageChange: (blob, sourceUrl, filename) => {
			console.log('Image changed:', { blob, sourceUrl, filename });
		},
		onGenerateImage: () => {
			console.log('Generate AI image clicked');
		},
	}
};

// Ready to save warning
export const ReadyToSave: Story = {
	args: {
		cardSize: 'tarot',
		hasExistingImage: true,
		existingImageInfo: {
			filename: 'new-image.png',
			source: 'uploaded',
			timestamp: new Date(),
			status: 'ready-to-save'
		},
		imageLocked: false,
		onRemoveImage: () => {
			console.log('Remove image clicked');
		},
		onGenerateImage: () => {
			console.log('Generate AI image clicked');
		},
		onToggleLock: (locked) => {
			console.log('Lock toggled:', locked);
		},
	}
};
