import type { Card, Trait, Stat } from './card';

// Re-export types for convenience
export type { Card, Trait, Stat } from './card';

export type Layout = 'tarot' | 'poker';

export type Theme = 'classic' | 'cordial' | 'scriptorum' | 'cyberdeck';

export type ImageStyle = 'classic' | 'modern' | 'inked';

interface DeckMeta {
	title: string;
	description?: string;
	theme: Theme;
	imageStyle: ImageStyle;
	layout: Layout;
	lastEdited: number;
	createdAt: number;
	lastPublished?: number; // Timestamp of last publish (for detecting unpublished changes)
	published_deck_id?: string; // ID of published deck in published_decks table
	published_slug?: string; // Slug of published deck
	creator_id?: string; // User ID of original creator (for imported decks)
	creator_name?: string; // Display name of original creator (for imported decks)
	remix_of?: string; // ID of published deck this was remixed from (for tracking lineage)
	// Semantic search embedding (768-dimensional vector from deck content)
	// Aggregated from card embeddings or generated from deck title/description
	embedding?: number[] | null;
	// Hash of content used to generate embedding (for change detection)
	embeddingContentHash?: string | null;
};

export interface Deck {
	id: string;
	meta: DeckMeta;
	cards: Card[];
}
