<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { StatblockVocabulary } from '$lib/types';
  import { getDefaultConfig, configToSimpleVocabulary } from '$lib/statblockConfigs';

  interface Props {
    vocabulary?: StatblockVocabulary;
    title?: string;
  }

  const { vocabulary = configToSimpleVocabulary(getDefaultConfig()), title = "Customize Statblock Vocabulary" }: Props = $props();
  
  const dispatch = createEventDispatcher<{
    save: StatblockVocabulary;
    cancel: void;
  }>();

  // Create working copy of vocabulary
  let workingVocabulary = $state<StatblockVocabulary>({
    ...vocabulary
  });

  // Track custom stats (those not in default config)
  const defaultVocab = configToSimpleVocabulary(getDefaultConfig());
  const defaultStatKeys = Object.keys(defaultVocab);
  
  let customStats = $state<Array<{key: string, label: string}>>([]);

  // Initialize custom stats on mount
  $effect(() => {
    customStats = Object.entries(workingVocabulary)
      .filter(([key]) => !defaultStatKeys.includes(key))
      .map(([key, label]) => ({ key, label }));
  });

  function addCustomStat() {
    const newKey = `custom_${Date.now()}`;
    customStats = [...customStats, { key: newKey, label: '' }];
    workingVocabulary[newKey] = '';
  }

  function removeCustomStat(index: number) {
    const statToRemove = customStats[index];
    customStats = customStats.filter((_, i) => i !== index);
    delete workingVocabulary[statToRemove.key];
  }

  function updateCustomStat(index: number, newLabel: string) {
    customStats[index].label = newLabel;
    workingVocabulary[customStats[index].key] = newLabel;
  }

  function handleSave() {
    // Clean up any empty custom stats
    const cleanedVocabulary = { ...workingVocabulary };
    Object.keys(cleanedVocabulary).forEach(key => {
      const value = cleanedVocabulary[key];
      if (!defaultStatKeys.includes(key) && (!value || typeof value !== 'string' || !value.trim())) {
        delete cleanedVocabulary[key];
      }
    });
    
    dispatch('save', cleanedVocabulary);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function resetToDefaults() {
    workingVocabulary = { ...defaultVocab };
    customStats = [];
  }
</script>

<div class="vocabulary-editor">
  <h2>{title}</h2>
  
  <div class="editor-content">
    <div class="section">
      <h3>Default Stats</h3>
      <p class="section-description">Customize the names for standard character stats:</p>
      
      <div class="stats-grid">
        {#each Object.entries(defaultVocab) as [key, defaultLabel]}
          <div class="stat-field">
            <label for={key}>{defaultLabel}</label>
            <input
              id={key}
              type="text"
              bind:value={workingVocabulary[key]}
              placeholder={defaultLabel}
            />
          </div>
        {/each}
      </div>
    </div>

    <div class="section">
      <h3>Custom Stats</h3>
      <p class="section-description">Add additional stats specific to your game or setting:</p>
      
      <div class="custom-stats">
        {#each customStats as stat, index}
          <div class="custom-stat-field">
            <input
              type="text"
              bind:value={stat.label}
              oninput={(e) => updateCustomStat(index, e.target.value)}
              placeholder="Enter stat name (e.g., Stress, Sanity, Mana)"
            />
            <button
              class="remove-button"
              onclick={() => removeCustomStat(index)}
              title="Remove this custom stat"
            >
              ×
            </button>
          </div>
        {/each}
        
        <button class="add-stat-button" onclick={addCustomStat}>
          + Add Custom Stat
        </button>
      </div>
    </div>

    <div class="section">
      <h3>Preview</h3>
      <p class="section-description">Your customized stat names:</p>
      <div class="preview">
        {#each Object.entries(workingVocabulary) as [key, label]}
          {#if label && typeof label === 'string' && label.trim()}
            <span class="preview-stat">{label}</span>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <div class="editor-actions">
    <button class="secondary" onclick={resetToDefaults}>
      Reset to Defaults
    </button>
    <div class="main-actions">
      <button class="secondary" onclick={handleCancel}>
        Cancel
      </button>
      <button class="primary" onclick={handleSave}>
        Save Vocabulary
      </button>
    </div>
  </div>
</div>

<style>
  .vocabulary-editor {
    max-width: 800px;
    font-family: var(--ui-font-family);
  }

  .vocabulary-editor h2 {
    margin: 0 0 1.5rem 0;
    font-size: var(--ui-title-size);
    font-weight: 600;
    color: var(--ui-text);
  }

  .editor-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .section {
    border: 1px solid var(--ui-border);
    border-radius: 6px;
    padding: 1.5rem;
    background: var(--ui-bg-secondary, var(--ui-bg));
  }

  .section h3 {
    margin: 0 0 0.5rem 0;
    font-size: calc(var(--ui-font-size) * 1.1);
    font-weight: 600;
    color: var(--ui-text);
  }

  .section-description {
    margin: 0 0 1rem 0;
    color: var(--ui-muted);
    font-size: calc(var(--ui-font-size) * 0.9);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .stat-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-field label {
    font-size: calc(var(--ui-font-size) * 0.9);
    font-weight: 500;
    color: var(--ui-text);
  }

  .stat-field input,
  .custom-stat-field input {
    padding: 0.5rem;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    background: var(--ui-bg);
    color: var(--ui-text);
  }

  .stat-field input:focus,
  .custom-stat-field input:focus {
    outline: none;
    border-color: var(--button-primary-bg);
    box-shadow: 0 0 0 2px rgba(var(--button-primary-bg-rgb), 0.2);
  }

  .custom-stats {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .custom-stat-field {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .custom-stat-field input {
    flex: 1;
  }

  .remove-button {
    width: 32px;
    height: 32px;
    border: 1px solid var(--toast-error);
    border-radius: 4px;
    background: transparent;
    color: var(--toast-error);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .remove-button:hover {
    background: var(--toast-error);
    color: white;
  }

  .add-stat-button {
    padding: 0.75rem 1rem;
    border: 2px dashed var(--ui-border);
    border-radius: 4px;
    background: transparent;
    color: var(--ui-muted);
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-stat-button:hover {
    border-color: var(--button-primary-bg);
    color: var(--button-primary-bg);
    background: rgba(var(--button-primary-bg-rgb), 0.05);
  }

  .preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .preview-stat {
    padding: 0.25rem 0.5rem;
    background: var(--button-primary-bg);
    color: white;
    border-radius: 3px;
    font-size: calc(var(--ui-font-size) * 0.9);
  }

  .editor-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--ui-border);
  }

  .main-actions {
    display: flex;
    gap: 0.75rem;
  }

  button.primary {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--button-primary-bg);
    border-radius: 4px;
    background: var(--button-primary-bg);
    color: white;
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  button.primary:hover {
    background: var(--button-primary-hover-bg);
    border-color: var(--button-primary-hover-bg);
  }

  button.secondary {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--button-border);
    border-radius: 4px;
    background: var(--button-bg);
    color: var(--button-text);
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
    cursor: pointer;
    transition: all 0.2s;
  }

  button.secondary:hover {
    background: var(--button-hover-bg);
    border-color: var(--button-primary-bg);
  }
</style>
