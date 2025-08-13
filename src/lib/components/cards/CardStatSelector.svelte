<!-- CardStatSelector.svelte -->
<script lang="ts">
  import type { Card } from '$lib/types';
  import { currentDeck } from '$lib/stores/deck';
  import { canonUpdateCard, isFieldLoading } from '$lib/stores/canonUpdate';
  import {
    createCardStatSelectorState,
    getAreaNames,
    getLocationCards,
    formatLocationDisplay,
    initializeFormValues,
    createStatUpdate,
    createClearStatUpdate,
    processLocationInput,
    syncDisplayStat,
    type CardStatSelectorState
  } from './CardStatSelector.svelte';
  
  const props = $props<{
    card: Card;
  }>();
  const card = props.card;

  // Get loading state
  const isUpdating = $derived(isFieldLoading('card-stats'));

  // State management using extracted logic
  let state = $state<CardStatSelectorState>(createCardStatSelectorState(card.stat));

  // Derived data using extracted functions
  const areaNames = $derived(getAreaNames($currentDeck));
  const locationCards = $derived(getLocationCards($currentDeck, card.id));

  // Sync displayStat with store updates
  $effect(() => {
    const currentCard = $currentDeck?.cards.find(c => c.id === card.id);
    const storeStat = currentCard?.stat;
    
    const newDisplayStat = syncDisplayStat(storeStat, state.displayStat);
    if (newDisplayStat !== state.displayStat) {
      state.displayStat = newDisplayStat;
    }
  });

  // Reset form state when dialog opens
  function openDialog() {
    state = initializeFormValues(card, state);
    
    // Handle hard link formatting for location
    if (card.stat?.type === 'location' && card.stat.value.type === 'hard') {
      state.formArea = formatLocationDisplay(card.stat.value, locationCards);
    }
    
    state.isDialogOpen = true;
    state.dialogElement?.showModal();
  }

  function closeDialog() {
    state.isDialogOpen = false;
    state.dialogElement?.close();
  }

  async function saveStat() {
    const { statUpdate, updates } = createStatUpdate(state);

    // Optimistic update for immediate feedback
    state.displayStat = statUpdate;
    
    const success = await canonUpdateCard(card.id, updates, ['card-stats'], 'Saving card stats...');
    if (success) {
      closeDialog();
    } else {
      // Rollback optimistic update on failure
      state.displayStat = card.stat;
    }
  }

  async function clearStat() {
    state.formType = undefined;
    
    const { updates } = createClearStatUpdate();
    
    // Optimistic update for immediate feedback
    const previousStat = state.displayStat;
    state.displayStat = undefined;
    
    const success = await canonUpdateCard(card.id, updates, ['card-stats'], 'Clearing card stats...');
    if (success) {
      closeDialog();
    } else {
      // Rollback optimistic update on failure
      state.displayStat = previousStat;
    }
  }

  // Handle location input change
  function handleLocationInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    const result = processLocationInput(value, locationCards);
    if (result.isHardLink && result.statUpdate && result.updates) {
      // Use Canon Update for location input
      state.displayStat = result.statUpdate;
      canonUpdateCard(card.id, result.updates, ['card-stats'], 'Updating location...');
    }
    
    state.formArea = value;
  }
</script>

