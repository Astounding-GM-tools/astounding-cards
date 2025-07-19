// Character and deck types
export type Character = {
  id: string;
  name: string;
  role: string;
  age: string;
  portrait: string | null;
  traits: string[];
  bio: string;
  notes?: string;  // Optional notes field for back of card
};

export type CharacterDeck = {
  id: string;
  meta: {
    name: string;
    theme: string;
  };
  characters: Character[];
};

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

  if (!char.age || parseInt(char.age) <= 0) {
    errors.push({ field: 'age', message: 'Age must be a positive number' });
  }

  if (!Array.isArray(char.traits) || char.traits.length === 0) {
    errors.push({ field: 'traits', message: 'At least one trait is required' });
  }

  if (char.traits && char.traits.length > 5) {
    errors.push({ field: 'traits', message: 'Maximum 5 traits allowed' });
  }

  if (!char.bio?.trim()) {
    errors.push({ field: 'bio', message: 'Bio is required' });
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

  if (!Array.isArray(deck.characters)) {
    errors.push({ field: 'characters', message: 'Characters must be an array' });
  } else {
    if (!allowEmpty && deck.characters.length === 0) {
      errors.push({ field: 'characters', message: 'At least one character is required' });
    }
    if (deck.characters.length > 9) {
      errors.push({ field: 'characters', message: 'Maximum 9 characters allowed' });
    }
  }

  return errors;
} 