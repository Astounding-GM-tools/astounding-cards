<script lang="ts">
  import type { Card, CardMechanic } from '../../types';
  import { MechanicType } from '../../types';
  import { createEventDispatcher } from 'svelte';
  
  let {
    card,
    editable = false,
    onedit,
    onapplytemplate,
    onshowtemplatedialog
  }: {
    card: Card;
    editable?: boolean;
    onedit?: () => void;
    onapplytemplate?: (mechanics: CardMechanic[]) => void;
    onshowtemplatedialog?: (cardType: string) => void;
  } = $props();
  
  // Create a reactive derived mechanics array to force updates
  const mechanics = $derived(card.mechanics || []);
  
  const dispatch = createEventDispatcher<{
    showTemplateDialog: { cardType: string };
  }>();
  
  
  function getTypeIcon(type: MechanicType): string {
    switch (type) {
      case MechanicType.DEFENSE: return '🛡️';
      case MechanicType.INITIATIVE: return '⚡';
      case MechanicType.MOVEMENT: return '👟';
      case MechanicType.ATTACK: return '⚔️';
      case MechanicType.HEALTH: return '❤️';
      case MechanicType.RESOURCE: return '📦';
      default: return '📋';
    }
  }
  
  function isNumeric(value: string | number): boolean {
    return typeof value === 'number' || !isNaN(Number(value));
  }
  
  function shouldShowTrackingBoxes(mechanic: CardMechanic): boolean {
    return mechanic.tracked && isNumeric(mechanic.value) && Number(mechanic.value) <= 30;
  }
  
  function renderTrackingBoxes(count: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(count, 30)) }, (_, i) => i);
  }
  
  
  // Handle add stats button click
  function handleAddStats() {
    if (mechanics.length > 0) {
      // If card already has mechanics, go directly to editor
      onedit?.();
    } else {
      // If card has no mechanics, show template dialog first
      onshowtemplatedialog?.(card.type);
      dispatch('showTemplateDialog', { cardType: card.type });
    }
  }
</script>

{#if mechanics && mechanics.length > 0}
  <div class="mechanics-display" class:editable>
    <div class="mechanics-header">
      <span class="mechanics-title">Game Stats</span>
      {#if editable}
        <button 
          type="button" 
          class="edit-mechanics-btn"
          onclick={() => onedit?.()}
          title="Edit mechanics"
        >
          ✎
        </button>
      {/if}
    </div>
    
    <div class="mechanics-list">
      {#each mechanics as mechanic (mechanic.id)}
        <div class="mechanic-item">
          <div class="mechanic-line">
            <span class="mechanic-icon" title="{mechanic.type}">{getTypeIcon(mechanic.type)}</span>
            <span class="mechanic-name">{mechanic.name}:</span>
            <span class="mechanic-value">{mechanic.value}</span>
          </div>
          {#if shouldShowTrackingBoxes(mechanic)}
            <div class="tracking-boxes">
              {#each renderTrackingBoxes(Number(mechanic.value)) as box}
                <span class="tracking-box">□</span>
              {/each}
            </div>
          {/if}
          {#if mechanic.description}
            <div class="mechanic-description">{mechanic.description}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{:else if editable}
  <div class="mechanics-display empty" class:editable>
    <button 
      type="button" 
      class="add-mechanics-btn"
      onclick={handleAddStats}
      title="Add game mechanics"
    >
      + Add Game Stats
    </button>
  </div>
{/if}


<style>
  .mechanics-display {
    margin-bottom: var(--content-gap);
    font-size: 0.9em;
  }
  
  .mechanics-display.empty {
    text-align: center;
    padding: var(--content-gap);
    border: 1px dashed var(--theme-secondary);
    border-radius: var(--content-box-radius);
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  
  .mechanics-display.empty:hover {
    opacity: 1;
  }
  
  .mechanics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5em;
    padding-bottom: 0.25em;
    border-bottom: 1px solid var(--theme-secondary);
  }
  
  .mechanics-title {
    font-weight: var(--theme-title-weight);
    font-family: var(--theme-title-font);
    color: var(--theme-text);
    font-size: 1.1em;
  }
  
  .edit-mechanics-btn,
  .add-mechanics-btn {
    background: none;
    border: 1px solid var(--theme-secondary);
    border-radius: 3px;
    color: var(--theme-text);
    cursor: pointer;
    padding: 0.25em 0.5em;
    font-size: 0.85em;
    transition: all 0.2s;
    opacity: 0.7;
  }
  
  .edit-mechanics-btn:hover,
  .add-mechanics-btn:hover {
    opacity: 1;
    background: var(--theme-secondary);
    color: var(--theme-background);
  }
  
  .add-mechanics-btn {
    border-style: dashed;
    padding: 0.75em 1em;
    font-size: 0.9em;
  }
  
  .mechanics-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4em;
  }
  
  .mechanic-item {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
  }
  
  .mechanic-line {
    display: flex;
    align-items: center;
    gap: 0.3em;
  }
  
  .mechanic-icon {
    font-size: 0.9em;
    opacity: 0.8;
    flex-shrink: 0;
  }
  
  .mechanic-name {
    font-weight: 600;
    color: var(--theme-text);
    font-family: var(--theme-title-font);
    font-size: 0.95em;
    flex-shrink: 0;
  }
  
  .mechanic-value {
    font-weight: 500;
    color: var(--theme-primary);
    font-family: var(--theme-body-font);
  }
  
  .mechanic-description {
    font-style: italic;
    opacity: 0.8;
    font-size: 0.85em;
    color: var(--theme-text);
    margin-left: 1.2em;
  }
  
  .tracking-boxes {
    display: flex;
    gap: 0.1em;
    flex-wrap: wrap;
    margin-top: 0.1em;
  }
  
  .tracking-box {
    font-family: monospace;
    font-size: 0.8em;
    opacity: 0.7;
    line-height: 1;
  }
  
  @container (min-width: 63mm) {
    .mechanics-display {
      font-size: var(--trait-font-size);
    }
  }
  
  @media print {
    .edit-mechanics-btn,
    .add-mechanics-btn {
      display: none;
    }
    
    .mechanics-display.empty {
      display: none;
    }
  }
</style>
