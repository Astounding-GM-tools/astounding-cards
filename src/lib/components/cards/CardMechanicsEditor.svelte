<script lang="ts">
  import type { Card, CardMechanic, MechanicType } from '../../types';
  import { MechanicType as MechanicTypes } from '../../types';
  // generateId is replaced with inline crypto.randomUUID() calls
  
  let {
    card,
    loading = false,
    onsave,
    hasChanges = $bindable(),
    editedCard = $bindable()
  }: {
    card: Card;
    loading?: boolean;
    onsave?: (card: Card) => void;
    hasChanges?: boolean;
    editedCard?: Card | null;
  } = $props();
  
  // Local copy for editing
  let mechanics = $state<CardMechanic[]>(card.mechanics ? [...card.mechanics] : []);
  
  // Track if there are any changes
  const localHasChanges = $derived(JSON.stringify(mechanics) !== JSON.stringify(card.mechanics || []));
  
  // Create the edited card state
  const localEditedCard = $derived<Card>({
    ...card,
    mechanics: mechanics.length > 0 ? mechanics : undefined
  });
  
  // Update parent bindings
  $effect(() => {
    hasChanges = localHasChanges;
    editedCard = localEditedCard;
  });
  
  // Tracking threshold - above this number, don't render boxes
  const TRACKING_THRESHOLD = 30;
  
  function addMechanic() {
    mechanics = [...mechanics, {
      id: crypto.randomUUID(),
      name: 'New Mechanic',
      value: 0,
      description: '',
      tracked: false,
      type: MechanicTypes.ATTACK
    }];
  }
  
  function removeMechanic(index: number) {
    mechanics = mechanics.filter((_, i) => i !== index);
  }
  
  function moveMechanic(index: number, direction: 'up' | 'down') {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === mechanics.length - 1)) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newMechanics = [...mechanics];
    [newMechanics[index], newMechanics[newIndex]] = [newMechanics[newIndex], newMechanics[index]];
    mechanics = newMechanics;
  }
  
  function handleSave() {
    if (loading) return;
    
    const updatedCard: Card = {
      ...card,
      mechanics: mechanics.length > 0 ? mechanics : undefined
    };
    
    onsave?.(updatedCard);
  }
  
  function getTypeIcon(type: MechanicType): string {
    switch (type) {
      case MechanicTypes.DEFENSE: return '🛡️';
      case MechanicTypes.INITIATIVE: return '⚡';
      case MechanicTypes.MOVEMENT: return '👟';
      case MechanicTypes.ATTACK: return '⚔️';
      case MechanicTypes.HEALTH: return '❤️';
      case MechanicTypes.RESOURCE: return '📦';
      default: return '📋';
    }
  }
  
  function getTypeName(type: MechanicType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  
  function isNumeric(value: string | number): boolean {
    return typeof value === 'number' || !isNaN(Number(value));
  }
</script>

<div class="mechanics-editor">
  <div class="header">
    <h3>Card Mechanics</h3>
    <p class="subtitle">Back-card GM reference stats for printed cards</p>
  </div>
  
  <div class="mechanics-list">
    {#each mechanics as mechanic, index (mechanic.id)}
      <div class="mechanic-item">
        <div class="mechanic-header">
          <div class="type-selector">
            <span class="type-icon" title="{getTypeName(mechanic.type)}">{getTypeIcon(mechanic.type)}</span>
            <select bind:value={mechanic.type} class="type-select">
              {#each Object.values(MechanicTypes) as type}
                <option value={type}>{getTypeName(type)}</option>
              {/each}
            </select>
          </div>
          
          <div class="controls">
            <button 
              type="button" 
              class="move-btn" 
              disabled={index === 0}
              onclick={() => moveMechanic(index, 'up')}
              title="Move up"
            >
              ↑
            </button>
            <button 
              type="button" 
              class="move-btn" 
              disabled={index === mechanics.length - 1}
              onclick={() => moveMechanic(index, 'down')}
              title="Move down"
            >
              ↓
            </button>
            <button 
              type="button" 
              class="remove-btn" 
              onclick={() => removeMechanic(index)}
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div class="mechanic-fields">
          <div class="field">
            <label for="name-{mechanic.id}">Name</label>
            <input 
              id="name-{mechanic.id}"
              type="text" 
              bind:value={mechanic.name}
              placeholder="e.g. Longsword, Health, Bullets"
            />
          </div>
          
          <div class="field">
            <label for="value-{mechanic.id}">Value</label>
            <input 
              id="value-{mechanic.id}"
              type="text" 
              bind:value={mechanic.value}
              placeholder="e.g. +5, 1d8+3, 15, AC 18"
            />
          </div>
          
          <div class="field">
            <label for="description-{mechanic.id}">Description (optional)</label>
            <input 
              id="description-{mechanic.id}"
              type="text" 
              bind:value={mechanic.description}
              placeholder="e.g. ring mail and shield, crossbow bolts"
            />
          </div>
          
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                bind:checked={mechanic.tracked}
              />
              <span class="checkbox-text">
                Trackable
                {#if mechanic.tracked}
                  {#if isNumeric(mechanic.value) && Number(mechanic.value) > TRACKING_THRESHOLD}
                    <span class="warning">(>30 - no boxes will be rendered)</span>
                  {/if}
                {/if}
              </span>
            </label>
          </div>
        </div>
      </div>
    {/each}
    
    {#if mechanics.length === 0}
      <div class="empty-state">
        <p>No mechanics defined. Add some GM reference stats for the back of the card.</p>
      </div>
    {/if}
  </div>
  
  <div class="actions">
    <button type="button" class="add-btn" onclick={addMechanic}>
      + Add Mechanic
    </button>
  </div>
</div>

<style>
  .mechanics-editor {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .header {
    margin-bottom: 1.5rem;
  }
  
  .header h3 {
    margin: 0 0 0.25rem 0;
    color: var(--color-text);
  }
  
  .subtitle {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }
  
  .mechanics-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .mechanic-item {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
  }
  
  .mechanic-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .type-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .type-icon {
    font-size: 1.25rem;
  }
  
  .type-select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
  }
  
  .controls {
    display: flex;
    gap: 0.25rem;
  }
  
  .move-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    min-width: 2rem;
  }
  
  .move-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .remove-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-danger);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-danger);
    cursor: pointer;
    min-width: 2rem;
  }
  
  .mechanic-fields {
    display: grid;
    gap: 0.75rem;
  }
  
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .field label {
    font-weight: 500;
    color: var(--color-text);
    font-size: 0.875rem;
  }
  
  .field input[type="text"] {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
  }
  
  .checkbox-field {
    flex-direction: row;
    align-items: center;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .checkbox-text {
    font-weight: normal;
  }
  
  .warning {
    color: var(--color-warning);
    font-size: 0.75rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-secondary);
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-start;
  }
  
  .add-btn {
    padding: 0.5rem 1rem;
    border: 1px dashed var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .add-btn:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-secondary);
  }
  
</style>
