import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Card, Deck, CardStat, ValidationError } from '$lib/types';
import { validateCard, validateDeck } from '$lib/types';
import { toasts } from './toast';

/**
 * IMPORTANT: Store Update Pattern
 * 
 * To prevent scroll jumps and unnecessary re-renders:
 * 1. Use a writable store (not derived) for currentDeck
 * 2. Update the store directly with set() when saving changes
 * 3. Never force a full reload by setting currentDeckId to null/back
 * 4. Let the keyed each-blocks in PagedCards handle partial updates
 * 
 * This pattern ensures that:
 * - Only changed cards are re-rendered
 * - Scroll position is maintained
 * - No unnecessary DB loads
 * 
 * Previous approaches that DIDN'T work:
 * - Using a derived store (caused full re-renders)
 * - Forcing reloads with currentDeckId (lost scroll position)
 * - Manual scroll position management (flickered)
 */

// Store for the current deck
export const currentDeck = writable<Deck | null>(null);

// Store for the current deck ID
const currentDeckId = writable<string | null>(null);

// IndexedDB setup
const DB_NAME = 'card-decks';
const DB_VERSION = 1;
const SAVE_DEBOUNCE = 1000;  // 1 second

class StorageError extends Error {
  constructor(message: string, public cause?: Error | DOMException) {
    super(message);
    this.name = 'StorageError';
  }
}

// Open database and set up subscriptions
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!browser) {
      reject(new Error('IndexedDB not available (server-side)'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;

      // Set up change listener
      db.onversionchange = () => {
        db.close();
        window.location.reload();
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('decks')) {
        db.createObjectStore('decks', { keyPath: 'id' });
      }
    };
  });
}

function handleDbError(request: IDBRequest): Error {
  return request.error || new Error('Unknown database error');
}

// Load deck from IndexedDB
export async function loadDeck(id: string): Promise<Deck | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readonly');
      const store = transaction.objectStore('decks');

      const request = store.get(id);

      request.onerror = () => {
        const error = handleDbError(request);
        reject(new StorageError('Failed to load deck', error));
      };
      request.onsuccess = () => {
        const deck = request.result as Deck;
        if (deck) {
          // validationErrors.set([]); // This line was removed from the new_code, so it's removed here.
        }
        resolve(deck);
      };
    });
  } catch (error) {
    throw new StorageError('Failed to load deck', error instanceof Error ? error : undefined);
  }
}

// Save deck to IndexedDB
export async function saveDeck(deck: Deck, allowEmpty = false) {
  if (!browser) return;

  // Validate deck
  const errors = validateDeck(deck, allowEmpty);
  if (errors.length > 0) {
    // validationErrors.set(errors); // This line was removed from the new_code, so it's removed here.
    return;
  }

  // Prepare deck for storage by ensuring all data is cloneable
  const storableDeck = {
    ...deck,
    cards: deck.cards.map(card => {
      // Keep the imageBlob for storage
      return {
        ...card,
        traits: [...card.traits],
        secrets: [...card.secrets]
      };
    })
  };

  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readwrite');
      const store = transaction.objectStore('decks');

      const request = store.put(storableDeck);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (err) {
    throw err;
  }
}

// List all decks
export async function listDecks(): Promise<Deck[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readonly');
      const store = transaction.objectStore('decks');

      const request = store.getAll();

      request.onerror = () => {
        const error = handleDbError(request);
        reject(new StorageError('Failed to list decks', error));
      };
      request.onsuccess = () => {
        const decks = request.result;
        resolve(decks);
      };
    });
  } catch (error) {
    throw new StorageError('Failed to list decks', error instanceof Error ? error : undefined);
  }
}

// Delete deck
export async function deleteDeck(id: string) {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readwrite');
      const store = transaction.objectStore('decks');

      const request = store.delete(id);

      request.onerror = () => {
        const error = handleDbError(request);
        reject(new StorageError('Failed to delete deck', error));
      };
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    throw new StorageError('Failed to delete deck', error instanceof Error ? error : undefined);
  }
}

