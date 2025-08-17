import type { Theme } from "./deck";

export interface Trait {
    label: string;
    value: string;
    isPublic: boolean;
}

export interface Stat {
    label: string;
    value: number | string;
    description?: string;
    tracked: boolean;
    isPublic: boolean;
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
    theme?: Theme;
}