import type { InferSelectModel } from 'drizzle-orm';
import { pgTable, text, timestamp, integer, json } from 'drizzle-orm/pg-core';
import type { Card, Deck, CardStat } from '$lib/types';

export const decks = pgTable('decks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  theme: text('theme').notNull(),
  cardSize: text('card_size').notNull().default('poker'),
  lastEdited: timestamp('last_edited').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1),
});

export const cards = pgTable('cards', {
  id: text('id').primaryKey(),
  deckId: text('deck_id').notNull().references(() => decks.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  image: text('image'),
  type: text('type').notNull().default('character'),
  traits: json('traits').$type<string[]>().default([]),
  secrets: json('secrets').$type<string[]>().default([]),
  desc: text('desc').notNull(),
  stat: json('stat').$type<CardStat>(),
});

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
