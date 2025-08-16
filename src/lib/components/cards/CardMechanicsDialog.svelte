<script lang="ts">
  import type { Card } from '../../types';
  import { isFieldLoading } from '../../stores/canonUpdate';
  import CardMechanicsEditor from './CardMechanicsEditor.svelte';
  import {
    initializeMechanicsDialogState,
    handleSaveAndClose as handleSaveAndCloseLogic,
    handleClose as handleCloseLogic,
    type MechanicsDialogState
  } from './CardMechanicsDialog.svelte.ts';
  
  const props = $props<{
    card: Card;
    onclose?: () => void;
  }>();
  const card = props.card;
  const onclose = props.onclose;
  
  let dialogElement: HTMLDialogElement | null = null;
  let state: MechanicsDialogState = initializeMechanicsDialogState();
  
  // Show dialog when mounted
  $effect(() => {
    if (dialogElement && !dialogElement.open) {
      dialogElement.showModal();
    }
  });
  
  const isMechanicsUpdating = $derived(isFieldLoading('card-mechanics'));
  
  async function handleSaveAndClose() {
    await handleSaveAndCloseLogic(card, state, isMechanicsUpdating, onclose);
  }
  
  function handleClose() {
    handleCloseLogic(dialogElement, isMechanicsUpdating, onclose);
  }
</script>

<dialog 
  bind:this={dialogElement}
  class="mechanics-dialog"
  onclose={handleClose}
>
  <div class="dialog-content">
    <div class="dialog-header">
      <h2>Edit Card Mechanics</h2>
      <button 
        class="close-button"
        onclick={handleClose}
        disabled={isMechanicsUpdating}
        aria-label="Close"
      >
        ×
      </button>
    </div>
    
    <CardMechanicsEditor 
      {card}
      loading={isMechanicsUpdating}
      bind:hasChanges={state.hasChanges}
      bind:editedCard={state.editedCard}
    />
    
    <div class="dialog-actions">
      <button 
        class="cancel-button"
        onclick={handleClose}
        disabled={isMechanicsUpdating}
      >
        Cancel
      </button>
      
      <button 
        class="save-button"
        onclick={handleSaveAndClose}
        disabled={!state.hasChanges || isMechanicsUpdating}
      >
        {isMechanicsUpdating ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </div>
</dialog>

<style>
  .mechanics-dialog {
    width: 90vw;
    max-width: 700px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 1.5rem;
    border: none;
    border-radius: 8px;
    background: var(--ui-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .mechanics-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
  
  .dialog-content {
    padding: 0;
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--ui-border);
  }
  
  .dialog-header h2 {
    margin: 0;
    color: var(--ui-text);
    font-family: var(--ui-font-family);
  }
  
  .close-button {
    background: none;
    border: 1px solid var(--button-border);
    border-radius: 4px;
    color: var(--ui-text);
    cursor: pointer;
    padding: 0.5rem;
    font-size: 1.25rem;
    line-height: 1;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .close-button:hover:not(:disabled) {
    background: var(--ui-hover-bg);
    border-color: var(--button-primary-bg);
  }
  
  .close-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--ui-border);
  }
  
  .cancel-button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--button-border);
    border-radius: 6px;
    background: var(--button-bg);
    color: var(--button-text);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .cancel-button:hover:not(:disabled) {
    background: var(--button-hover-bg);
    border-color: var(--ui-muted);
  }
  
  .cancel-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .save-button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--button-primary-bg);
    border-radius: 6px;
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .save-button:hover:not(:disabled) {
    background: var(--button-primary-hover);
  }
  
  .save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
