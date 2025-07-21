<script lang="ts">
  import type { CardStat, Portability, Character } from '$lib/types';
  import { currentDeck } from '$lib/stores/cards';
  
  export let character: Character;
  export let onChange: (updates: Partial<Character>) => void;

  let dialog: HTMLDialogElement;
  let tempStat: CardStat | undefined = character.stat;
  let characterAge = '';
  let itemPortability: Portability = 'light';
  let locationArea = '';

  function openDialog() {
    tempStat = character.stat;
    if (tempStat?.type === 'location' && tempStat.value.type === 'hard') {
      if (!locationExists(tempStat.value.value)) {
        // Convert broken hard link to soft link
        tempStat = {
          type: 'location',
          value: { type: 'soft', value: tempStat.value.value }
        };
      }
    }
    dialog.showModal();
  }

  function clearStat() {
    onChange({ stat: undefined });
    dialog.close();
  }

  function saveStat() {
    onChange({ stat: tempStat });
    dialog.close();
  }

  function setCharacter() {
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

  // Get all unique area names from the deck for suggestions
  $: areaNames = ($currentDeck?.characters || [])
    .map(c => c.stat?.type === 'location' && c.stat.value.type === 'soft' ? c.stat.value.value : null)
    .filter((name): name is string => name !== null);

  // Get all location cards from the deck
  $: locationCards = ($currentDeck?.characters || [])
    .filter(c => c.stat?.type === 'location' && c.id !== character.id)
    .map(c => ({ id: c.id, name: c.name }));

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
</script>

<!-- Stat Display/Trigger -->
{#if character.stat}
  <button 
    class="stat-display {character.stat.type}"
    on:click={openDialog}
  >
    {#if character.stat.type === 'character'}
      Age: {character.stat.value}
    {:else if character.stat.type === 'item'}
      {character.stat.value}
    {:else if character.stat.type === 'location'}
      {formatLocationDisplay(character.stat.value)}
    {/if}
  </button>
{:else}
  <button 
    class="stat-add"
    on:click={openDialog}
  >
    Type
  </button>
{/if}

<!-- Type/Stat Selector Modal -->
<dialog bind:this={dialog} class="stat-dialog">
  <div class="dialog-content">
    <h2>Card Type</h2>

    <div class="options-container">
      <!-- Character Option -->
      <label class="stat-option">
        <input
          type="radio"
          name="stat-type"
          checked={tempStat?.type === 'character'}
          on:change={setCharacter}
        >
        <div class="stat-details">
          <span class="type-label">Character</span>
          <input
            type="text"
            placeholder="Age"
            disabled={tempStat?.type !== 'character'}
            value={tempStat?.type === 'character' ? tempStat.value : ''}
            on:input={handleLocationInput}
          >
        </div>
      </label>

      <!-- Item Option -->
      <label class="stat-option">
        <input
          type="radio"
          name="stat-type"
          checked={tempStat?.type === 'item'}
          on:change={setItem}
        >
        <div class="stat-details">
          <span class="type-label">Item</span>
          <select
            disabled={tempStat?.type !== 'item'}
            bind:value={itemPortability}
            on:change={setItem}
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
          checked={tempStat?.type === 'location'}
          on:change={setLocation}
        >
        <div class="stat-details">
          <span class="type-label">Location</span>
          <div class="area-input">
            <input
              type="text"
              placeholder="Area"
              disabled={tempStat?.type !== 'location'}
              list="area-suggestions"
              value={tempStat?.type === 'location' ? tempStat.value.value : ''}
              on:input={handleLocationInput}
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
      <button class="clear" on:click={clearStat}>Clear Type</button>
      <button class="cancel" on:click={() => dialog.close()}>Cancel</button>
      <button class="save" on:click={saveStat}>Save</button>
    </div>
  </div>
</dialog>

<style>
  .stat-display {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
    background: rgba(255, 255, 255, 0.95);
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
    font-size: 0.9rem;
  }

  .stat-add:hover {
    background: #f5f5f5;
  }

  .stat-dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    min-width: 320px;
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
  }

  input[type="text"],
  select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
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
    font-size: 0.9rem;
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