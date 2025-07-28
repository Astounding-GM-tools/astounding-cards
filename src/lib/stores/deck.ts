import { writable, get, derived } from 'svelte/store';
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

// Internal store for the current deck ID
const currentDeckId = writable<string | null>(null);

// Store for validation errors
export const validationErrors = writable<ValidationError[]>([]);

// Store for the current deck
export const currentDeck = writable<Deck | null>(null);

// Subscribe to currentDeckId changes to load deck from DB
if (browser) {
  currentDeckId.subscribe(async id => {
    if (!id) {
      currentDeck.set(null);
      return;
    }

    try {
      const deck = await loadDeck(id);
      if (deck) {
        currentDeck.set(deck);
      } else {
        currentDeck.set(null);
      }
    } catch (error) {
      console.error('Failed to load deck:', error);
      currentDeck.set(null);
    }
  });
}

// Store for tracking scroll position
const scrollPosition = writable(0);

// Store for tracking changes that need saving
const isDirty = writable(false);

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

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!browser) {
      reject(new StorageError('IndexedDB not available (server-side)'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const error = request.error || new Error('Unknown database error');
      reject(new StorageError('Failed to open database', error));
    };
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('decks')) {
        console.log('Creating decks store');
        db.createObjectStore('decks', { keyPath: 'id' });
      }
    };
  });
}

function handleDbError(request: IDBRequest): Error {
  return request.error || new Error('Unknown database error');
}

// Save deck to IndexedDB
export async function saveDeck(deck: Deck) {
  if (!browser) return;

  // Validate deck
  const errors = validateDeck(deck);
  if (errors.length > 0) {
    validationErrors.set(errors);
    return;
  }

  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readwrite');
      const store = transaction.objectStore('decks');

      console.log('Saving deck to IndexedDB:', deck);
      const request = store.put(deck);

      request.onerror = () => {
        console.error('Failed to save deck:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Successfully saved deck:', deck.id);
        resolve();
      };

      transaction.oncomplete = () => {
        console.log('Transaction completed for deck:', deck.id);
      };

      transaction.onerror = () => {
        console.error('Transaction failed:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.error('Failed to save deck:', err);
    throw err;
  }
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
          validationErrors.set([]);
        }
        resolve(deck);
      };
    });
  } catch (error) {
    throw new StorageError('Failed to load deck', error instanceof Error ? error : undefined);
  }
}

