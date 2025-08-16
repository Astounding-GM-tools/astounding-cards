export interface CardStat {
    id: string;           // For consistent reference/styling
    name: string;         // Display name
    value: string | number;
    description?: string;
    icon?: string;        // Icon identifier, not tied to stat type
    tracked: boolean;     // For game mechanics tracking
    isPublic: boolean;    // Whether to show on front of card
}

export interface CardTrait {
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
    traits: CardTrait[];
    stats: CardStat[];
    theme?: string;       // Visual styling only
}

// Components for different stat display contexts
export interface StatDisplayProps {
    stat: CardStat;
    compact?: boolean;    // For more condensed layouts
    interactive?: boolean; // For editable/clickable stats
}

// Shared props for stat display components
export interface StatDisplayCommonProps {
    stats: CardStat[];
    filter?: (stat: CardStat) => boolean; // For filtering public/private stats
    layout?: 'grid' | 'list' | 'inline';
    interactive?: boolean;
}