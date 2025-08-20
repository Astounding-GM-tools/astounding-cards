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
        source?: 'upload' | 'url'; // how the image was added
        size?: number; // file size in bytes
    } | null;
    traits: Trait[];
    stats: Stat[];
}
