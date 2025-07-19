import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Character, CharacterDeck, ValidationError } from '$lib/types';
import { validateCharacter, validateDeck } from '$lib/types';

// Store for the current deck
export const currentDeck = writable<CharacterDeck | null>(null);

// Store for tracking changes that need saving
const isDirty = writable(false);

// Store for validation errors
export const validationErrors = writable<ValidationError[]>([]);

// IndexedDB setup
const DB_NAME = 'character-cards';
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
        db.createObjectStore('decks', { keyPath: 'id' });
      }
    };
  });
}

function handleDbError(request: IDBRequest): Error {
  return request.error || new Error('Unknown database error');
}

// Save deck to IndexedDB
export async function saveDeck(deck: CharacterDeck, allowEmpty = false) {
  // Validate before saving
  const errors = validateDeck(deck, allowEmpty);
  if (errors.length > 0) {
    validationErrors.set(errors);
    throw new StorageError('Validation failed');
  }

  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['decks'], 'readwrite');
      const store = transaction.objectStore('decks');

      // Update deck metadata
      const deckToSave = {
        ...deck,
        id: deck.id || crypto.randomUUID(),
        meta: {
          ...deck.meta,
          lastEdited: Date.now(),
          createdAt: deck.meta.createdAt || Date.now()
        }
      };

      const request = store.put(deckToSave);

      request.onerror = () => {
        const error = handleDbError(request);
        reject(new StorageError('Failed to save deck', error));
      };
      request.onsuccess = () => {
        isDirty.set(false);
        validationErrors.set([]);
        resolve();
      };
    });
  } catch (error) {
    throw new StorageError('Failed to save deck', error instanceof Error ? error : undefined);
  }
}

// Load deck from IndexedDB
export async function loadDeck(id: string): Promise<CharacterDeck | null> {
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
        const deck = request.result as CharacterDeck;
        if (deck) {
          currentDeck.set(deck);
          isDirty.set(false);
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
export async function listDecks(): Promise<CharacterDeck[]> {
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
      request.onsuccess = () => resolve(request.result);
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

// Update character in current deck
export function updateCharacter(id: string, updates: Partial<Character>) {
  currentDeck.update(deck => {
    if (!deck) return null;

    const charIndex = deck.characters.findIndex(c => c.id === id);
    if (charIndex === -1) return deck;

    // Create updated character
    const updatedChar = {
      ...deck.characters[charIndex],
      ...updates
    };

    // Validate the updated character
    const errors = validateCharacter(updatedChar);
    if (errors.length > 0) {
      validationErrors.set(errors);
      return deck;  // Return unchanged if validation fails
    }

    // Apply the update if validation passes
    const newDeck = {
      ...deck,
      characters: [...deck.characters]
    };
    newDeck.characters[charIndex] = updatedChar;

    isDirty.set(true);
    validationErrors.set([]);
    return newDeck;
  });
}

// Add new character to current deck
export function addCharacter() {
  currentDeck.update(deck => {
    if (!deck) return deck;

    // Check URL size before adding
    const currentSize = new TextEncoder().encode(deckToUrl(deck)).length;
    if (currentSize > 30000) { // Leave some margin below Chrome's limit
      validationErrors.set([{ 
        field: 'deck', 
        message: 'URL size limit approaching. Consider creating a new deck.' 
      }]);
      return deck;
    }

    const newChar: Character = {
      id: crypto.randomUUID(),
      name: "New Character",
      role: "Role",
      age: "30",
      portrait: null,
      traits: ["New trait"],
      bio: "Character background..."
    };

    // Validate the new character
    const errors = validateCharacter(newChar);
    if (errors.length > 0) {
      validationErrors.set(errors);
      return deck;
    }

    const newDeck = {
      ...deck,
      meta: {
        ...deck.meta,
        lastEdited: Date.now()
      },
      characters: [...deck.characters, newChar]
    };

    isDirty.set(true);
    validationErrors.set([]);
    return newDeck;
  });
}

// Remove character from current deck
export async function deleteCharacters(deckId: string, characterIds: string[]) {
  const deck = await loadDeck(deckId);
  if (!deck) throw new StorageError('Deck not found');

  const updatedDeck = {
    ...deck,
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    },
    characters: deck.characters.filter(c => !characterIds.includes(c.id))
  };

  await saveDeck(updatedDeck);
  if (get(currentDeck)?.id === deckId) {
    currentDeck.set(updatedDeck);
  }
  return updatedDeck;
}

// URL serialization
export function deckToUrl(deck: CharacterDeck): string {
  const data = JSON.stringify(deck);
  return `${window.location.origin}?deck=${encodeURIComponent(data)}`;
}

export function deckFromUrl(url: URL): CharacterDeck | null {
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
export async function duplicateDeck(deck: CharacterDeck, newName?: string): Promise<CharacterDeck> {
  const newDeck: CharacterDeck = {
    id: crypto.randomUUID(),
    meta: {
      name: newName || `${deck.meta.name} (Copy)`,
      theme: deck.meta.theme,
      lastEdited: Date.now(),
      createdAt: Date.now()
    },
    characters: deck.characters.map(char => ({
      ...char,
      id: crypto.randomUUID()
    }))
  };

  await saveDeck(newDeck, true);
  return newDeck;
}

// Copy characters to a deck
export async function copyCharactersTo(
  characters: Character[],
  targetDeckId: string | 'new',
  newDeckName?: string
): Promise<CharacterDeck> {
  // Create new deck if needed
  if (targetDeckId === 'new') {
    const newDeck: CharacterDeck = {
      id: crypto.randomUUID(),
      meta: {
        name: newDeckName || 'New Deck',
        theme: 'default',
        lastEdited: Date.now(),
        createdAt: Date.now()
      },
      characters: []
    };
    targetDeckId = newDeck.id;
    await saveDeck(newDeck, true);
  }

  // Load target deck
  const targetDeck = await loadDeck(targetDeckId);
  if (!targetDeck) throw new StorageError('Target deck not found');

  // Copy characters with new IDs
  const copiedChars = characters.map(char => ({
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
    characters: [...targetDeck.characters, ...copiedChars]
  };

  await saveDeck(updatedDeck);
  return updatedDeck;
} 