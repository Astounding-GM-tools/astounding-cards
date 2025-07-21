import type { InferSelectModel } from 'drizzle-orm';
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import type { Character, CharacterDeck } from '$lib/types';

export const decks = pgTable('decks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  theme: text('theme').notNull(),
  cardSize: text('card_size').notNull().default('poker'),
  lastEdited: timestamp('last_edited').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1), // For conflict resolution
});

export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  deckId: text('deck_id').notNull().references(() => decks.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  age: text('age').notNull(),
  portrait: text('portrait'),
  traits: text('traits').array().notNull(),
  desc: text('desc').notNull(),  // renamed from bio
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1), // For conflict resolution
});

// Types
export type DbCharacter = InferSelectModel<typeof characters>;
export type DbDeck = InferSelectModel<typeof decks>;

// Type guards for runtime validation
export function isCharacter(obj: unknown): obj is Character {
  const char = obj as Character;
  return (
    typeof char?.id === 'string' &&
    typeof char?.name === 'string' &&
    typeof char?.role === 'string' &&
    typeof char?.age === 'string' &&
    (char?.portrait === null || typeof char?.portrait === 'string') &&
    Array.isArray(char?.traits) &&
    typeof char?.desc === 'string'
  );
}

export function isCharacterDeck(obj: unknown): obj is CharacterDeck {
  const deck = obj as CharacterDeck;
  return (
    typeof deck?.id === 'string' &&
    typeof deck?.meta?.name === 'string' &&
    typeof deck?.meta?.theme === 'string' &&
    ['poker', 'tarot'].includes(deck?.meta?.cardSize) &&
    Array.isArray(deck?.characters) &&
    deck.characters.every(isCharacter)
  );
}
