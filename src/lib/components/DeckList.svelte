<script lang="ts">
  import { onMount } from 'svelte';
  import { listDecks } from '$lib/stores/cards';
  import type { CharacterDeck } from '$lib/types';
  import DeckManager from './DeckManager.svelte';

  let decks: CharacterDeck[] = [];
  let loading = true;
  let error: string | null = null;

  async function loadDecks() {
    try {
      decks = await listDecks();
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load decks';
      loading = false;
    }
  }

  onMount(loadDecks);

  async function handleDeckChange(event: CustomEvent<{ action: string, deckId: string }>) {
    if (event.detail.action === 'delete') {
      // Remove the deck from the list immediately
      decks = decks.filter(d => d.id !== event.detail.deckId);
    } else {
      // For other actions, reload the list
      await loadDecks();
    }
  }

  $: sortedDecks = decks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
</script>

<div class="deck-list">
  {#if loading}
    <div class="message">Loading decks...</div>
  {:else if error}
    <div class="message error">{error}</div>
  {:else if decks.length === 0}
    <div class="message">No decks found. Create your first deck using the selector above.</div>
  {:else}
    <div class="decks">
      {#each sortedDecks as deck (deck.id)}
        <DeckManager {deck} on:deckChange={handleDeckChange} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .deck-list {
    padding: 1rem;
  }

  .decks {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .message {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
  }

  .error {
    color: #c62828;
  }
</style> 