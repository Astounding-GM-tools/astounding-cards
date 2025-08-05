
import { writable } from 'svelte/store';
import type { Deck } from '$lib/types';
import { getAllDecks } from '$lib/db';

type DeckListState = {
  loading: boolean;
  error: string | null;
  decks: Deck[];
};

const createDeckListStore = () => {
  const { subscribe, set, update } = writable<DeckListState>({
    loading: true,
    error: null,
    decks: []
  });

  const load = async () => {
    update(s => ({...s, loading: true, error: null}));
    try {
      const decks = await getAllDecks();
      set({loading: false, error: null, decks});
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to load decks';
      set({loading: false, error, decks: []});
    }
  };

  return {
    subscribe,
    load,
  };
};

export const deckList = createDeckListStore();

