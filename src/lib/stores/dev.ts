import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize from localStorage if available
const storedDevMode = browser ? localStorage.getItem('devMode') === 'true' : false;
export const devMode = writable<boolean>(storedDevMode);

// Persist changes to localStorage
if (browser) {
  devMode.subscribe(value => {
    localStorage.setItem('devMode', value.toString());
  });
}

// Utility function to toggle dev mode from console
export function toggleDevMode() {
  devMode.update(v => !v);
  return `Dev mode ${!storedDevMode ? 'enabled' : 'disabled'}`;
}

// Console shortcuts for E2E testing (localhost only)
if (browser && window.location.hostname.includes('localhost')) {
  // Basic dev mode toggle
  (window as any).toggleDevMode = toggleDevMode;
  
  // E2E test helpers
  (window as any).e2eHelpers = {
    enableDevMode: () => {
      devMode.set(true);
      return 'Dev mode enabled';
    },
    
    disableDevMode: () => {
      devMode.set(false);
      return 'Dev mode disabled';
    },
    
    async clearDatabase() {
      const { clearDatabase } = await import('../db');
      await clearDatabase();
      return 'Database cleared';
    },
    
    async addSampleData() {
      const { populateWithSampleData } = await import('../db');
      const deck = await populateWithSampleData();
      return `Sample data added: ${deck.meta.name}`;
    },
    
    async setupTestEnvironment() {
      devMode.set(true);
      const { clearDatabase, populateWithSampleData } = await import('../db');
      await clearDatabase();
      const deck = await populateWithSampleData();
      
      // Trigger navigation to refresh UI without reload
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('_refresh', Date.now().toString());
        window.location.href = url.toString();
      }, 100);
      
      return `Test environment ready with ${deck.meta.name} (${deck.cards.length} cards)`;
    },
    
    getSampleInfo() {
      return {
        deckName: "Tales of the Uncanny",
        cardCount: 3,
        cards: [
          { name: "Dr. Blackwood", role: "Enigmatic Professor", type: "character" },
          { name: "The Ethereal Compass", role: "Mystical Device", type: "item" },
          { name: "The Misty Vale", role: "Mysterious Location", type: "location" }
        ]
      };
    }
  };
  
  console.log('E2E helpers available: window.e2eHelpers');
  console.log('Available methods:', Object.keys((window as any).e2eHelpers));
}
