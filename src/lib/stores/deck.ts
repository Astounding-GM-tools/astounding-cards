// src/lib/stores/deck.ts
import { writable, get } from 'svelte/store';
import type { Card, Deck } from '$lib/types';
import { validateDeck } from '$lib/types';
import { putDeck, getDeck, deleteDeck as dbDeleteDeck } from '$lib/db';
import { toasts } from './toast';
import { browser } from '$app/environment';

export const currentDeck = writable<Deck | null>(null);

// NOTE: The logic to load a deck when this ID changes has been removed.
// You should implement this in your component using an $effect, for example:
//
// import { currentDeckId, currentDeck } from '$lib/stores/deck';
// import { getDeck } from '$lib/db';
//
// $effect(() => {
//   const id = $currentDeckId;
//   if (id) {
//     getDeck(id).then(deck => {
//       currentDeck.set(deck);
//     }).catch(err => toasts.error(err.message));
//   } else {
//     currentDeck.set(null);
//   }
// });
export const currentDeckId = writable<string | null>(null);

export async function saveCurrentDeck() {
    const deck = get(currentDeck);
    if (deck) {
        try {
            await putDeck(deck);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            toasts.error(`Failed to save deck: ${error}`);
        }
    }
}

// Add new card to current deck
export async function addCard() {
  const deck = get(currentDeck);
  if (!deck) return;

  if (browser) {
    const currentSize = new TextEncoder().encode(deckToUrl(deck)).length;
    if (currentSize > 30000) {
      toasts.error('URL size limit approaching. Consider creating a new deck.');
      return;
    }
  }

  const newCard: Card = {
    id: crypto.randomUUID(),
    name: "New Card",
    role: "Role",
    image: null,
    imageBlob: undefined,
    traits: ["Notable: Add a distinctive feature", "Property: Add a key characteristic"],
    secrets: ["Hidden: Add a concealed aspect", "Plot: Add a story element"],
    desc: "Add a description",
    type: "character",
    stat: { type: "character", value: "" }
  };

  const newDeck: Deck = {
    ...deck,
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    },
    cards: [...deck.cards, newCard]
  };

  currentDeck.set(newDeck);
  try {
    await putDeck(newDeck);
  } catch(e) {
      const error = e instanceof Error ? e.message : String(e);
      toasts.error(`Failed to save new card: ${error}`);
  };
}

// Remove cards from current deck
export async function deleteCards(cardIds: string[]) {
    const deck = get(currentDeck);
    if (!deck) return;

    const updatedDeck = {
        ...deck,
        meta: {
            ...deck.meta,
            lastEdited: Date.now()
        },
        cards: deck.cards.filter(c => !cardIds.includes(c.id))
    };

    currentDeck.set(updatedDeck);
    await putDeck(updatedDeck);
}

export async function deleteDeck(deckId: string) {
    const current = get(currentDeck);
    if (current?.id === deckId) {
        currentDeckId.set(null);
    }
    await dbDeleteDeck(deckId);
}

// URL serialization
export function deckToUrl(deck: Deck): string {
    if(!browser) return "";
    const data = JSON.stringify(deck);
    return `${window.location.origin}?deck=${encodeURIComponent(data)}`;
}

export function deckFromUrl(url: URL): Deck | null {
  try {
    const data = url.searchParams.get('deck');
    if (!data) return null;
    
    const deck = JSON.parse(decodeURIComponent(data));
    
    const errors = validateDeck(deck);
    if (errors.length > 0) {
      toasts.error(`Invalid deck data in URL: ${errors.map(e => e.message).join(', ')}`);
      return null;
    }
    
    return deck;
  } catch (error) {
    toasts.error('Invalid deck data in URL');
    return null;
  }
}

export function setCurrentDeckId(id: string | null) {
  currentDeckId.set(id);
}

// Duplicate an existing deck
export async function duplicateDeck(deck: Deck, newName?: string): Promise<Deck> {
  const newDeck: Deck = {
    id: crypto.randomUUID(),
    meta: {
      name: newName || `${deck.meta.name} (Copy)`,
      theme: deck.meta.theme,
      cardSize: deck.meta.cardSize,
      lastEdited: Date.now(),
      createdAt: Date.now()
    },
    cards: deck.cards.map(char => ({
      ...char,
      id: crypto.randomUUID()
    }))
  };

  await putDeck(newDeck, true); // Allow empty decks when duplicating
  return newDeck;
}

// Copy cards to a deck
export async function copyCardsTo(
  cards: Card[],
  targetDeckId: string | 'new',
  newDeckName?: string
): Promise<Deck> {
  let finalTargetDeckId = targetDeckId;
  // Create new deck if needed
  if (targetDeckId === 'new') {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      meta: {
        name: newDeckName || 'New Deck',
        theme: 'classic',
        cardSize: 'poker',
        lastEdited: Date.now(),
        createdAt: Date.now()
      },
      cards: []
    };
    finalTargetDeckId = newDeck.id;
    await putDeck(newDeck, true);
  }

  // Load target deck
  const targetDeck = await getDeck(finalTargetDeckId);
  if (!targetDeck) throw new Error('Target deck not found');

  // Copy cards with new IDs
  const copiedCards = cards.map(card => {
    const { imageBlob, ...cardWithoutBlob } = card;
    return {
      ...cardWithoutBlob,
      id: crypto.randomUUID(),
      traits: [...card.traits],
      secrets: [...card.secrets]
    };
  });

  // Add to target deck
  const updatedDeck = {
    ...targetDeck,
    meta: {
      ...targetDeck.meta,
      lastEdited: Date.now()
    },
    cards: [...targetDeck.cards, ...copiedCards]
  };

  await putDeck(updatedDeck);
  return updatedDeck;
}