<!-- Stat Display/Trigger -->
{#if state.displayStat}
  <button 
    class="stat-display {state.displayStat.type}"
    class:updating={isUpdating}
    onclick={openDialog}
    disabled={isUpdating}
  >
    {#if isUpdating}
      <span class="updating-text">Updating...</span>
    {:else if state.displayStat.type === 'character'}
      Age: {state.displayStat.value}
    {:else if state.displayStat.type === 'item'}
      {state.displayStat.value}
    {:else if state.displayStat.type === 'location'}
      {formatLocationDisplay(state.displayStat.value, locationCards)}
    {/if}
  </button>
{:else}
  <button 
    class="stat-add"
    class:updating={isUpdating}
    onclick={openDialog}
    disabled={isUpdating}
  >
    {#if isUpdating}
      <span class="updating-text">Updating...</span>
    {:else}
      Type
    {/if}
  </button>
{/if}

<!-- Type/Stat Selector Modal -->
<dialog 
  bind:this={state.dialogElement} 
  class="stat-dialog"
  onclose={() => state.isDialogOpen = false}
>
  <div class="dialog-content">
    <h2>Card Type</h2>

    <div class="options-container">
      <!-- Character Option -->
      <label class="stat-option">
        <input
          type="radio"
          name="stat-type"
          value="character"
          checked={card.type === 'character'}
          bind:group={state.formType}
        />
        <div class="stat-details">
          <span class="type-label">Character</span>
          <input
            type="text"
            placeholder="Age"
            disabled={state.formType !== 'character'}
            bind:value={state.formAge}
          />
        </div>
      </label>

      <!-- Item Option -->
      <label class="stat-option">
        <input
          type="radio"
          name="stat-type"
          value="item"
          checked={card.type === 'item'}
          bind:group={state.formType}
        />
        <div class="stat-details">
          <span class="type-label">Item</span>
          <select
            disabled={state.formType !== 'item'}
            bind:value={state.formPortability}
          >
            <option value="negligible">Negligible</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
            <option value="stationary">Stationary</option>
          </select>
        </div>
      </label>

      <!-- Location Option -->
      <label class="stat-option">
        <input
          type="radio"
          name="stat-type"
          value="location"
          checked={card.type === 'location'}
          bind:group={state.formType}
        />
        <div class="stat-details">
          <span class="type-label">Location</span>
          <div class="area-input">
            <input
              type="text"
              placeholder="Area"
              disabled={state.formType !== 'location'}
              bind:value={state.formArea}
              list="area-suggestions"
              oninput={handleLocationInput}
            />
            <datalist id="area-suggestions">
              {#each locationCards as loc}
                <option value={`📍 ${loc.name}`}></option>
              {/each}
              {#each areaNames as area}
                <option value={area}></option>
              {/each}
            </datalist>
          </div>
        </div>
      </label>
    </div>

    <div class="dialog-buttons">
      <button class="clear" onclick={clearStat} disabled={isUpdating}>
        {#if isUpdating}
          Clearing...
        {:else}
          Clear Type
        {/if}
      </button>
      <button class="cancel" onclick={closeDialog} disabled={isUpdating}>Cancel</button>
      <button class="save" onclick={saveStat} disabled={isUpdating}>
        {#if isUpdating}
          Saving...
        {:else}
          Save
        {/if}
      </button>
    </div>
  </div>
</dialog>

<style>
  .stat-display {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    background: rgba(255, 255, 255, 0.95);
    font-family: var(--theme-title-font);  /* Use theme's display font */
  }

  .stat-display.character,
  .stat-display.item,
  .stat-display.location {
    display: flex;
    align-items: center;
    gap: 1mm;
  }

  .stat-add {
    padding: 0.25rem 0.5rem;
    border: 1px dashed #666;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.95);
    cursor: pointer;
    color: #666;
    font-size: 0.8em;  /* Halved from 1.6em */
  }

  .stat-add:hover {
    background: #f5f5f5;
  }

  .stat-dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    min-width: 320px;
    font-size: 0.9rem;  /* Reset font size for dialog */
  }

  .stat-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog-content {
    padding: 1.5rem;
  }

  h2 {
    margin: 0 0 1.5rem;
    font-size: 1.2rem;
    color: #333;
    font-weight: 500;
  }

  .options-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stat-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .stat-option:hover {
    background: #f9f9f9;
    border-color: #e0e0e0;
  }

  .stat-option input[type="radio"] {
    margin: 0;
    width: 16px;
    height: 16px;
  }

  .stat-details {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .type-label {
    font-weight: 500;
    color: #333;
    min-width: 80px;
    font-size: 0.9rem;  /* UI font size */
  }

  input[type="text"],
  select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;  /* UI font size */
    min-width: 120px;
    transition: all 0.2s ease;
  }

  input[type="text"]:focus,
  select:focus {
    border-color: #2196f3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  input[type="text"]:disabled,
  select:disabled {
    background: #f5f5f5;
    color: #999;
    border-color: #eee;
  }

  .area-input {
    position: relative;
    flex: 1;
    min-width: 120px;
  }

  .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }

  .dialog-buttons button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;  /* UI font size */
    transition: all 0.2s ease;
  }

  .clear {
    background: #f5f5f5;
    color: #666;
  }

  .clear:hover {
    background: #e0e0e0;
  }

  .cancel {
    background: #fff;
    border: 1px solid #ddd;
    color: #666;
  }

  .cancel:hover {
    background: #f5f5f5;
    border-color: #ccc;
  }

  .save {
    background: #2196f3;
    color: white;
  }

  .save:hover {
    background: #1976d2;
  }
</style> 