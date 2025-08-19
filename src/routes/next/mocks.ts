import type { Card } from "$lib/next/types/card";

export const mockCardOne = {
    id: 'test-1',
    title: 'Frostbite Pass',
    subtitle: 'Treacherous route',
    description: 'A narrow passage through the mountains, fraught with peril.',
    image: null,
    traits: [
        { title: 'Terrain', description: 'Mountain', isPublic: true },
        { title: 'Climate', description: 'Cold', isPublic: true },
        { title: 'Secret', description: 'Hidden Cave', isPublic: false }
    ],
    stats: [
        { title: 'Defense', value: 15, tracked: false, isPublic: true },
        { title: 'Population', value: 50, tracked: true, isPublic: false, description: 'Bandits and brigands, all looking for the adventurers.' },
        { title: 'Area', value: 2, tracked: false, isPublic: true, description: '2 miles area coverage' },
        { title: 'Alert', value: 10, tracked: true, isPublic: false, description: 'Failed stealth check? Tick a box. When full, sound the alarm.' }
    ]
};

export const mockCardTwo = {
    id: 'test-2',
    title: 'The Ethereal Compass',
    subtitle: 'Mystical Device',
    description: 'An ornate compass that responds to supernatural phenomena rather than magnetic north.',
    image: null,
    traits: [
        { title: 'Warm brass', description: 'Brass and silver construction, always warm to the touch', isPublic: true },
        { title: 'Pointy', description: 'Always points in the same direction - but not north.', isPublic: true },
        { title: 'True North', description: 'Points to magical disturbances', isPublic: false },
        { title: 'Mindful', description: 'Is in fact sentient', isPublic: false }
    ],
    stats: [
        { title: 'Value', value: 1200, tracked: false, isPublic: false, description: 'Discerning collectors would drool all over the Ethereal Compass; a pawnshop might offer 10% of the value of this "decorative, but non-functional compass".' },
        { title: 'Rarity', value: 9, tracked: false, isPublic: false, description: 'Legendary (9/10 scale)' },
        { title: 'Weight', value: 1, tracked: false, isPublic: true, description: 'Light weight (1/10 scale)' },
        { title: 'Health', value: 10, tracked: true, isPublic: true },
        { title: 'Charges', value: 14, tracked: true, isPublic: false, description: '1 charge per turn when active. May be charged.' }
    ]
};

export const mockDeck: Card[] = [mockCardOne, mockCardTwo];