<!-- CardStatsEditor.svelte -->
<script lang="ts">
  import type { Card, CardStat, StatDefinition } from '$lib/types';
  import { COMMON_STATS, getStatDefinition, getStatsByCategory, createCustomStatId, validateStatId } from '$lib/stats';
  import { currentDeck } from '$lib/stores/deck';
  import { canonUpdateCard, isFieldLoading } from '$lib/stores/canonUpdate';
  
  const props = $props<{
    card: Card;
  }>();
  const cardId = props.card.id;
  
  // Get card reactively from store (like other components do)
  function getCard(id: string): Card {
    const found = $currentDeck?.cards.find(c => c.id === id);
    if (!found) {
      return props.card; // Fallback to original prop
    }
    return found;
  }
  const card = $derived(getCard(cardId));

  // Get loading state
  const isUpdating = $derived(isFieldLoading('card-stats'));

  let dialogElement = $state<HTMLDialogElement | null>(null);
  let isDialogOpen = $state(false);
  
  // Form state
  let editingStats = $state<CardStat[]>([]);
  let selectedStatId = $state<string>('');
  let newStatValue = $state<string | number>('');
  let showAddStat = $state(false);
  let showCustomStatForm = $state(false);
  let customStatLabel = $state('');
  let customStatIcon = $state('');
  
  // Drag and drop state
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  
  // Get current stats (fallback to empty array) - now reactive!
  const currentStats = $derived(card.stats || []);
  
  // Get all available stat definitions (common + deck custom)
  const customStats = $derived($currentDeck?.meta?.customStats || []);
  const allStatDefinitions = $derived([...COMMON_STATS, ...customStats]);
  const statsByCategory = $derived(getStatsByCategory(customStats));

  function openDialog() {
    // Copy current stats for editing
    editingStats = [...currentStats];
    isDialogOpen = true;
    dialogElement?.showModal();
  }

  function closeDialog() {
    isDialogOpen = false;
    showAddStat = false;
    showCustomStatForm = false;
    selectedStatId = '';
    newStatValue = '';
    customStatLabel = '';
    customStatIcon = '';
    dialogElement?.close();
  }

  function addStat() {
    if (!selectedStatId || !newStatValue) return;
    
    // Check if stat already exists
    const exists = editingStats.some(stat => stat.statId === selectedStatId);
    if (exists) return;
    
    editingStats = [...editingStats, { 
      statId: selectedStatId, 
      value: newStatValue 
    }];
    
    selectedStatId = '';
    newStatValue = '';
    showAddStat = false;
  }

  function removeStat(statId: string) {
    editingStats = editingStats.filter(stat => stat.statId !== statId);
  }

  function updateStatValue(statId: string, value: string | number) {
    editingStats = editingStats.map(stat => 
      stat.statId === statId ? { ...stat, value } : stat
    );
  }

  async function saveStats() {
    const updates = { stats: editingStats };
    
    const success = await canonUpdateCard(card.id, updates, ['card-stats'], 'Saving stats...');
    if (success) {
      closeDialog();
    }
  }

  function getStatIcon(statId: string): string {
    const definition = getStatDefinition(statId, customStats);
    return definition?.icon || 'question-mark';
  }

  function getStatLabel(statId: string): string {
    const definition = getStatDefinition(statId, customStats);
    return definition?.label || statId;
  }
  
  // Drag and drop functions
  function handleDragStart(event: DragEvent, index: number) {
    draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }
  
  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    dragOverIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  function handleDragLeave() {
    dragOverIndex = null;
  }
  
  function handleDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      draggedIndex = null;
      dragOverIndex = null;
      return;
    }
    
    // Reorder the stats array
    const newStats = [...editingStats];
    const [movedStat] = newStats.splice(draggedIndex, 1);
    newStats.splice(dropIndex, 0, movedStat);
    editingStats = newStats;
    
    // Reset drag state
    draggedIndex = null;
    dragOverIndex = null;
  }
  
  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }
</script>

