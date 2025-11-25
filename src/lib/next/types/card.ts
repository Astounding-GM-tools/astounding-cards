interface AttributeBase {
	title: string;
	isPublic: boolean;
}
export interface Trait extends AttributeBase {
	description: string;
}
export interface Stat extends AttributeBase {
	value: number;
	tracked: boolean;
	description?: string;
}

export interface Card {
	id: string;
	title: string;
	subtitle: string;
	description: string;
	image: string | null;
	imageBlob?: Blob | null;
	imageMetadata?: {
		originalName?: string;
		addedAt?: number; // timestamp when image was added
		source?: 'upload' | 'url' | 'generated' | 'ai-generation'; // how the image was added
		size?: number; // file size in bytes
		imageStyle?: string; // generation style if source is 'generated' (e.g., 'classic', 'modern', 'inked')
		imageLocked?: boolean; // if true, prevents regeneration in batch operations
		imageId?: string; // ID from community_images table if AI-generated
		isGenerating?: boolean; // true while AI generation is in progress
	} | null;
	traits: Trait[];
	stats: Stat[];
	// Semantic search embedding (768-dimensional vector from card content)
	// Used for finding similar images and cards
	// Regenerated when title/subtitle/description/traits change
	embedding?: number[] | null;
	// Hash of content used to generate embedding (for change detection)
	embeddingContentHash?: string | null;
}
