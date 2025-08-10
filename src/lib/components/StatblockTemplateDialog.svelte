<!-- Template Selection Dialog for adding contextual stats -->
<script lang="ts">
  import type { StatblockTemplate } from '../statblockTemplates';
  import { getTemplatesByCategory } from '../statblockTemplates';
  import { createEventDispatcher } from 'svelte';
  import { currentDeck } from '../stores/deck';
  import { configActions } from '../stores/statblockConfig';
  import { configToSimpleVocabulary } from '../statblockConfigs';
  import type { StatblockVocabulary } from '../types';
  
  let { 
    show = $bindable(),
    cardType = '' 
  }: {
    show: boolean;
    cardType?: string;
  } = $props();
  
  const dispatch = createEventDispatcher<{
    select: StatblockTemplate;
    custom: void;
    cancel: void;
  }>();
  
  let selectedTemplate: StatblockTemplate | null = $state(null);
  let selectedCategory: StatblockTemplate['category'] = $state('character');
  let dialogElement = $state<HTMLDialogElement | null>(null);
  let vocabulary: StatblockVocabulary | null = $state(null);
  
  // Show dialog when show becomes true
  $effect(() => {
    if (show && dialogElement && !dialogElement.open) {
      dialogElement.showModal();
    }
  });
  
  // Load vocabulary when dialog shows
  $effect(() => {
    if (show) {
      const deckConfigId = $currentDeck?.meta?.statblockConfigId;
      if (deckConfigId) {
        configActions.getByIdOrDefault(deckConfigId)
          .then(deckConfig => {
            vocabulary = configToSimpleVocabulary(deckConfig);
          })
          .catch(error => {
            console.error('Failed to load vocabulary for preview:', error);
            vocabulary = null;
          });
      } else {
        vocabulary = null;
      }
    }
  });
  
  // Get templates by category
  const categories = [
    { key: 'character', label: 'Character', icon: '👤' },
    { key: 'item', label: 'Item', icon: '⚔️' },
    { key: 'spell', label: 'Ability', icon: '✨' },
    { key: 'other', label: 'Custom', icon: '📋' }
  ] as const;
  
  const templatesForCategory = $derived(
    selectedCategory === 'other' ? [] : getTemplatesByCategory(selectedCategory)
  );
  
  // Auto-select category based on card type if available
  $effect(() => {
    if (cardType) {
      const typeMap: Record<string, StatblockTemplate['category']> = {
        'character': 'character',
        'creature': 'character', // Map creatures to character category
        'item': 'item',
        'spell': 'spell'
      };
      selectedCategory = typeMap[cardType.toLowerCase()] || 'character';
    }
  });
  
  function selectTemplate(template: StatblockTemplate) {
    selectedTemplate = template;
  }
  
  function confirmSelection() {
    if (selectedTemplate) {
      dispatch('select', selectedTemplate);
    } else if (selectedCategory === 'other') {
      dispatch('custom');
    }
    closeDialog();
  }
  
  function createCustom() {
    dispatch('custom');
    closeDialog();
  }
  
  function closeDialog() {
    dialogElement?.close();
    show = false;
    selectedTemplate = null;
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('cancel');
      closeDialog();
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <dialog 
    class="template-dialog"
    bind:this={dialogElement}
    onkeydown={handleKeydown}
    onclose={closeDialog}
  >
    <div class="dialog-content">
      <header class="dialog-header">
        <h2>Add Game Stats</h2>
        <p>Choose a template to quickly add relevant stats for your card:</p>
      </header>
      
      <div class="template-selector">
        <!-- Category Selection -->
        <div class="category-tabs">
          {#each categories as category}
            <button
              class="category-tab"
              class:active={selectedCategory === category.key}
              onclick={() => { selectedCategory = category.key; selectedTemplate = null; }}
            >
              <span class="category-icon">{category.icon}</span>
              <span class="category-label">{category.label}</span>
            </button>
          {/each}
        </div>
        
        <!-- Template Grid -->
        <div class="templates-section">
          {#if selectedCategory === 'other'}
            <div class="custom-option">
              <div 
                class="custom-card" 
                onclick={createCustom}
                onkeydown={(e) => e.key === 'Enter' && createCustom()}
                role="button"
                tabindex="0"
              >
                <div class="template-icon">📋</div>
                <div class="template-info">
                  <div class="template-name">Start from Scratch</div>
                  <div class="template-description">Create custom stats manually</div>
                </div>
              </div>
            </div>
          {:else}
            <div class="template-grid">
              {#each templatesForCategory as template (template.id)}
                <div 
                  class="template-card"
                  class:selected={selectedTemplate?.id === template.id}
                  onclick={() => selectTemplate(template)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => e.key === 'Enter' && selectTemplate(template)}
                >
                  <div class="template-icon">{template.icon}</div>
                  <div class="template-info">
                    <div class="template-name">{template.name}</div>
                    <div class="template-description">{template.description}</div>
                    <div class="template-stats-count">
                      {template.mechanics.length} stats included
                    </div>
                  </div>
                </div>
              {/each}
            </div>
            
            {#if templatesForCategory.length === 0}
              <div class="empty-category">
                <p>No templates available for this category yet.</p>
                <button class="btn btn-ghost" onclick={createCustom}>
                  Create custom stats instead
                </button>
              </div>
            {/if}
          {/if}
        </div>
      </div>
      
      <!-- Preview selected template -->
      {#if selectedTemplate}
        <div class="template-preview">
          <h3>Preview: {selectedTemplate.name}</h3>
          <div class="preview-stats">
            {#each selectedTemplate.mechanics as mechanic}
              <div class="preview-stat">
                <span class="stat-name">{vocabulary?.[mechanic.type] || mechanic.name}:</span>
                <span class="stat-value">{mechanic.value}</span>
                {#if mechanic.description}
                  <span class="stat-description">({mechanic.description})</span>
                {/if}
                {#if mechanic.tracked}
                  <span class="stat-tracked">📦</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <div class="dialog-actions">
        <button class="btn btn-ghost" onclick={() => { dispatch('cancel'); closeDialog(); }}>
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          onclick={confirmSelection}
          disabled={!selectedTemplate && selectedCategory !== 'other'}
        >
          {#if selectedCategory === 'other'}
            Create Custom
          {:else if selectedTemplate}
            Add {selectedTemplate.mechanics.length} Stats
          {:else}
            Select Template
          {/if}
        </button>
      </div>
    </div>
  </dialog>
{/if}

<style>
  .template-dialog {
    max-width: 800px;
    max-height: 90vh;
    width: 90vw;
    margin: auto;
    padding: 0;
    border: 1px solid var(--ui-border);
    border-radius: 12px;
    background: var(--ui-bg);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }
  
  .template-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
  
  .dialog-content {
    padding: 2rem;
    overflow-y: auto;
    max-height: calc(90vh - 2rem);
  }
  
  .dialog-header {
    margin-bottom: 2rem;
  }
  
  .dialog-header h2 {
    margin: 0 0 0.5rem 0;
    color: var(--ui-text);
    font-size: 1.5rem;
    font-family: var(--ui-font-family);
  }
  
  .dialog-header p {
    margin: 0;
    color: var(--ui-muted);
    line-height: 1.5;
  }
  
  .category-tabs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
    margin-bottom: 2rem;
  }
  
  .category-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 0.5rem;
    border: 1px solid var(--button-border);
    border-radius: 8px;
    background: var(--button-bg);
    color: var(--button-text);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .category-tab:hover {
    background: var(--button-hover-bg);
    color: var(--ui-text);
  }
  
  .category-tab.active {
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
    border-color: var(--button-primary-bg);
  }
  
  .category-icon {
    font-size: 1.5rem;
  }
  
  .category-label {
    font-size: 0.875rem;
    text-align: center;
    font-weight: 500;
  }
  
  .templates-section {
    margin-bottom: 2rem;
  }
  
  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  
  .template-card,
  .custom-card {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border: 1px solid var(--ui-border);
    border-radius: 8px;
    background: var(--ui-bg);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .template-card:hover,
  .custom-card:hover {
    background: var(--ui-hover-bg);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .template-card.selected {
    border-color: var(--button-primary-bg);
    background: var(--ui-hover-bg);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .custom-option {
    display: flex;
    justify-content: center;
  }
  
  .custom-card {
    max-width: 400px;
    justify-content: center;
    text-align: center;
  }
  
  .template-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .template-info {
    flex: 1;
  }
  
  .template-name {
    font-weight: 600;
    color: var(--ui-text);
    margin-bottom: 0.25rem;
  }
  
  .template-description {
    color: var(--ui-muted);
    font-size: 0.875rem;
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }
  
  .template-stats-count {
    color: var(--ui-muted);
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .empty-category {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--ui-muted);
  }
  
  .template-preview {
    background: var(--ui-hover-bg);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .template-preview h3 {
    margin: 0 0 1rem 0;
    color: var(--ui-text);
    font-size: 1.1rem;
  }
  
  .preview-stats {
    display: grid;
    gap: 0.5rem;
  }
  
  .preview-stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .stat-name {
    font-weight: 600;
    color: var(--ui-text);
    min-width: 120px;
  }
  
  .stat-value {
    font-weight: 500;
    color: var(--button-primary-bg);
  }
  
  .stat-description {
    font-style: italic;
    color: var(--ui-muted);
    font-size: 0.8rem;
  }
  
  .stat-tracked {
    margin-left: auto;
    opacity: 0.6;
    font-size: 0.75rem;
  }
  
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--ui-border);
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  .btn-ghost {
    background: var(--button-bg);
    color: var(--button-text);
    border: 1px solid var(--button-border);
  }
  
  .btn-ghost:hover {
    background: var(--button-hover-bg);
    color: var(--ui-text);
  }
  
  .btn-primary {
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--button-primary-hover);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
