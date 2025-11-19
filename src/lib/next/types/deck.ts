import type { Card, Trait, Stat } from './card';

// Re-export types for convenience
export type { Card, Trait, Stat } from './card';

export type Layout = 'tarot' | 'poker';

export type Theme = 'classic' | 'cordial' | 'scriptorum' | 'cyberdeck';

export type ImageStyle = 'classic' | 'modern' | 'inked';

export interface Deck {
	id: string;
	meta: {
		title: string;
		description?: string;
		theme: Theme;
		imageStyle: ImageStyle;
		layout: Layout;
		lastEdited: number;
		createdAt: number;
		published_deck_id?: string; // ID of published deck in published_decks table
		published_slug?: string; // Slug of published deck
	};
	cards: Card[];
}
