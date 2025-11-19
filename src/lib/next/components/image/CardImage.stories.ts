import type { Meta, StoryObj } from '@storybook/svelte';
import CardImage from './CardImage.svelte';
import type { Card } from '../../types/card';

const meta = {
	title: 'Card/Sub-components/CardImage',
	component: CardImage,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded'
	}
} satisfies Meta<CardImage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base card structure for testing
const baseCard: Omit<Card, 'image' | 'imageBlob' | 'imageMetadata'> = {
	id: 'test-card',
	title: 'Test Card',
	subtitle: 'Card for testing images',
	description: 'A card used for testing image display',
	traits: [],
	stats: []
};

// With image URL (Elven Ranger)
export const WithImageURL: Story = {
	args: {
		card: {
			...baseCard,
			image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/v3bi3n-1763378291920.png',
			imageBlob: null,
			imageMetadata: null
		}
	}
};

// Dwarven Warrior
export const DwarvenWarrior: Story = {
	args: {
		card: {
			...baseCard,
			image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/zyixci-1763375176585.png',
			imageBlob: null,
			imageMetadata: null
		}
	}
};

// Tiefling Rogue
export const TieflingRogue: Story = {
	args: {
		card: {
			...baseCard,
			image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/mfk86m-1763377336587.png',
			imageBlob: null,
			imageMetadata: null
		}
	}
};

// No image (empty state)
export const NoImage: Story = {
	args: {
		card: {
			...baseCard,
			image: null,
			imageBlob: null,
			imageMetadata: null
		}
	}
};

// Image generating state
export const Generating: Story = {
	args: {
		card: {
			...baseCard,
			image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/v3bi3n-1763378291920.png',
			imageBlob: null,
			imageMetadata: {
				isGenerating: true,
				source: 'ai-generation'
			}
		}
	}
};

// Image with metadata (uploaded)
export const Uploaded: Story = {
	args: {
		card: {
			...baseCard,
			image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/qkjql3-1763378174901.png',
			imageBlob: null,
			imageMetadata: {
				source: 'upload',
				originalName: 'paladin.png',
				addedAt: Date.now(),
				size: 245000
			}
		}
	}
};

// AI-generated image (Inked style)
export const AIGenerated: Story = {
	args: {
		card: {
			...baseCard,
			image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/yfq6ig-1763456832344.png',
			imageBlob: null,
			imageMetadata: {
				source: 'ai-generation',
				imageStyle: 'inked',
				addedAt: Date.now(),
				imageId: 'ai-123'
			}
		}
	}
};

// Locked image (won't regenerate)
export const LockedImage: Story = {
	args: {
		card: {
			...baseCard,
			image: 'https://pub-f5bd56e54b1b462596303404e5994bf7.r2.dev/dev/cards/zyixci-1763375176585.png',
			imageBlob: null,
			imageMetadata: {
				source: 'upload',
				imageLocked: true
			}
		}
	}
};