// Function to update a card property
export async function updateCardProperty(
  deckId: string,
  cardId: string,
  property: keyof Card,
  value: any
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('decks', 'readwrite');
    const store = tx.objectStore('decks');

    // Get current deck
    const deck = await new Promise<Deck>((resolve, reject) => {
      const request = store.get(deckId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    if (!deck) throw new Error('Deck not found');

    // Update the card
    const cardIndex = deck.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found');

    const updatedCard = {
      ...deck.cards[cardIndex],
      [property]: value
    };

    deck.cards[cardIndex] = updatedCard;
    deck.meta.lastEdited = Date.now();

    // Save back to IndexedDB
    const saveRequest = store.put(deck);
    await new Promise((resolve, reject) => {
      saveRequest.onerror = () => reject(saveRequest.error);
      saveRequest.onsuccess = () => {
        resolve(undefined);
      }
    });

    // Update store immediately for optimistic UI
    currentDeck.set(deck);

  } catch (error) {
    toasts.error('Failed to update card: ' + (error instanceof Error ? error.message : String(error)));
    throw error;
  }
}

// Subscribe to currentDeckId changes
if (browser) {
  currentDeckId.subscribe(async id => {
    if (!id) {
      currentDeck.set(null);
      return;
    }

    try {
      const db = await openDB();
      const tx = db.transaction('decks', 'readonly');
      const store = tx.objectStore('decks');
      const request = store.get(id);

      request.onerror = () => {
        currentDeck.set(null);
      };

      request.onsuccess = () => {
        const deck = request.result;
        if (deck) {
          currentDeck.set(deck);
        } else {
          currentDeck.set(null);
        }
      };
    } catch (error) {
      currentDeck.set(null);
    }
  });

  // Subscribe to currentDeck changes
  currentDeck.subscribe(deck => {
  });
}

// Add new card to current deck
export function addCard() {
  const currentId = get(currentDeckId);
  if (!currentId) return;

  const deck = get(currentDeck);
  if (!deck) return;

  // Check URL size before adding
  const currentSize = new TextEncoder().encode(deckToUrl(deck)).length;
  if (currentSize > 30000) { // Leave some margin below Chrome's limit
    // validationErrors.set([{ 
    //   field: 'deck', 
    //   message: 'URL size limit approaching. Consider creating a new deck.' 
    // }]); // This line was removed from the new_code, so it's removed here.
    return;
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

  const newDeck = {
    ...deck,
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    },
    cards: [...deck.cards, newCard]
  };

  saveDeck(newDeck);
  currentDeck.set(newDeck); // Update in-memory store directly
  return newDeck;
}

// Remove cards from current deck
export async function deleteCards(deckId: string, cardIds: string[]) {
  const deck = await loadDeck(deckId);
  if (!deck) throw new StorageError('Deck not found');

  const updatedDeck = {
    ...deck,
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    },
    cards: deck.cards.filter(c => !cardIds.includes(c.id))
  };

  await saveDeck(updatedDeck);
  if (get(currentDeck)?.id === deckId) {
    currentDeck.set(updatedDeck); // Update in-memory store directly
  }
  return updatedDeck;
}

// URL serialization
export function deckToUrl(deck: Deck): string {
  const data = JSON.stringify(deck);
  return `${window.location.origin}?deck=${encodeURIComponent(data)}`;
}

export function deckFromUrl(url: URL): Deck | null {
  try {
    const data = url.searchParams.get('deck');
    if (!data) return null;
    
    const deck = JSON.parse(decodeURIComponent(data));
    
    // Validate the decoded deck
    const errors = validateDeck(deck);
    if (errors.length > 0) {
      // validationErrors.set(errors); // This line was removed from the new_code, so it's removed here.
      return null;
    }
    
    // validationErrors.set([]); // This line was removed from the new_code, so it's removed here.
    return deck;
  } catch (error) {
    // validationErrors.set([{ field: 'url', message: 'Invalid deck data in URL' }]); // This line was removed from the new_code, so it's removed here.
    return null;
  }
}

// Add deck switching functionality
export async function switchDeck(id: string) {
  // Load new deck and update lastEdited
  const deck = await loadDeck(id);
  if (deck) {
    const updatedDeck = {
      ...deck,
      meta: {
        ...deck.meta,
        lastEdited: Date.now()
      }
    };
    await saveDeck(updatedDeck);
    currentDeck.set(updatedDeck);
  }
}

// Duplicate an existing deck
export async function duplicateDeck(deck: Deck, newName?: string): Promise<Deck> {
  const newDeck: Deck = {
    id: crypto.randomUUID(),
    meta: {
      name: newName || `${deck.meta.name} (Copy)`,
      theme: deck.meta.theme,
      cardSize: deck.meta.cardSize,  // Copy the card size from original deck
      lastEdited: Date.now(),
      createdAt: Date.now()
    },
    cards: deck.cards.map(char => ({
      ...char,
      id: crypto.randomUUID()
    }))
  };

  await saveDeck(newDeck);
  return newDeck;
}

// Copy cards to a deck
export async function copyCardsTo(
  cards: Card[],
  targetDeckId: string | 'new',
  newDeckName?: string
): Promise<Deck> {
  // Create new deck if needed
  if (targetDeckId === 'new') {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      meta: {
        name: newDeckName || 'New Deck',
        theme: 'classic',  // Default to classic theme
        cardSize: 'poker',  // Default to poker size for new decks
        lastEdited: Date.now(),
        createdAt: Date.now()
      },
      cards: []
    };
    targetDeckId = newDeck.id;
    await saveDeck(newDeck);
  }

  // Load target deck
  const targetDeck = await loadDeck(targetDeckId);
  if (!targetDeck) throw new StorageError('Target deck not found');

  // Copy cards with new IDs, ensuring clean data
  const copiedCards = cards.map(card => {
    // Remove non-cloneable data and ensure arrays are plain arrays
    const { imageBlob, ...cardWithoutBlob } = card;
    return {
      ...cardWithoutBlob,
      id: crypto.randomUUID(),
      traits: [...cardWithoutBlob.traits],
      secrets: [...cardWithoutBlob.secrets]
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

  await saveDeck(updatedDeck);
  return updatedDeck;
} 

// Export function to set current deck
export function setCurrentDeck(id: string | null) {
  currentDeckId.set(id);
} 

// Development helper to clear database
export async function clearDatabase() {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readwrite');
      const store = transaction.objectStore('decks');
      const request = store.clear();

      request.onerror = () => {
        const error = handleDbError(request);
        reject(new StorageError('Failed to clear database', error));
      };
      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    throw new StorageError('Failed to clear database', error instanceof Error ? error : undefined);
  }
} 

// Sample data for development
const sampleCards: Card[] = [
  {
    id: crypto.randomUUID(),
    name: "Dr. Blackwood",
    role: "Enigmatic Professor",
    image: "blackwood.jpg",
    traits: ["Appearance: Wears a well-worn tweed jacket", "Personality: Obsessed with ancient mysteries"],
    secrets: ["Hidden: Knows too much about forbidden magic", "Plot: Recently acquired a cursed artifact"],
    desc: "A brilliant but eccentric academic whose research into occult artifacts has led him down dangerous paths.",
    type: "character"
  },
  {
    id: crypto.randomUUID(),
    name: "The Ethereal Compass",
    role: "Mystical Device",
    image: "classic.png",
    traits: ["Appearance: Brass and silver construction", "Property: Points to magical disturbances"],
    secrets: ["Hidden: Has a mind of its own", "Plot: Previous owner vanished mysteriously"],
    desc: "An ornate compass that responds to supernatural phenomena rather than magnetic north.",
    type: "item"
  },
  {
    id: crypto.randomUUID(),
    name: "The Misty Vale",
    role: "Mysterious Location",
    image: "scriptorum_cropped.png",
    traits: ["Appearance: Perpetually shrouded in fog", "Property: Time flows strangely here"],
    secrets: ["Hidden: Contains a gateway to elsewhere", "Plot: Local children have been disappearing"],
    desc: "A secluded valley where reality seems to bend and shift, defying the laws of nature.",
    type: "location"
  }
];

// Development helper to populate database with sample data
export async function populateWithSampleData() {
  try {
    const sampleDeck: Deck = {
      id: crypto.randomUUID(),
      meta: {
        name: "Tales of the Uncanny",
        theme: "classic",
        cardSize: "poker",
        lastEdited: Date.now(),
        createdAt: Date.now()
      },
      cards: sampleCards
    };

    await saveDeck(sampleDeck);
    return sampleDeck;
  } catch (error) {
    throw new StorageError('Failed to populate database', error instanceof Error ? error : undefined);
  }
} 

// Remove backward compatibility exports - no longer needed 