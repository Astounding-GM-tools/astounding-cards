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
		source?: 'upload' | 'url' | 'generated'; // how the image was added
		size?: number; // file size in bytes
		imageStyle?: string; // generation style if source is 'generated' (e.g., 'classic', 'modern', 'inked')
	} | null;
	traits: Trait[];
	stats: Stat[];
}
