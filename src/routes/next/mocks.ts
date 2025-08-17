import type { Card } from "$lib/next/types/card";

export const mockCardOne = {
    id: 'test-1',
    title: 'Frostbite Pass',
    subtitle: 'Treacherous route',
    description: 'A narrow passage through the mountains, fraught with peril.',
    image: null,
    traits: [
        { label: 'Terrain', value: 'Mountain', isPublic: true },
        { label: 'Climate', value: 'Cold', isPublic: true },
        { label: 'Secret', value: 'Hidden Cave', isPublic: false }
    ],
    stats: [
        { label: 'Defense', value: 15, tracked: false, isPublic: true },
        { label: 'Population', value: 50, tracked: true, isPublic: false, description: 'Bandits and brigands, all looking for the adventurers.' },
        { label: 'Area', value: '2 miles', tracked: false, isPublic: true },
        { label: 'Alert', value: 10, tracked: true, isPublic: false, description: 'Failed stealth check? Tick a box. When full, sound the alarm.' }
    ]
};

export const mockCardTwo = {
    id: 'test-2',
    title: 'The Ethereal Compass',
    subtitle: 'Mystical Device',
    description: 'An ornate compass that responds to supernatural phenomena rather than magnetic north.',
    image: null,
    traits: [
        { label: 'Warm brass', value: 'Brass and silver construction, always warm to the touch', isPublic: true },
        { label: 'Pointy', value: 'Always points in the same direction - but not north.', isPublic: true },
        { label: 'True North', value: 'Points to magical disturbances', isPublic: false },
        { label: 'Mindful', value: 'Is in fact sentient', isPublic: false }
    ],
    stats: [
        { label: 'Value', value: '1,200', tracked: false, isPublic: false, description: 'Discerning collectors would drool all over the Ethereal Compass; a pawnshop might offer 10% of the value of this "decorative, but non-functional compass".' },
        { label: 'Rarity', value: 'Legendary', tracked: false, isPublic: false },
        { label: 'Weight', value: 'Light', tracked: false, isPublic: true },
        { label: 'Health', value: 10, tracked: true, isPublic: true },
        { label: 'Charges', value: 14, tracked: true, isPublic: false, description: '1 charge per turn when active. May be charged.' }
    ]
};

export const mockDeck: Card[] = [mockCardOne, mockCardTwo];