import { writable, get, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Character, CharacterDeck, ValidationError } from '$lib/types';
import { validateCharacter, validateDeck } from '$lib/types';
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
export const currentDeck = writable<CharacterDeck | null>(null);

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
        // Update currentDeck directly
        const currentId = get(currentDeckId);
        if (currentId === deck.id) {
          currentDeck.set(deckToSave);
        }
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
export async function updateCharacter(id: string, updates: Partial<Character>) {
  // Store current scroll position
  if (browser) {
    const container = document.querySelector('.cards-scroll-container');
    if (container) {
      scrollPosition.set(container.scrollTop);
    }
  }

  const currentId = get(currentDeckId);
  if (!currentId) return;

  const deck = get(currentDeck);
  if (!deck) return;

  const charIndex = deck.characters.findIndex(c => c.id === id);
  if (charIndex === -1) return;

  // Create updated character
  const updatedChar = {
    ...deck.characters[charIndex],
    ...updates
  };

  // Validate the updated character
  const errors = validateCharacter(updatedChar);
  if (errors.length > 0) {
    validationErrors.set(errors);
    toasts.error('Failed to update character: ' + errors.map(e => e.message).join(', '));
    return;
  }

  // Create new deck with the update
  const newDeck = {
    ...deck,
    meta: {
      ...deck.meta,
      lastEdited: Date.now()
    },
    characters: [...deck.characters]
  };
  newDeck.characters[charIndex] = updatedChar;

  try {
    // Save to DB and update store
    await saveDeck(newDeck);
    
    // Show success toast
    const fieldName = Object.keys(updates)[0];
    toasts.success(`Updated ${fieldName} for ${updatedChar.name}`);

    // Restore scroll position after a short delay
    if (browser) {
      setTimeout(() => {
        const container = document.querySelector('.cards-scroll-container');
        const savedPosition = get(scrollPosition);
        if (container && savedPosition) {
          container.scrollTop = savedPosition;
        }
      }, 0);
    }
  } catch (error) {
    console.error('Failed to save character update:', error);
    toasts.error('Failed to save changes. Please try again.');
  }
}

// Add new character to current deck
export function addCharacter() {
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

  const newChar: Character = {
    id: crypto.randomUUID(),
    name: "New Character",
    role: "Role",
    portrait: null,
    traits: ["Appearance: Add a notable physical trait", "Personality: Add a defining characteristic"],
    secrets: ["Hidden: A secret or hidden trait", "Plot: A plot hook or story element"],
    desc: "Character description..."
  };

  // Validate the new character
  const errors = validateCharacter(newChar);
  if (errors.length > 0) {
    validationErrors.set(errors);
    return;
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
    currentDeckId.set(null); // Force reload
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
      cardSize: deck.meta.cardSize,  // Copy the card size from original deck
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
        cardSize: 'poker',  // Default to poker size for new decks
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

// Set current deck
export function setCurrentDeck(deck: CharacterDeck | null) {
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
const sampleCharacters: Character[] = [
  {
    id: crypto.randomUUID(),
    name: "Gristlethwaite",
    role: "Eccentric Inventor",
    portrait: "gristlethwaite.jpg",
    traits: [
      "Appearance: Wild gray hair and oil-stained hands",
      "Workshop: Cluttered with brass contraptions",
      "Personality: Talks to machines more than people"
    ],
    secrets: [
      "Hidden: Actually a time traveler from 1876",
      "Project: Building a device to contact parallel worlds",
      "Fear: Terrified his inventions will be used for war"
    ],
    desc: "A brilliant but peculiar inventor who lives in a converted windmill filled with strange devices.",
    type: "character",
    stat: { type: "character", value: "63" }
  },
  {
    id: crypto.randomUUID(),
    name: "Lady Ravencroft",
    role: "Mysterious Aristocrat",
    portrait: null,
    traits: [
      "Appearance: Always wears dark Victorian dresses",
      "Manor: Ancient family estate on the hill",
      "Influence: Has connections in high society"
    ],
    secrets: [
      "Identity: Last of an ancient vampire lineage",
      "Mission: Protecting the town from supernatural threats",
      "Weakness: Cannot enter a home uninvited"
    ],
    desc: "A noble woman who holds frequent evening gatherings at her estate. Few guests notice they never see her during daylight hours.",
    type: "character",
    stat: { type: "character", value: "247" }
  },
  {
    id: crypto.randomUUID(),
    name: "The Brass Compass",
    role: "Mystical Artifact",
    portrait: null,
    traits: [
      "Appearance: Intricate brass device with shifting parts",
      "Function: Points to what the holder truly seeks",
      "History: Found in an Egyptian tomb"
    ],
    secrets: [
      "Power: Can reveal hidden doorways",
      "Curse: Slowly drives its owner to obsession",
      "Truth: Actually a trapped spirit seeking freedom"
    ],
    desc: "An ornate brass compass that seems to have a mind of its own. Its needle moves erratically when near sources of magic.",
    type: "item",
    stat: { type: "item", value: "negligible" }
  },
  {
    id: crypto.randomUUID(),
    name: "The Whispering Library",
    role: "Haunted Location",
    portrait: null,
    traits: [
      "Atmosphere: Dust motes dance in shifting shadows",
      "Books: Ancient tomes line endless shelves",
      "Sound: Pages rustle when no one is near"
    ],
    secrets: [
      "Portal: Contains a gateway to the realm of stories",
      "Guardian: Protected by an immortal librarian",
      "Collection: Some books write themselves at night"
    ],
    desc: "A vast library where the books seem to rearrange themselves. Visitors report hearing whispered conversations from empty aisles.",
    type: "location",
    stat: { type: "location", value: { type: "soft", value: "University District" } }
  },
  {
    id: crypto.randomUUID(),
    name: "Dr. Ambrose Chen",
    role: "Occult Scholar",
    portrait: null,
    traits: [
      "Appearance: Wears a tweed jacket with strange symbols embroidered",
      "Office: Walls covered in star charts and diagrams",
      "Knowledge: Expert in forbidden mathematics"
    ],
    secrets: [
      "Research: Close to proving magic is advanced geometry",
      "Students: Running a secret study group in applied sorcery",
      "Past: Lost three years in a time loop accident"
    ],
    desc: "A brilliant mathematician who discovered patterns in reality that shouldn't exist. His lectures often venture into strange territories.",
    type: "character",
    stat: { type: "character", value: "42" }
  }
];

// Development helper to populate database with sample data
export async function populateWithSampleData() {
  try {
    const sampleDeck: CharacterDeck = {
      id: crypto.randomUUID(),
      meta: {
        name: "Tales of the Uncanny",
        theme: "default",
        cardSize: "poker",
        lastEdited: Date.now(),
        createdAt: Date.now()
      },
      characters: sampleCharacters
    };

    await saveDeck(sampleDeck, true);
    console.log('Database populated with sample data');
    return sampleDeck;
  } catch (error) {
    throw new StorageError('Failed to populate database', error instanceof Error ? error : undefined);
  }
} 