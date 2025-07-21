<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDeck, clearDatabase, populateWithSampleData } from '$lib/stores/cards';
  import { listDecks, switchDeck, saveDeck } from '$lib/stores/cards';
  import type { CharacterDeck, CardSize } from '$lib/types';
  import { devMode } from '$lib/stores/dev';

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

  async function handleSizeChange(event: Event) {
    if (!$currentDeck) return;
    
    const select = event.target as HTMLSelectElement;
    const size = select.value as CardSize;
    
    const updatedDeck = {
      ...$currentDeck,
      meta: {
        ...$currentDeck.meta,
        cardSize: size
      }
    };
    
    await saveDeck(updatedDeck);
  }

  async function handleClearDatabase() {
    if (confirm('This will delete all decks. Are you sure?')) {
      await clearDatabase();
      window.location.reload(); // Refresh to clear everything
    }
  }

  async function handlePopulateSampleData() {
    if (confirm('Add sample deck with example cards?')) {
      const deck = await populateWithSampleData();
      window.location.reload(); // Refresh to show new data
    }
  }

  $: sortedDecks = decks.sort((a, b) => b.meta.lastEdited - a.meta.lastEdited);
</script>

<div class="deck-settings">
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

  {#if $currentDeck}
    <fieldset class="size-selector">
      <legend>Card size</legend>
      <select 
        on:change={handleSizeChange}
        value={$currentDeck.meta.cardSize || 'poker'}
      >
        <option value="poker">Poker (9 per page)</option>
        <option value="tarot">Tarot (4 per page)</option>
      </select>
      <p class="size-info">
        {$currentDeck.meta.cardSize === 'poker' 
          ? 'Standard playing card size, 9 cards per page'
          : 'Larger cards with more readable text, 4 cards per page'}
      </p>
    </fieldset>
  {/if}

  {#if $devMode}
    <fieldset class="dev-controls">
      <legend>Dev Tools - be careful!</legend>
      <button 
        class="danger" 
        on:click={handleClearDatabase}
        title="Development only: Clear all data"
      >
        Clear Database
      </button>
      <button 
        class="sample" 
        on:click={handlePopulateSampleData}
        title="Development only: Add sample data"
      >
        Add Sample Data
      </button>
    </fieldset>
  {/if}
</div>

<style>
  .deck-settings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .deck-selector, .size-selector {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 1rem;
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

  .size-info {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
  }

  .dev-controls {
    margin-top: 1rem;
    padding: 1rem;
    border: 2px solid #ff4444;
    border-radius: 4px;
    display: flex;
    gap: 1rem;
  }

  .dev-controls legend {
    color: #ff4444;
    font-weight: bold;
    padding: 0 0.5rem;
  }

  .danger {
    background: #ff4444;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .danger:hover {
    background: #ff0000;
  }

  .sample {
    background: #44aa44;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .sample:hover {
    background: #339933;
  }
</style> 