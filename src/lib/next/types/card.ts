export interface Stat {
    id: string;           // For consistent reference/styling
    name: string;         // Display name
    value: string | number;
    description?: string;
    icon?: string;        // Icon identifier, not tied to stat type
    tracked: boolean;     // For game mechanics tracking
    isPublic: boolean;    // Whether to show on front of card
}

export interface Trait {
    label: string;
    value: string;
    isPublic: boolean;    // Whether to show on front of card
}

export interface Card {
    id: string;
    name: string;
    subtitle: string;     // Was 'role' - more generic name
    description: string;
    image: string | null;
    imageBlob?: Blob;
    traits: Trait[];
    stats: Stat[];
    theme?: string;       // Visual styling only
}
