<!-- CardStatSelector.svelte -->
<script lang="ts">
  import type { CardStat, Portability, Card } from '$lib/types';
  import { currentDeck } from '$lib/stores/deck';
  import { getDeckContext } from '$lib/stores/deckContext';
  
  const props = $props<{
    card: Card;
  }>();
  const card = props.card;

  // Get deck context
  const deckContext = getDeckContext();

  let dialogElement = $state<HTMLDialogElement | null>(null);
  let isDialogOpen = $state(false);
  
  // Form state - separate from the card state
  let formType = $state<'character' | 'item' | 'location' | undefined>(undefined);
  let formAge = $state('');
  let formPortability = $state<Portability>('light');
  let formArea = $state('');

  // Local display state for optimistic updates
  let displayStat = $state<CardStat | undefined>(card.stat);

  // Sync displayStat with store updates
  $effect(() => {
    const currentCard = $currentDeck?.cards.find(c => c.id === card.id);
    const storeStat = currentCard?.stat;
    
    if (JSON.stringify(storeStat) !== JSON.stringify(displayStat)) {
      displayStat = storeStat;
    }
  });

  // Reset form state when dialog opens
  function openDialog() {
    // Set form type based on card type
    formType = card.type as 'character' | 'item' | 'location';
    
    // Initialize form values from current stat
    if (card.stat?.type === 'character') {
      formAge = card.stat.value;
    } else if (card.stat?.type === 'item') {
      formPortability = card.stat.value;
    } else if (card.stat?.type === 'location') {
      if (card.stat.value.type === 'soft') {
        formArea = card.stat.value.value;
      } else if (card.stat.value.type === 'hard') {
        // For hard links, show the formatted display with the pin icon
        formArea = formatLocationDisplay(card.stat.value);
      }
    }
    
    isDialogOpen = true;
    dialogElement?.showModal();
  }

  function closeDialog() {
    isDialogOpen = false;
    dialogElement?.close();
  }

  function saveStat() {
    let statUpdate: CardStat | undefined;
    let updates: Partial<Card>;
    
    if (!formType) {
      statUpdate = undefined;
      updates = {
        type: 'character',
        stat: undefined
      };
    } else {
      if (formType === 'location') {
        statUpdate = {
          type: 'location',
          value: { type: 'soft', value: formArea }
        };
      } else if (formType === 'character') {
        statUpdate = { type: 'character', value: formAge };
      } else {
        statUpdate = { type: 'item', value: formPortability };
      }

      updates = {
        type: formType,
        stat: statUpdate
      };
    }

    // Optimistic update for immediate feedback
    displayStat = statUpdate;
    deckContext.updateCardFields(card.id, updates);
    
    closeDialog();
  }

  function clearStat() {
    formType = undefined;
    
    const updates = {
      type: 'character' as const,
      stat: undefined
    };
    
    // Optimistic update for immediate feedback
    displayStat = undefined;
    deckContext.updateCardFields(card.id, updates);
    
    closeDialog();
  }

  // Get all unique area names and location cards
  const areaNames = $derived(
    [...new Set(
      ($currentDeck?.cards || [])
        .map(c => c.stat?.type === 'location' && c.stat.value.type === 'soft' ? c.stat.value.value : null)
        .filter((name): name is string => name !== null)
    )]
  );

  const locationCards = $derived(
    ($currentDeck?.cards || [])
      .filter(c => c.stat?.type === 'location' && c.id !== card.id)
      .map(c => ({ id: c.id, name: c.name }))
  );

  // Format location display
  function formatLocationDisplay(value: { type: 'hard' | 'soft', value: string }): string {
    if (value.type === 'hard') {
      const card = locationCards.find(c => c.id === value.value);
      return card ? `📍 ${card.name}` : value.value;
    }
    return value.value;
  }

  // Handle location input change
  function handleLocationInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    if (value.startsWith('📍 ')) {
      const locationCard = locationCards.find(c => `📍 ${c.name}` === value);
      if (locationCard) {
        const statUpdate = {
          type: 'location' as const,
          value: { type: 'hard' as const, value: locationCard.id }
        };
        
        const updates = {
          type: 'location' as const,
          stat: statUpdate
        };
        
        // Optimistic update for immediate feedback
        displayStat = statUpdate;
        deckContext.updateCardFields(card.id, updates);
      }
    }
    formArea = value;
  }
</script>

<!-- Stat Display/Trigger -->
{#if displayStat}
  <button 
    class="stat-display {displayStat.type}"
    onclick={openDialog}
  >
    {#if displayStat.type === 'character'}
      Age: {displayStat.value}
    {:else if displayStat.type === 'item'}
      {displayStat.value}
    {:else if displayStat.type === 'location'}
      {formatLocationDisplay(displayStat.value)}
    {/if}
  </button>
{:else}
  <button 
    class="stat-add"
    onclick={openDialog}
  >
    Type
  </button>
{/if}

<!-- Type/Stat Selector Modal -->
<dialog 
  bind:this={dialogElement} 
  class="stat-dialog"
  onclose={() => isDialogOpen = false}
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
          bind:group={formType}
        />
        <div class="stat-details">
          <span class="type-label">Character</span>
          <input
            type="text"
            placeholder="Age"
            disabled={formType !== 'character'}
            bind:value={formAge}
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
          bind:group={formType}
        />
        <div class="stat-details">
          <span class="type-label">Item</span>
          <select
            disabled={formType !== 'item'}
            bind:value={formPortability}
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
          bind:group={formType}
        />
        <div class="stat-details">
          <span class="type-label">Location</span>
          <div class="area-input">
            <input
              type="text"
              placeholder="Area"
              disabled={formType !== 'location'}
              bind:value={formArea}
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
      <button class="clear" onclick={clearStat}>Clear Type</button>
      <button class="cancel" onclick={closeDialog}>Cancel</button>
      <button class="save" onclick={saveStat}>Save</button>
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