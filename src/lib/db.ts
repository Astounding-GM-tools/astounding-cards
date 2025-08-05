// src/lib/db.ts
import { browser } from '$app/environment';
import type { Card, Deck } from '$lib/types';
import { validateDeck } from '$lib/types';

// IndexedDB setup
const DB_NAME = 'card-decks';
const DB_VERSION = 1;

export class StorageError extends Error {
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
export async function getDeck(id: string): Promise<Deck | null> {
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
        resolve(deck);
      };
    });
  } catch (error) {
    throw new StorageError('Failed to load deck', error instanceof Error ? error : undefined);
  }
}

// Save deck to IndexedDB
export async function putDeck(deck: Deck, allowEmpty = false): Promise<void> {
  if (!browser) return;

  // Validate deck
  const errors = validateDeck(deck, allowEmpty);
  if (errors.length > 0) {
    // We should let the caller handle UI feedback
    throw new StorageError('Validation failed: ' + errors.map(e => e.message).join(', '));
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

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    throw err;
  }
}

// List all decks
export async function getAllDecks(): Promise<Deck[]> {
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
export async function deleteDeck(id: string): Promise<void> {
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


// Development helper to clear database
export async function clearDatabase(): Promise<void> {
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
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    throw new StorageError('Failed to clear database', error instanceof Error ? error : undefined);
  }
}

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

    await putDeck(sampleDeck);
    return sampleDeck;
  } catch (error) {
    throw new StorageError('Failed to populate database', error instanceof Error ? error : undefined);
  }
}
