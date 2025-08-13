/**
 * Integration test for DeckList
 */

import { describe, it, expect } from 'vitest';
import {
  sortDecksByLastEdited,
  createDeckChangeHandler
} from './DeckList.svelte.ts';

describe('DeckList Component Integration', () => {
  it('should import all extracted logic functions', () => {
    expect(typeof sortDecksByLastEdited).toBe('function');
    expect(typeof createDeckChangeHandler).toBe('function');
  });

  it('should sort decks by last edited correctly', () => {
    const decks = [
      { id: 'old', meta: { lastEdited: 1000 } },
      { id: 'newest', meta: { lastEdited: 3000 } },
      { id: 'middle', meta: { lastEdited: 2000 } }
    ] as any[];
    
    const sorted = sortDecksByLastEdited(decks);
    
    expect(sorted[0].id).toBe('newest'); // 3000
    expect(sorted[1].id).toBe('middle'); // 2000
    expect(sorted[2].id).toBe('old');    // 1000
  });

  it('should not mutate original array', () => {
    const decks = [
      { id: 'a', meta: { lastEdited: 1000 } },
      { id: 'b', meta: { lastEdited: 2000 } }
    ] as any[];
    
    const sorted = sortDecksByLastEdited(decks);
    
    expect(sorted).not.toBe(decks);
    expect(decks[0].id).toBe('a'); // Original unchanged
  });
});
