<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck } from '$lib/stores/cards';
  import { listDecks, switchDeck, saveDeck } from '$lib/stores/cards';
  import type { CharacterDeck } from '$lib/types';

  let decks: CharacterDeck[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      decks = await listDecks();
      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load decks';
      loading = false;
    }
  });

  async function handleDeckChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    await switchDeck(select.value);
  }

  $: sortedDecks = decks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
</script>

<fieldset class="deck-selector">
  <legend>Select current deck</legend>
  {#if loading}
    <span class="status">Loading decks...</span>
  {:else if error}
    <span class="status error">{error}</span>
  {:else}
    <select 
      on:change={handleDeckChange}
      value={$currentDeck?.id}
    >
      {#each sortedDecks as deck (deck.id)}
        <option value={deck.id}>
          {deck.meta.name}
        </option>
      {/each}
    </select>
  {/if}
</fieldset>

<style>
  .deck-selector {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  legend {
    padding: 0 0.5rem;
    color: #666;
  }

  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    font-size: 1rem;
  }

  .status {
    font-size: 0.9rem;
    color: #666;
  }

  .error {
    color: #c62828;
  }
</style> 