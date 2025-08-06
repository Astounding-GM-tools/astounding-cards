<!-- Game Preset Selector Component -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { gamePresets, officialPresets, customPresets, presetsLoading, presetActions } from '../stores/gamePresets';
  import type { GamePreset } from '../types';
  
const props = $props<{
    selectedPresetId?: string | null;
    showCreateButton?: boolean;
    showDuplicateButton?: boolean;
  }>();
  const selectedPresetId = $derived(props.selectedPresetId ?? null);
  const showCreateButton = props.showCreateButton ?? true;
  const showDuplicateButton = props.showDuplicateButton ?? true;
  
  const dispatch = createEventDispatcher<{
    select: GamePreset;
    create: void;
    duplicate: GamePreset;
  }>();
  
  let showCustom = $state(false);
  
  // Handle preset selection
  function selectPreset(preset: GamePreset) {
    dispatch('select', preset);
  }
  
  // Handle creating new preset
  function createNewPreset() {
    dispatch('create');
  }
  
  // Handle duplicating preset
  function duplicatePreset(preset: GamePreset) {
    dispatch('duplicate', preset);
  }
  
  // Format tags for display
  function formatTags(tags: string[]): string {
    return tags.join(', ');
  }
  
  // Get icon for preset based on tags
  function getPresetIcon(preset: GamePreset): string {
    if (preset.tags.includes('fantasy')) return '🐉';
    if (preset.tags.includes('sci-fi')) return '🚀';
    if (preset.tags.includes('horror')) return '👻';
    if (preset.tags.includes('modern')) return '🏢';
    if (preset.tags.includes('pbta')) return '📖';
    if (preset.tags.includes('old-school')) return '📜';
    return '🎲';
  }
</script>

<div class="preset-selector">
  <div class="section-header">
    <h3>Game System Presets</h3>
    {#if showCreateButton}
      <button 
        class="btn btn-secondary btn-sm"
        onclick={createNewPreset}
      >
        ➕ Create Custom
      </button>
    {/if}
  </div>
  
  {#if $presetsLoading}
    <div class="loading">Loading presets...</div>
  {:else}
    <!-- Official Presets -->
    <div class="preset-section">
      <h4>Official Systems</h4>
      <div class="preset-grid">
        {#each $officialPresets as preset (preset.id)}
          <div 
            class="preset-card"
            class:selected={selectedPresetId === preset.id}
            onclick={() => selectPreset(preset)}
            onkeydown={(e) => e.key === 'Enter' && selectPreset(preset)}
            role="button"
            tabindex="0"
          >
            <div class="preset-icon">{getPresetIcon(preset)}</div>
            <div class="preset-info">
              <div class="preset-name">{preset.name}</div>
              <div class="preset-description">{preset.description}</div>
              <div class="preset-stats">
                <span class="stat-count">
                  {preset.frontStats.length} stats, {preset.backMechanics.length} mechanics
                </span>
              </div>
              <div class="preset-tags">{formatTags(preset.tags)}</div>
            </div>
            {#if showDuplicateButton}
              <button 
                class="duplicate-btn"
                onclick={(e) => { e.stopPropagation(); duplicatePreset(preset); }}
                title="Duplicate this preset"
              >
                📋
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Custom Presets -->
    {#if $customPresets.length > 0 || showCustom}
      <div class="preset-section">
        <div class="section-toggle">
          <h4>Custom Systems</h4>
          <button 
            class="btn btn-ghost btn-sm"
            onclick={() => showCustom = !showCustom}
          >
            {showCustom ? '▲' : '▼'}
          </button>
        </div>
        
        {#if showCustom}
          <div class="preset-grid">
            {#each $customPresets as preset (preset.id)}
              <div 
                class="preset-card"
                class:selected={selectedPresetId === preset.id}
                onclick={() => selectPreset(preset)}
                onkeydown={(e) => e.key === 'Enter' && selectPreset(preset)}
                role="button"
                tabindex="0"
              >
                <div class="preset-icon">{getPresetIcon(preset)}</div>
                <div class="preset-info">
                  <div class="preset-name">{preset.name}</div>
                  <div class="preset-description">{preset.description || 'Custom preset'}</div>
                  <div class="preset-stats">
                    <span class="stat-count">
                      {preset.frontStats.length} stats, {preset.backMechanics.length} mechanics
                    </span>
                  </div>
                  {#if preset.author}
                    <div class="preset-author">by {preset.author}</div>
                  {/if}
                </div>
                {#if showDuplicateButton}
                  <button 
                    class="duplicate-btn"
                    onclick={(e) => { e.stopPropagation(); duplicatePreset(preset); }}
                    title="Duplicate this preset"
                  >
                    📋
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .preset-selector {
    width: 100%;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .section-header h3 {
    margin: 0;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }
  
  .preset-section {
    margin-bottom: 2rem;
  }
  
  .section-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .section-toggle h4 {
    margin: 0;
  }
  
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .preset-card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    background: var(--card-bg);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .preset-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .preset-card.selected {
    border-color: var(--primary-color);
    background: var(--primary-bg);
    box-shadow: 0 0 0 1px var(--primary-color);
  }
  
  .preset-icon {
    font-size: 2rem;
    min-width: 2rem;
    text-align: center;
  }
  
  .preset-info {
    flex: 1;
    min-width: 0;
  }
  
  .preset-name {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
    color: var(--text-primary);
  }
  
  .preset-description {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }
  
  .preset-stats {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  
  .preset-tags {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: lowercase;
  }
  
  .preset-author {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
  }
  
  .duplicate-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
    padding: 0.25rem;
    border-radius: 4px;
  }
  
  .preset-card:hover .duplicate-btn {
    opacity: 1;
  }
  
  .duplicate-btn:hover {
    background: var(--secondary-bg);
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-secondary {
    background: var(--secondary-color);
    color: var(--secondary-text);
  }
  
  .btn-secondary:hover {
    background: var(--secondary-hover);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-color);
  }
  
  .btn-ghost:hover {
    background: var(--secondary-bg);
  }
  
  .btn-sm {
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
  }
</style>
