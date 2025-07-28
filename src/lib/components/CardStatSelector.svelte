<script lang="ts">
  import type { CardStat, Portability, Card } from '$lib/types';
  import { currentDeck } from '$lib/stores/deck';
  
  const { card, onChange } = $props<{
    card: Card;
    onChange: (updates: Partial<Card>) => void;
  }>();

  let dialogElement = $state<HTMLDialogElement | null>(null);
  let isDialogOpen = $state(false);
  let tempStat = $state<CardStat | undefined>(card.stat);
  let characterAge = $state(card.stat?.type === 'character' ? card.stat.value : '');
  let itemPortability = $state<Portability>(card.stat?.type === 'item' ? card.stat.value as Portability : 'light');
  let locationArea = $state(card.stat?.type === 'location' ? card.stat.value.value : '');
  let selectedType = $state<'character' | 'item' | 'location' | undefined>(card.stat?.type);
  
  // Generate unique IDs for this instance
  const instanceId = crypto.randomUUID();
  const characterTypeId = `character-type-${instanceId}`;
  const characterAgeId = `character-age-${instanceId}`;
  const itemTypeId = `item-type-${instanceId}`;
  const itemPortabilityId = `item-portability-${instanceId}`;
  const locationTypeId = `location-type-${instanceId}`;
  const locationAreaId = `location-area-${instanceId}`;

  function initializeState() {
    if (card.stat?.type === 'character') {
      characterAge = card.stat.value;
      tempStat = { type: 'character', value: characterAge };
    } else if (card.stat?.type === 'item') {
      itemPortability = card.stat.value as Portability;
      tempStat = { type: 'item', value: itemPortability };
    } else if (card.stat?.type === 'location') {
      locationArea = card.stat.value.value;
      tempStat = { 
        type: 'location', 
        value: card.stat.value
      };
    } else {
      // Reset state if no stat
      characterAge = '';
      itemPortability = 'light';
      locationArea = '';
      tempStat = undefined;
    }
  }

  function openDialog() {
    initializeState();
    isDialogOpen = true;
    dialogElement?.showModal();
  }

  function closeDialog() {
    isDialogOpen = false;
    dialogElement?.close();
  }

  function clearStat() {
    onChange({ 
      stat: undefined,
      image: card.image,
      imageBlob: card.imageBlob
    });
    closeDialog();
  }

  function saveStat() {
    const updates = { 
      stat: tempStat,
      image: card.image,
      imageBlob: card.imageBlob
    };
    onChange(updates);
    closeDialog();
  }

  function setCharacter() {
    if (!characterAge) return;
    tempStat = { type: 'character', value: characterAge };
  }

  function setItem() {
    tempStat = { type: 'item', value: itemPortability };
  }

  function setLocation() {
    tempStat = { 
      type: 'location', 
      value: { type: 'soft', value: locationArea }
    };
  }

  // Get all unique area names and location cards as derived values
  const areaNames = $derived(
    ($currentDeck?.cards || [])
      .map(c => c.stat?.type === 'location' && c.stat.value.type === 'soft' ? c.stat.value.value : null)
      .filter((name): name is string => name !== null)
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

  // Check if a location ID exists
  function locationExists(id: string): boolean {
    return locationCards.some(c => c.id === id);
  }

  // Handle location input change
  function handleLocationInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Check if value starts with our location icon
    if (value.startsWith('📍 ')) {
      // Find location card by name
      const locationCard = locationCards.find(c => `📍 ${c.name}` === value);
      if (locationCard) {
        tempStat = {
          type: 'location',
          value: { type: 'hard', value: locationCard.id }
        };
      }
    } else {
      // Treat as soft link
      tempStat = {
        type: 'location',
        value: { type: 'soft', value }
      };
    }
  }

  // Initialize state when card changes
  $effect(() => {
    if (card.stat?.type === 'character') {
      characterAge = card.stat.value;
    } else if (card.stat?.type === 'item') {
      itemPortability = card.stat.value as Portability;
    } else if (card.stat?.type === 'location') {
      locationArea = card.stat.value.value;
    }
  });

  // Keep selectedType in sync with card.stat
  $effect(() => {
    selectedType = card.stat?.type;
  });

  // Update tempStat when selectedType changes
  $effect(() => {
    if (selectedType === 'character') {
      tempStat = { type: 'character', value: characterAge || '' };
    } else if (selectedType === 'item') {
      tempStat = { type: 'item', value: itemPortability };
    } else if (selectedType === 'location') {
      tempStat = { 
        type: 'location', 
        value: { type: 'soft', value: locationArea || '' }
      };
    }
  });
</script>

<!-- Stat Display/Trigger -->
{#if card.stat}
  <button 
    class="stat-display {card.stat.type}"
    onclick={openDialog}
  >
    {#if card.stat.type === 'character'}
      Age: {card.stat.value}
    {:else if card.stat.type === 'item'}
      {card.stat.value}
    {:else if card.stat.type === 'location'}
      {formatLocationDisplay(card.stat.value)}
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
    <h2>Card Type <span style="color: #666; font-size: 0.8em;">
      (current: {card.stat?.type ?? 'none'}, selected: {selectedType ?? 'none'})
    </span></h2>

    <div class="options-container">
      <!-- Character Option -->
      <label class="stat-option" for={characterTypeId}>
        <input
          type="radio"
          id={characterTypeId}
          name="stat-type"
          value="character"
          checked={card.stat?.type === 'character'}
        >
        <div class="stat-details">
          <span class="type-label">Character</span>
          <input
            type="text"
            id={characterAgeId}
            placeholder="Age"
            disabled={selectedType !== 'character'}
            bind:value={characterAge}
            onfocus={() => {
              selectedType = 'character';
              tempStat = { type: 'character', value: characterAge };
            }}
            oninput={() => {
              tempStat = { type: 'character', value: characterAge };
            }}
          >
        </div>
      </label>

      <!-- Item Option -->
      <label class="stat-option" for={itemTypeId}>
        <input
          type="radio"
          id={itemTypeId}
          name="stat-type"
          value="item"
          checked={card.stat?.type === 'item'}
        >
        <div class="stat-details">
          <span class="type-label">Item</span>
          <select
            id={itemPortabilityId}
            disabled={selectedType !== 'item'}
            bind:value={itemPortability}
            onfocus={() => {
              selectedType = 'item';
              tempStat = { type: 'item', value: itemPortability };
            }}
            onchange={() => {
              tempStat = { type: 'item', value: itemPortability };
            }}
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
      <label class="stat-option" for={locationTypeId}>
        <input
          type="radio"
          id={locationTypeId}
          name="stat-type"
          value="location"
          checked={card.stat?.type === 'location'}
        >
        <div class="stat-details">
          <span class="type-label">Location</span>
          <div class="area-input">
            <input
              type="text"
              id={locationAreaId}
              placeholder="Area"
              disabled={selectedType !== 'location'}
              bind:value={locationArea}
              onfocus={() => {
                selectedType = 'location';
                tempStat = { type: 'location', value: { type: 'soft', value: locationArea } };
              }}
              oninput={() => {
                tempStat = { 
                  type: 'location', 
                  value: { type: 'soft', value: locationArea }
                };
              }}
            >
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
    font-size: 1.6em;
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
    font-size: 1.6em;
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