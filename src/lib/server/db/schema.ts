import type { InferSelectModel } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';

export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  age: text('age').notNull(),
  portrait: text('portrait'),
  traits: text('traits').array().notNull(),
  bio: text('bio').notNull(),
});

export const decks = pgTable('decks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  theme: text('theme').notNull(),
});

// Types
export type Character = InferSelectModel<typeof characters>;
export type Deck = InferSelectModel<typeof decks>;

// For mock data structure
export type CharacterDeck = {
  meta: {
    name: string;
    theme: string;
  };
  characters: Character[];
};