<!-- Stats Display (replaces the old Type button) -->
{#if currentStats.length > 0}
  <div class="stats-display">
    {#each currentStats as stat}
      <button 
        class="stat-item"
        class:updating={isUpdating}
        onclick={openDialog}
        disabled={isUpdating}
        title="{getStatLabel(stat.statId)}: {stat.value}"
      >
        <img 
          src="/icons/game-icons/{getStatIcon(stat.statId)}.svg" 
          alt={getStatLabel(stat.statId)}
          class="stat-icon"
        />
        <span class="stat-value">{stat.value}</span>
      </button>
    {/each}
  </div>
{:else}
  <button 
    class="stats-add"
    class:updating={isUpdating}
    onclick={openDialog}
    disabled={isUpdating}
  >
    {#if isUpdating}
      <span class="updating-text">Updating...</span>
    {:else}
      Stats
    {/if}
  </button>
{/if}

<!-- Stats Editor Dialog -->
<dialog 
  bind:this={dialogElement} 
  class="stats-dialog"
  onclose={() => isDialogOpen = false}
>
  <div class="dialog-content">
    <h2>Card Stats</h2>
    
    <!-- Current Stats -->
    <div class="current-stats">
      {#if editingStats.length > 0}
        <p class="drag-hint">💡 Drag the grip icon (⋮⋮) to reorder stats</p>
        {#each editingStats as stat, index}
          <div 
            class="stat-editor"
            class:dragging={draggedIndex === index}
            class:drag-over={dragOverIndex === index}
            draggable="true"
            ondragstart={(e) => handleDragStart(e, index)}
            ondragover={(e) => handleDragOver(e, index)}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, index)}
            ondragend={handleDragEnd}
          >
            <div class="drag-handle" title="Drag to reorder">
              ⋮⋮
            </div>
            <div class="stat-display-edit">
              <img 
                src="/icons/game-icons/{getStatIcon(stat.statId)}.svg" 
                alt={getStatLabel(stat.statId)}
                class="stat-icon"
              />
              <span class="stat-label">{getStatLabel(stat.statId)}</span>
            </div>
            <input
              type="text"
              bind:value={stat.value}
              onchange={(e) => updateStatValue(stat.statId, e.target.value)}
              placeholder="Value"
            />
            <button 
              class="remove-stat"
              onclick={() => removeStat(stat.statId)}
              title="Remove stat"
            >
              ×
            </button>
          </div>
        {/each}
      {:else}
        <p class="no-stats">No stats added yet</p>
      {/if}
    </div>

    <!-- Add New Stat -->
    {#if showAddStat}
      <div class="add-stat-form">
        <h3>Add Stat</h3>
        <div class="stat-categories">
          {#each Object.entries(statsByCategory) as [category, stats]}
            <div class="category">
              <h4>{category}</h4>
              <div class="stat-options">
                {#each stats as definition}
                  {@const isUsed = editingStats.some(s => s.statId === definition.id)}
                  <button
                    class="stat-option"
                    class:selected={selectedStatId === definition.id}
                    class:used={isUsed}
                    disabled={isUsed}
                    onclick={() => selectedStatId = definition.id}
                  >
                    <img 
                      src="/icons/game-icons/{definition.icon}.svg" 
                      alt={definition.label}
                      class="stat-icon"
                    />
                    <span>{definition.label}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
        
        {#if selectedStatId}
          <div class="stat-value-input">
            <input
              type="text"
              bind:value={newStatValue}
              placeholder="Enter value"
            />
            <button onclick={addStat}>Add</button>
          </div>
        {/if}
        
        <button class="secondary" onclick={() => showAddStat = false}>Cancel</button>
      </div>
    {/if}

    <!-- Dialog Buttons -->
    <div class="dialog-buttons">
      {#if !showAddStat}
        <button 
          class="add-button"
          onclick={() => showAddStat = true}
        >
          Add Stat
        </button>
      {/if}
      <button class="secondary" onclick={closeDialog} disabled={isUpdating}>Cancel</button>
      <button class="primary" onclick={saveStats} disabled={isUpdating}>
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
  .stats-display {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: flex-end;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.4rem;
    border: none;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.95);
    cursor: pointer;
    transition: background-color 0.2s;
    font-family: var(--theme-title-font);
    font-size: 0.8em;
  }

  .stat-item:hover {
    background: rgba(255, 255, 255, 1);
  }

  .stat-icon {
    width: 16px;
    height: 16px;
    filter: var(--icon-filter, none);
    /* Theme colors will be applied via CSS variables */
    fill: currentColor;
  }

  .stat-value {
    font-weight: 500;
    min-width: 1.5em;
    text-align: center;
  }

  .stats-add {
    padding: 0.25rem 0.5rem;
    border: 1px dashed #666;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.95);
    cursor: pointer;
    color: #666;
    font-size: 0.8em;
  }

  .stats-add:hover {
    background: #f5f5f5;
  }

  .stats-dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    min-width: 400px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .stats-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog-content {
    padding: 1.5rem;
  }

  .dialog-content h2 {
    margin: 0 0 1.5rem;
    font-size: 1.2rem;
    color: #333;
    font-weight: 500;
  }

  .current-stats {
    margin-bottom: 1.5rem;
  }

  .stat-editor {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid #eee;
    border-radius: 4px;
  }

  .stat-display-edit {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 120px;
  }

  .stat-label {
    font-weight: 500;
  }

  .stat-editor input {
    flex: 1;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .remove-stat {
    padding: 0.25rem 0.5rem;
    border: none;
    background: #f5f5f5;
    border-radius: 4px;
    cursor: pointer;
    color: #666;
  }

  .remove-stat:hover {
    background: #ff5555;
    color: white;
  }

  .no-stats {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

  .add-stat-form {
    border-top: 1px solid #eee;
    padding-top: 1rem;
    margin-top: 1rem;
  }

  .add-stat-form h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    color: #333;
  }

  .category {
    margin-bottom: 1rem;
  }

  .category h4 {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .stat-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
  }

  .stat-option:hover {
    border-color: #2196f3;
  }

  .stat-option.selected {
    border-color: #2196f3;
    background: #e3f2fd;
  }

  .stat-option.used {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .stat-option .stat-icon {
    width: 16px;
    height: 16px;
  }

  .stat-value-input {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
    align-items: center;
  }

  .stat-value-input input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }

  .dialog-buttons button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .add-button {
    background: #f5f5f5;
    color: #666;
  }

  .add-button:hover {
    background: #e0e0e0;
  }

  .secondary {
    background: #fff;
    border: 1px solid #ddd !important;
    color: #666;
  }

  .secondary:hover {
    background: #f5f5f5;
    border-color: #ccc !important;
  }

  .primary {
    background: #2196f3;
    color: white;
  }

  .primary:hover {
    background: #1976d2;
  }

  /* Drag and drop styles */
  .drag-hint {
    color: #666;
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
    font-style: italic;
  }

  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: #999;
    cursor: grab;
    user-select: none;
    font-size: 14px;
    line-height: 1;
  }

  .drag-handle:hover {
    color: #666;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 2px;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .stat-editor.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
    z-index: 1000;
  }

  .stat-editor.drag-over {
    border-color: #2196f3;
    background: #e3f2fd;
    transform: scale(1.02);
  }

  .stat-editor {
    transition: all 0.2s ease;
  }

  /* Loading states */
  .updating {
    opacity: 0.6;
    pointer-events: none;
  }

  .updating-text {
    font-style: italic;
    opacity: 0.8;
  }
</style>
