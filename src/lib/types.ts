// Card stats and types
export type CardSize = 'poker' | 'tarot';

export type Portability = 'negligible' | 'light' | 'medium' | 'heavy' | 'stationary';

export type AreaReference = {
  type: 'hard' | 'soft';
  value: string;  // Card ID for hard links, area name for soft links
};

export type CardStat = {
  type: 'character';
  value: string;  // age
} | {
  type: 'item';
  value: Portability;
} | {
  type: 'location';
  value: AreaReference;
};

// Trait type
export interface Trait {
  label: string;
  description: string;
}

// Character and deck types
export interface Character {
  id: string;
  name: string;
  role: string;
  portrait: string | null;
  portraitBlob?: Blob;  // Optional blob data for the portrait
  traits: string[];
  secrets: string[];  // New array for back of card
  desc: string;
  type?: string;
  stat?: CardStat;
}

export interface CharacterDeck {
  id: string;
  meta: {
    name: string;
    theme: string;
    cardSize: CardSize;
    lastEdited: number;  // Unix timestamp
    createdAt: number;   // Unix timestamp
  };
  characters: Character[];
}

// Validation types
export type ValidationError = {
  field: string;
  message: string;
};

// Validation functions
export function validateCharacter(char: Partial<Character>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!char.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!char.role?.trim()) {
    errors.push({ field: 'role', message: 'Role is required' });
  }

  if (!char.desc?.trim()) {
    errors.push({ field: 'desc', message: 'Description is required' });
  }

  if (!Array.isArray(char.traits)) {
    errors.push({ field: 'traits', message: 'Traits must be an array' });
  }

  if (!Array.isArray(char.secrets)) {
    errors.push({ field: 'secrets', message: 'Secrets must be an array' });
  }

  return errors;
}

export function validateDeck(deck: Partial<CharacterDeck>, allowEmpty = false): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!deck.meta?.name?.trim()) {
    errors.push({ field: 'meta.name', message: 'Deck name is required' });
  }

  if (!deck.meta?.theme?.trim()) {
    errors.push({ field: 'meta.theme', message: 'Theme is required' });
  }

  if (!deck.meta?.cardSize || !['poker', 'tarot'].includes(deck.meta.cardSize)) {
    errors.push({ field: 'meta.cardSize', message: 'Invalid card size' });
  }

  if (!Array.isArray(deck.characters)) {
    errors.push({ field: 'characters', message: 'Characters must be an array' });
  } else if (!allowEmpty && deck.characters.length === 0) {
    errors.push({ field: 'characters', message: 'At least one character is required' });
  }

  return errors;
} 