// List all decks
export async function listDecks(): Promise<Deck[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readonly');
      const store = transaction.objectStore('decks');

      console.log('Listing all decks...');
      const request = store.getAll();

      request.onerror = () => {
        const error = handleDbError(request);
        reject(new StorageError('Failed to list decks', error));
      };
      request.onsuccess = () => {
        console.log('Found decks:', request.result.length);
        resolve(request.result);
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

// Update a character in the current deck
export async function updateCard(id: string, updates: Partial<Card>) {
  const deck = get(currentDeck);
  if (!deck) {
    console.error('No current deck');
    return;
  }

  // Find character index
  const charIndex = deck.cards.findIndex(c => c.id === id);
  if (charIndex === -1) {
    console.error('Card not found:', id);
    return;
  }

  // Create updated card
  const updatedCard = {
    ...deck.cards[charIndex],
    ...updates,
    // Handle blob updates correctly:
    // 1. If we're explicitly setting a new blob, use it
    // 2. If we're not changing the image, keep the existing blob and image
    // 3. If we're changing to a URL/local image, clear the blob
    imageBlob: 'imageBlob' in updates 
      ? updates.imageBlob
      : updates.image === deck.cards[charIndex].image
        ? deck.cards[charIndex].imageBlob
        : undefined,
    image: updates.image ?? deck.cards[charIndex].image  // Keep existing image if not updating
  };

  // Ensure we have a plain object for IndexedDB
  const newDeck = {
    ...deck,
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    },
    cards: deck.cards.map((c, i) => {
      if (i !== charIndex) return c;

      // Convert stat to plain object based on type
      let stat: CardStat | undefined = undefined;
      if (updatedCard.stat) {
        if (updatedCard.stat.type === 'character') {
          stat = { type: 'character', value: String(updatedCard.stat.value) };
        } else if (updatedCard.stat.type === 'item') {
          stat = { type: 'item', value: updatedCard.stat.value };
        } else if (updatedCard.stat.type === 'location') {
          stat = { 
            type: 'location', 
            value: { 
              type: updatedCard.stat.value.type, 
              value: updatedCard.stat.value.value 
            } 
          };
        }
      }

      return { ...updatedCard, stat };
    })
  };

  // Validate the updated card
  const errors = validateCard(updatedCard);
  if (errors.length > 0) {
    validationErrors.set(errors);
    return;
  }

  try {
    await saveDeck(newDeck);
    currentDeck.set(newDeck);
    toasts.success('Updated card');
  } catch (err) {
    console.error('Failed to save card update:', err);
    toasts.error('Failed to save card update: ' + (err instanceof Error ? err.message : String(err)));
  }
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
    validationErrors.set([{ 
      field: 'deck', 
      message: 'URL size limit approaching. Consider creating a new deck.' 
    }]);
    return;
  }

  const newCard: Card = {
    id: crypto.randomUUID(),
    name: "New Card",
    role: "Role",
    image: null,
    traits: ["Notable: Add a distinctive feature", "Property: Add a key characteristic"],
    secrets: ["Hidden: Add a concealed aspect", "Plot: Add a story element"],
    desc: "Add a description",
    type: "character"
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
      validationErrors.set(errors);
      return null;
    }
    
    validationErrors.set([]);
    return deck;
  } catch (error) {
    validationErrors.set([{ field: 'url', message: 'Invalid deck data in URL' }]);
    return null;
  }
}

// Add deck switching functionality
export async function switchDeck(id: string) {
  // Save current deck if dirty
  const currentDirty = get(isDirty);
  if (currentDirty) {
    const current = get(currentDeck);
    if (current) await saveDeck(current);
  }
  
  // Load new deck
  await loadDeck(id);
}

// Auto-save when dirty
if (browser) {
  let saveTimeout: ReturnType<typeof setTimeout>;
  let currentSaveSubscription: (() => void) | null = null;
  
  isDirty.subscribe(dirty => {
    if (dirty) {
      // Clear any existing timeout and subscription
      clearTimeout(saveTimeout);
      if (currentSaveSubscription) {
        currentSaveSubscription();
        currentSaveSubscription = null;
      }

      // Set new timeout for auto-save
      saveTimeout = setTimeout(() => {
        currentSaveSubscription = currentDeck.subscribe(deck => {
          if (deck) {
            saveDeck(deck).catch(error => {
              console.error('Auto-save failed:', error);
              // Only set validation errors if it's not a storage error
              if (!(error instanceof StorageError)) {
                validationErrors.set([{ field: 'save', message: 'Failed to save changes' }]);
              }
            });
          }
          // Clean up subscription after save attempt
          if (currentSaveSubscription) {
            currentSaveSubscription();
            currentSaveSubscription = null;
          }
        });
      }, SAVE_DEBOUNCE);
    }
  });
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

  // Copy characters with new IDs
  const copiedChars = cards.map(char => ({
    ...char,
    id: crypto.randomUUID()
  }));

  // Add to target deck
  const updatedDeck = {
    ...targetDeck,
    meta: {
      ...targetDeck.meta,
      lastEdited: Date.now()
    },
    cards: [...targetDeck.cards, ...copiedChars]
  };

  await saveDeck(updatedDeck);
  return updatedDeck;
} 

// Set current deck
export function setCurrentDeck(deck: Deck | null) {
  currentDeckId.set(deck?.id || null);
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
        console.log('Database cleared successfully');
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
    console.log('Database populated with sample data');
    return sampleDeck;
  } catch (error) {
    throw new StorageError('Failed to populate database', error instanceof Error ? error : undefined);
  }
} 

// Remove backward compatibility exports - no longer needed 