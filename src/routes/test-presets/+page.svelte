<!-- Test page for Game Preset System -->
<script lang="ts">
  import GamePresetSelector from '$lib/components/GamePresetSelector.svelte';
  import { toasts } from '$lib/stores/toast';
  import { presetActions } from '$lib/stores/gamePresets';
  import type { GamePreset } from '$lib/types';
  
  let selectedPreset: GamePreset | null = null;
  let showDuplicateDialog = false;
  let duplicateName = '';
  let duplicateSource: GamePreset | null = null;
  
  // Handle preset selection
  function handlePresetSelect(event: CustomEvent<GamePreset>) {
    selectedPreset = event.detail;
    console.log('Selected preset:', selectedPreset);
  }
  
  // Handle creating new preset
  function handleCreatePreset() {
    console.log('Creating new preset...');
    toasts.info('Custom preset creation will be implemented soon!');
  }
  
  // Handle duplicating preset
  function handleDuplicatePreset(event: CustomEvent<GamePreset>) {
    duplicateSource = event.detail;
    duplicateName = `${event.detail.name} (Copy)`;
    showDuplicateDialog = true;
  }
  
  // Confirm duplication
  async function confirmDuplicate() {
    if (!duplicateSource || !duplicateName.trim()) return;
    
    try {
      const duplicated = await presetActions.duplicate(duplicateSource.id, duplicateName.trim());
      if (duplicated) {
        toasts.success(`Created "${duplicated.name}" successfully`);
        selectedPreset = duplicated;
      }
    } catch (error) {
      toasts.error('Could not duplicate preset');
      console.error('Failed to duplicate preset:', error);
    } finally {
      showDuplicateDialog = false;
      duplicateSource = null;
      duplicateName = '';
    }
  }
  
  // Cancel duplication
  function cancelDuplicate() {
    showDuplicateDialog = false;
    duplicateSource = null;
    duplicateName = '';
  }
</script>

<div class="test-page">
  <header class="page-header">
    <h1>Game Preset System Test</h1>
    <p>This page demonstrates the game preset selection and management functionality.</p>
  </header>
  
  <div class="content">
    <div class="preset-section">
      <GamePresetSelector
        selectedPresetId={selectedPreset?.id || null}
        on:select={handlePresetSelect}
        on:create={handleCreatePreset}
        on:duplicate={handleDuplicatePreset}
      />
    </div>
    
    {#if selectedPreset}
      <div class="selected-preset">
        <h2>Selected Preset: {selectedPreset.name}</h2>
        
        <div class="preset-details">
          <div class="detail-section">
            <h3>Metadata</h3>
            <ul>
              <li><strong>Version:</strong> {selectedPreset.version}</li>
              <li><strong>Author:</strong> {selectedPreset.author || 'Unknown'}</li>
              <li><strong>Tags:</strong> {selectedPreset.tags.join(', ')}</li>
              <li><strong>Official:</strong> {selectedPreset.isOfficial ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          
          <div class="detail-section">
            <h3>Front Card Stats ({selectedPreset.frontStats.length})</h3>
            <div class="stats-grid">
              {#each selectedPreset.frontStats as stat}
                <div class="stat-item">
                  <div class="stat-icon">
                    <img src="/icons/{stat.icon}.svg" alt={stat.label} />
                  </div>
                  <div class="stat-info">
                    <div class="stat-label">{stat.label}</div>
                    <div class="stat-category">{stat.category}</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Back Card Mechanics ({selectedPreset.backMechanics.length})</h3>
            <div class="mechanics-grid">
              {#each selectedPreset.backMechanics as mechanic}
                <div class="mechanic-item">
                  <div class="mechanic-info">
                    <div class="mechanic-label">{mechanic.name}</div>
                    <div class="mechanic-type">{mechanic.type}</div>
                    <div class="mechanic-value">Value: {mechanic.value}</div>
                    {#if mechanic.description}
                      <div class="mechanic-description">{mechanic.description}</div>
                    {/if}
                    <div class="mechanic-tracked">Tracked: {mechanic.tracked ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Duplicate Dialog -->
{#if showDuplicateDialog}
  <div class="modal-overlay">
    <div class="modal">
      <h3>Duplicate Preset</h3>
      <p>Create a copy of "{duplicateSource?.name}":</p>
      
      <label>
        New Preset Name:
        <input 
          type="text" 
          bind:value={duplicateName}
          placeholder="Enter preset name..."
        />
      </label>
      
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick={cancelDuplicate}>Cancel</button>
        <button 
          class="btn btn-primary" 
          onclick={confirmDuplicate}
          disabled={!duplicateName.trim()}
        >
          Duplicate
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .test-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .page-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }
  
  .page-header p {
    font-size: 1.1rem;
    color: var(--text-muted);
  }
  
  .content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .preset-section {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }
  
  .selected-preset {
    background: var(--primary-bg);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--primary-color);
  }
  
  .selected-preset h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: var(--primary-color);
  }
  
  .preset-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .detail-section h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  .stats-grid,
  .mechanics-grid {
    display: grid;
    gap: 1rem;
  }
  
  .stat-item,
  .mechanic-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--card-bg);
    border-radius: 6px;
    border: 1px solid var(--border-color);
  }
  
  .stat-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
  
  .stat-icon img {
    width: 100%;
    height: 100%;
    filter: var(--icon-filter);
  }
  
  .stat-info,
  .mechanic-info {
    min-width: 0;
  }
  
  .stat-label,
  .mechanic-label {
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .stat-category,
  .mechanic-type {
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    max-width: 400px;
    width: 90%;
  }
  
  .modal h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .modal label {
    display: block;
    margin: 1rem 0;
  }
  
  .modal input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 1rem;
    margin-top: 0.5rem;
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background: var(--primary-color);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: var(--secondary-color);
    color: var(--secondary-text);
  }
  
  .btn-secondary:hover {
    background: var(--secondary-hover);
  }
</style>
