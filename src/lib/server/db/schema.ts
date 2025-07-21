import type { InferSelectModel } from 'drizzle-orm';
import { pgTable, text, timestamp, integer, json } from 'drizzle-orm/pg-core';
import type { Character, CharacterDeck, Trait } from '$lib/types';

export const decks = pgTable('decks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  theme: text('theme').notNull(),
  cardSize: text('card_size').notNull().default('poker'),
  lastEdited: timestamp('last_edited').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1),
});

export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  deckId: text('deck_id').notNull().references(() => decks.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  portrait: text('portrait'),
  publicTraits: json('public_traits').$type<Trait[]>().default([]),  // Array of {label, description}
  secretTraits: json('secret_traits').$type<Trait[]>().default([]),  // Array of {label, description}
  desc: text('desc').notNull(),
  type: text('type'),
  stat: json('stat').$type<Character['stat']>(),  // Store stat as JSON
});

// Type guard for Character
export function isCharacter(char: unknown): char is Character {
  return (
    typeof char === 'object' &&
    char !== null &&
    typeof (char as Character).id === 'string' &&
    typeof (char as Character).name === 'string' &&
    typeof (char as Character).role === 'string' &&
    typeof (char as Character).desc === 'string' &&
    Array.isArray((char as Character).publicTraits) &&
    Array.isArray((char as Character).secretTraits) &&
    (char as Character).publicTraits.every(trait => 
      typeof trait?.label === 'string' && 
      typeof trait?.description === 'string'
    ) &&
    (char as Character).secretTraits.every(trait => 
      typeof trait?.label === 'string' && 
      typeof trait?.description === 'string'
    )
  );
}

// Type guard for CharacterDeck
export function isCharacterDeck(deck: unknown): deck is CharacterDeck {
  return (
    typeof deck === 'object' &&
    deck !== null &&
    typeof (deck as CharacterDeck).id === 'string' &&
    typeof (deck as CharacterDeck).name === 'string' &&
    typeof (deck as CharacterDeck).theme === 'string' &&
    Array.isArray((deck as CharacterDeck).characters)
  );
}
