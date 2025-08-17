import type { Card } from "$lib/next/types/card";

export const mockCardOne = {
    id: 'test-1',
    name: 'Mountain Pass',
    subtitle: 'Treacherous Route',
    description: 'A narrow passage through the mountains',
    image: null,
    traits: [
        { label: 'Terrain', value: 'Mountain', isPublic: true },
        { label: 'Climate', value: 'Cold', isPublic: true },
        { label: 'Secret', value: 'Hidden Cave', isPublic: false }
    ],
    stats: [
        { id: 'defense', name: 'Defense', value: 15, tracked: false, isPublic: true },
        { id: 'population', name: 'Population', value: '50 Bandits', tracked: false, isPublic: false },
        { id: 'area', name: 'Area', value: '2 miles', tracked: false, isPublic: true }
    ]
};

export const mockCardTwo = {
    id: 'test-2',
    name: 'The Ethereal Compass',
    subtitle: 'Mystical Device',
    description: 'An ornate compass that responds to supernatural phenomena rather than magnetic north.',
    image: null,
    traits: [
        { label: 'Appearance', value: 'Brass and silver construction, always warm to the touch', isPublic: true },
        { label: 'Property', value: 'Points to magical disturbances', isPublic: true },
        { label: 'Hidden', value: 'Has a mind of its own', isPublic: false }
    ],
    stats: [
        { id: 'value', name: 'Value', value: '1,200', tracked: false, isPublic: false },
        { id: 'rarity', name: 'Rarity', value: 'Legendary', tracked: false, isPublic: false },
        { id: 'weight', name: 'Weight', value: 'Light', tracked: false, isPublic: true },
        { id: 'health', name: 'Health', value: 10, tracked: true, isPublic: true }
    ]
};

export const mockDeck: Card[] = [mockCardOne, mockCardTwo];
