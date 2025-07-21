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
    if (tempStat?.type === 'character') {
      characterAge = tempStat.value;
    } else if (tempStat?.type === 'item') {
      itemPortability = tempStat.value;
    } else if (tempStat?.type === 'location') {
      locationArea = tempStat.value.value;
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
      {character.stat.value.value}
    {/if}
  </button>
{:else}
  <button 
    class="stat-add"
    on:click={openDialog}
  >
    Set Type/Stat +
  </button>
{/if}

<!-- Type/Stat Selector Modal -->
<dialog bind:this={dialog} class="stat-dialog">
  <div class="dialog-content">
    <h2>Set Card Type & Stat</h2>

    <!-- Character Option -->
    <label class="stat-option">
      <input
        type="radio"
        name="stat-type"
        checked={tempStat?.type === 'character'}
        on:change={setCharacter}
      >
      <div class="stat-details">
        <span>Character</span>
        <input
          type="text"
          placeholder="Age"
          disabled={tempStat?.type !== 'character'}
          bind:value={characterAge}
          on:input={setCharacter}
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
        <span>Item</span>
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
        <span>Location</span>
        <div class="area-input">
          <input
            type="text"
            placeholder="Area"
            disabled={tempStat?.type !== 'location'}
            list="area-suggestions"
            bind:value={locationArea}
            on:input={setLocation}
          >
          <datalist id="area-suggestions">
            {#each locationCards as loc}
              <option value={loc.id}>{loc.name}</option>
            {/each}
            {#each areaNames as area}
              <option value={area}>{area}</option>
            {/each}
          </datalist>
        </div>
      </div>
    </label>

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
  }

  .stat-display.character {
    background: #e3f2fd;
    color: #1976d2;
  }

  .stat-display.item {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .stat-display.location {
    background: #fff3e0;
    color: #e65100;
  }

  .stat-add {
    padding: 0.25rem 0.5rem;
    border: 1px dashed #ccc;
    border-radius: 4px;
    background: none;
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
    min-width: 300px;
  }

  .stat-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog-content {
    padding: 1.5rem;
  }

  h2 {
    margin: 0 0 1rem;
    font-size: 1.2rem;
    color: #333;
  }

  .stat-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    margin: 0.5rem 0;
    border: 1px solid #eee;
    border-radius: 4px;
    cursor: pointer;
  }

  .stat-option:hover {
    background: #f9f9f9;
  }

  .stat-details {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  input[type="text"],
  select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  input[type="text"]:disabled,
  select:disabled {
    background: #f5f5f5;
    color: #999;
  }

  .area-input {
    position: relative;
    flex: 1;
    max-width: 200px;
  }

  .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .dialog-buttons button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .clear {
    background: #f5f5f5;
    color: #666;
  }

  .cancel {
    background: #fff;
    border: 1px solid #ddd;
    color: #666;
  }

  .save {
    background: #2196f3;
    color: white;
  }

  .save:hover {
    background: #1976d2;
  }
</style> 