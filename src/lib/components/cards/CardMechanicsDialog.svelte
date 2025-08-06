<script lang="ts">
  import type { Card } from '../../types';
  import { canonUpdateCard, isFieldLoading } from '../../stores/canonUpdate';
  import CardMechanicsEditor from './CardMechanicsEditor.svelte';
  
  const props = $props<{
    card: Card;
    onclose?: () => void;
  }>();
  const card = props.card;
  const onclose = props.onclose;
  
  let dialogElement = $state<HTMLDialogElement | null>(null);
  
  // Show dialog when mounted
  $effect(() => {
    if (dialogElement && !dialogElement.open) {
      dialogElement.showModal();
    }
  });
  
  const isMechanicsUpdating = $derived(isFieldLoading('card-mechanics'));
  
  async function handleSave(updatedCard: Card) {
    const success = await canonUpdateCard(
      card.id,
      { mechanics: updatedCard.mechanics },
      ['card-mechanics'],
      'Updating mechanics...',
      'Mechanics updated successfully'
    );
    
    if (success) {
      handleClose();
    }
  }
  
  function handleClose() {
    if (isMechanicsUpdating) return;
    dialogElement?.close();
    onclose?.();
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
      onsave={handleSave}
    />
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
    border-bottom: 1px solid var(--color-border);
  }
  
  .dialog-header h2 {
    margin: 0;
    color: var(--color-text);
    font-family: var(--ui-font-family);
  }
  
  .close-button {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text);
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
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
  }
  
  .close-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
