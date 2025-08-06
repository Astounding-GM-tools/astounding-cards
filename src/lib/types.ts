// Card stats and types
export type CardSize = 'poker' | 'tarot';

// Flexible stats system types (imported from stats.ts)
export interface StatDefinition {
  id: string;           // Unique identifier: 'attack', 'defense', 'custom-magic'
  label: string;        // Display name: 'Attack', 'Defense', 'Magic Power' 
  icon: string;         // Icon filename without extension: 'attack', 'defense'
  category: string;     // Grouping: 'combat', 'physical', 'magic', 'utility', 'custom'
}

export interface CardStat {
  statId: string;       // References StatDefinition.id
  value: string | number; // The actual stat value
}

// Legacy types - kept for migration
export type Portability = 'negligible' | 'light' | 'medium' | 'heavy' | 'stationary';

export type AreaReference = {
  type: 'hard' | 'soft';
  value: string;  // Card ID for hard links, area name for soft links
};

export type LegacyCardStat = {
  type: 'character';
  value: string;  // age
} | {
  type: 'item';
  value: Portability;
} | {
  type: 'location';
  value: AreaReference;
};

// Optional ruleset reference for game systems
export type RulesetRef = {
  name: string;  // e.g. "D&D 5E", "Pathfinder 2E", etc.
  url?: string;  // Optional link to ruleset documentation/reference
};

// Base card type
export interface Card {
  id: string;
  name: string;
  role: string;
  image: string | null;
  imageBlob?: Blob;
  traits: string[];
  secrets: string[];
  desc: string;
  type: 'character' | 'location' | 'item' | string;
  
  // NEW flexible stats system (replaces stat)
  stats?: CardStat[];  // Array of icon+value pairs for front card
  
  // LEGACY - kept for migration
  stat?: LegacyCardStat;
  
  theme?: string;  // Override deck theme
  gameStats?: { [key: string]: string | number };  // Flexible game system stats (back card)
}

// Deck type
export interface Deck {
  id: string;
  meta: {
    name: string;
    theme: string;
    cardSize: CardSize;
    lastEdited: number;
    createdAt: number;
    description?: string;
    tags?: string[];
    rulesetRef?: RulesetRef;
    customStats?: StatDefinition[];  // Deck-specific custom stat definitions
  };
  cards: Card[];
}

// Validation types
export type ValidationError = {
  field: string;
  message: string;
};

// Validation functions
export function validateCard(card: Partial<Card>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!card.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!card.role?.trim()) {
    errors.push({ field: 'role', message: 'Role is required' });
  }

  if (!card.desc?.trim()) {
    errors.push({ field: 'desc', message: 'Description is required' });
  }

  if (!Array.isArray(card.traits)) {
    errors.push({ field: 'traits', message: 'Traits must be an array' });
  }

  if (!Array.isArray(card.secrets)) {
    errors.push({ field: 'secrets', message: 'Secrets must be an array' });
  }

  if (!card.type) {
    errors.push({ field: 'type', message: 'Card type is required' });
  }

  // Validate new stats array
  if (card.stats) {
    if (!Array.isArray(card.stats)) {
      errors.push({ field: 'stats', message: 'Stats must be an array' });
    } else {
      card.stats.forEach((stat, index) => {
        if (!stat.statId || typeof stat.statId !== 'string') {
          errors.push({ field: `stats[${index}].statId`, message: 'Stat ID is required' });
        }
        if (stat.value === undefined || stat.value === null) {
          errors.push({ field: `stats[${index}].value`, message: 'Stat value is required' });
        }
      });
    }
  }

  // Legacy validation - keep during migration
  if (card.stat) {
    // Legacy validation logic (simplified)
  }

  // Optional fields don't need validation unless present
  if (card.theme !== undefined && typeof card.theme !== 'string') {
    errors.push({ field: 'theme', message: 'Theme must be a string' });
  }

  if (card.gameStats !== undefined && typeof card.gameStats !== 'object') {
    errors.push({ field: 'gameStats', message: 'Game stats must be an object' });
  }

  return errors;
}

export function validateDeck(deck: Partial<Deck>, allowEmpty = false): ValidationError[] {
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

  if (!Array.isArray(deck.cards)) {
    errors.push({ field: 'cards', message: 'Cards must be an array' });
  } else if (!allowEmpty && deck.cards.length === 0) {
    errors.push({ field: 'cards', message: 'At least one card is required' });
  }

  // Optional fields don't need validation unless present
  if (deck.meta?.description !== undefined && typeof deck.meta.description !== 'string') {
    errors.push({ field: 'meta.description', message: 'Description must be a string' });
  }

  if (deck.meta?.tags !== undefined && !Array.isArray(deck.meta.tags)) {
    errors.push({ field: 'meta.tags', message: 'Tags must be an array' });
  }

  if (deck.meta?.rulesetRef !== undefined) {
    if (typeof deck.meta.rulesetRef !== 'object') {
      errors.push({ field: 'meta.rulesetRef', message: 'Ruleset reference must be an object' });
    } else if (!deck.meta.rulesetRef.name) {
      errors.push({ field: 'meta.rulesetRef.name', message: 'Ruleset name is required' });
    }
  }

  // Validate each card
  if (deck.cards?.length) {
    deck.cards.forEach((card, index) => {
      const cardErrors = validateCard(card);
      if (cardErrors.length > 0) {
        errors.push({ 
          field: `cards[${index}]`, 
          message: `Invalid card: ${cardErrors.map(e => e.message).join(', ')}` 
        });
      }
    });
  }

  return errors;
}

// Type guards
export function isCard(card: unknown): card is Card {
  return (
    typeof card === 'object' &&
    card !== null &&
    typeof (card as Card).id === 'string' &&
    typeof (card as Card).name === 'string' &&
    typeof (card as Card).role === 'string' &&
    typeof (card as Card).desc === 'string' &&
    typeof (card as Card).type === 'string' &&
    Array.isArray((card as Card).traits) &&
    Array.isArray((card as Card).secrets) &&
    (card as Card).traits.every(trait => typeof trait === 'string') &&
    (card as Card).secrets.every(secret => typeof secret === 'string')
  );
}

export function isDeck(deck: unknown): deck is Deck {
  return (
    typeof deck === 'object' &&
    deck !== null &&
    typeof (deck as Deck).id === 'string' &&
    typeof (deck as Deck).meta === 'object' &&
    typeof (deck as Deck).meta.name === 'string' &&
    typeof (deck as Deck).meta.theme === 'string' &&
    Array.isArray((deck as Deck).cards) &&
    (deck as Deck).cards.every(isCard)
  );
}

