import { text, integer } from 'drizzle-orm/sqlite-core';
import type { CardTheme } from '$lib/themes';

// Example JSON structure:
/*
{
  "meta": {
    "campaignName": "The Dark Veins",
    "deckName": "ACMC Management",
    "deckNumber": 1,
    "totalDecks": 3,
    "description": "Employees of Appalachian Consolidated Mining Company",
    "tags": ["Corporate", "Management", "Antagonists"],
    "theme": {
      "baseTheme": "corporate",
      "customizations": {
        "colors": {
          "primary": "#1A1A1A",
          "accent": "#C41E3A"
        }
      }
    },
    "version": "1.0"
  },
  "characters": [
    {
      "id": "1",
      "name": "Ambrose Gristlethwaite",
      "role": "CEO, ACMC",
      "age": "63",
      "portrait": "data:image/png;base64,..." // optional base64 image
      "traits": {
        "personality": "Cold, calculating, obsessed with efficiency",
        "motivation": "Maximize profits at any human cost",
        "appearance": "Tall, gaunt man with steel-gray hair and wire-rimmed glasses"
      },
      "details": {
        "bio": "Third-generation mining executive who transformed ACMC from a family business into a ruthless corporate entity...",
        "notes": "Never visits mine sites personally, communicates only through intermediaries",
        "connections": ["Eleanor Blackwood", "Marcus Thane"],
        "secrets": "Knows about the true nature of what was found in Shaft 9"
      }
    },
    // ... 8 more characters
  ]
}
*/

export type DeckTheme = {
  baseTheme: string;
  customizations?: Partial<CardTheme>;
};

export type CharacterDeck = {
  meta: DeckMeta;
  characters: Character[];
};

export type DeckMeta = {
  campaignName: string;
  deckName: string;
  deckNumber: number;
  totalDecks: number;
  description: string;
  tags: string[];
  theme: DeckTheme;
  version: string;
};

export type Character = {
  id: string;
  name: string;
  role: string;
  age: string;
  portrait?: string; // base64 encoded image
  traits: CharacterTraits;
  details: CharacterDetails;
};

export type CharacterTraits = {
  personality: string[];
  motivation: string[];
  appearance: string[];
};

export type CharacterDetails = {
  bio: string;
  notes: string[];
  connections: string[];
  secrets?: string;
};

// Validation function
export function validateDeck(deck: unknown): deck is CharacterDeck {
  if (!deck || typeof deck !== 'object') return false;
  const d = deck as CharacterDeck;

  // Validate meta
  if (!d.meta || typeof d.meta !== 'object') return false;
  if (!d.meta.campaignName || !d.meta.deckName) return false;
  if (typeof d.meta.deckNumber !== 'number' || typeof d.meta.totalDecks !== 'number') return false;
  if (!d.meta.theme || !d.meta.theme.baseTheme) return false;

  // Validate characters array
  if (!Array.isArray(d.characters)) return false;
  if (d.characters.length === 0 || d.characters.length > 9) return false;

  // Validate each character
  return d.characters.every(char => {
    if (!char.id || !char.name || !char.role) return false;
    if (!char.traits || !char.details) return false;
    if (!char.traits.personality || !char.traits.motivation || !char.traits.appearance) return false;
    if (!char.details.bio || !char.details.notes) return false;
    if (!Array.isArray(char.details.connections)) return false;
    return true;
  });
}

// Helper to create an empty deck
export function createEmptyDeck(
  campaignName: string,
  deckName: string,
  baseTheme = 'corporate',
  deckNumber = 1
): CharacterDeck {
  return {
    meta: {
      campaignName,
      deckName,
      deckNumber,
      totalDecks: 1,
      description: '',
      tags: [],
      theme: {
        baseTheme,
        customizations: {}
      },
      version: '1.0'
    },
    characters: []
  };
}

// URL parameter helpers
export function deckToUrlParam(deck: CharacterDeck): string {
  return encodeURIComponent(JSON.stringify(deck));
}

export function deckFromUrlParam(param: string): CharacterDeck | null {
  try {
    const deck = JSON.parse(decodeURIComponent(param));
    return validateDeck(deck) ? deck : null;
  } catch {
    return null;
  }
}
