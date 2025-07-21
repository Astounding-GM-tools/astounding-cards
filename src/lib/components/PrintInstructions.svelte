<!-- PrintInstructions.svelte -->
<script lang="ts">
  import { currentDeck } from '$lib/stores/cards';
  export let dialog: HTMLDialogElement;
</script>

<dialog 
  bind:this={dialog}
  class="print-dialog"
>
  <div class="dialog-header">
    <h2>🖨️ Print Instructions</h2>
    <button 
      class="close-button"
      onclick={() => dialog.close()}
    >
      ×
    </button>
  </div>
  <div class="dialog-content">
    <h3>Printer Settings</h3>
    <ul>
      <li>Set paper size to A4, US Letter, or Legal</li>
      <li>Set orientation to Portrait</li>
      <li>Set scale to 100% (no scaling)</li>
      <li>Set margins to None or Minimum</li>
      <li>Enable background graphics</li>
    </ul>

    <h3>Card Layout</h3>
    <p>
      Current size: <strong>{$currentDeck?.meta.cardSize === 'poker' ? 'Poker' : 'Tarot'}</strong>
      {#if $currentDeck?.meta.cardSize === 'poker'}
        (9 cards per page, standard playing card size)
      {:else}
        (4 cards per page, larger size for better readability)
      {/if}
    </p>
    <ul>
      <li>Front and back pages are automatically aligned for double-sided printing</li>
      <li>Each page has 4mm margins for printer safety</li>
      <li>Crop marks show where to cut</li>
      <li>Pages are automatically paginated for any number of cards</li>
    </ul>

    <h3>Paper Handling</h3>
    <ul>
      <li>Print front pages first</li>
      <li>Flip paper according to your printer's instructions</li>
      <li>Print back pages</li>
      <li>Cut along crop marks</li>
    </ul>

    <h3>Tips</h3>
    <ul>
      <li>Do a test print with regular paper first</li>
      <li>Check alignment before printing on cardstock</li>
      <li>Use thicker paper (160-200 gsm) for best results</li>
      <li>
        {#if $currentDeck?.meta.cardSize === 'poker'}
          Cards will be standard poker size (2.5" × 3.5" / 63mm × 88mm)
        {:else}
          Cards will be larger tarot size (approximately 3.75" × 5.25" / 95mm × 133mm)
        {/if}
      </li>
    </ul>
  </div>
</dialog>

<style>
  .print-dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    max-width: 90vw;
    max-height: 90vh;
    width: 600px;
  }

  .print-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #eee;
    border-radius: 8px 8px 0 0;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #666;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .close-button:hover {
    background: #e8e8e8;
    color: #333;
  }

  .dialog-content {
    padding: 1rem;
    overflow-y: auto;
    max-height: calc(90vh - 4rem);
  }

  h3 {
    color: #2196f3;
    margin: 1.5rem 0 0.5rem;
    font-size: 1.1rem;
  }

  h3:first-child {
    margin-top: 0;
  }

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.5rem 0;
    line-height: 1.4;
  }

  p {
    margin: 0.5rem 0;
    line-height: 1.4;
  }

  strong {
    color: #1976d2;
  }
</style> 