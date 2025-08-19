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
    imageBlob?: Blob;
    traits: Trait[];
    stats: Stat[];
}
