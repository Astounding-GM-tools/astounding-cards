<!-- PrintInstructions.svelte -->
<script lang="ts">
  import { currentDeck } from '$lib/stores/deck';
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
      <li>Enable background graphics (required for card images)</li>
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
      <li>Front and back of each card are aligned to match when printed correctly</li>
      <li>For duplex (double-sided) printers:
        <ul>
          <li>Enable double-sided printing in your printer settings</li>
          <li>Print will automatically align front and back of each card</li>
        </ul>
      </li>
      <li>For manual double-sided printing:
        <ul>
          <li>Print even-numbered pages first (back sides)</li>
          <li>Place printed sheets back in printer:
            <ul>
              <li>Blank side facing up</li>
              <li>First sheet on top of stack</li>
              <li>Top of page closest to paper feed</li>
            </ul>
          </li>
          <li>Print odd-numbered pages (front sides)</li>
          <li>Do a test print first to verify paper orientation</li>
        </ul>
      </li>
      <li>Cut along crop marks after printing is complete</li>
    </ul>

    <h3>Tips</h3>
    <ul>
      <li>Always do a test print with regular paper first</li>
      <li>Verify front/back alignment before using cardstock</li>
      <li>Use thicker paper (160-200 gsm) for best results</li>
      <li>Print in grayscale/black & white to save color ink</li>
      <li>
        {#if $currentDeck?.meta.cardSize === 'poker'}
          Cards will be standard poker size (2.5" × 3.5" / 63mm × 88mm)
        {:else}
          Cards will be larger tarot size (approximately 3.75" × 5.25" / 95mm × 133mm)
        {/if}
      </li>
    </ul>

    <h3>Player Handouts vs GM Reference</h3>
    <ul>
      <li>For player handouts: Print odd-numbered pages only (front cards)</li>
      <li>For GM reference: Print all pages (complete double-sided cards)</li>
      <li>Front cards contain observable information</li>
      <li>Back cards contain GM-only information (stats, secrets, etc.)</li>
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
    background: var(--dialog-bg);
    color: var(--ui-text);
    font-family: var(--ui-font-family);
  }

  .print-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--ui-spacing);
    background: var(--ui-hover-bg);
    border-bottom: 1px solid var(--ui-border);
    border-radius: 8px 8px 0 0;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: var(--ui-title-size);
    font-family: var(--ui-font-family);
    color: var(--ui-text);
  }

  .close-button {
    background: none;
    border: none;
    font-size: var(--ui-title-size);
    font-family: var(--ui-font-family);
    color: var(--ui-muted);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .close-button:hover {
    background: var(--ui-active-bg);
    color: var(--ui-text);
  }

  .dialog-content {
    padding: var(--ui-spacing);
    overflow-y: auto;
    max-height: calc(90vh - 4rem);
    font-family: var(--ui-font-family);
    font-size: var(--ui-font-size);
  }

  h3 {
    color: var(--button-primary-bg);
    margin: 1.5rem 0 0.5rem;
    font-size: calc(var(--ui-font-size) * 1.1);
    font-family: var(--ui-font-family);
    font-weight: 600;
  }

  h3:first-child {
    margin-top: 0;
  }

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
    font-family: var(--ui-font-family);
  }

  li {
    margin: 0.5rem 0;
    line-height: 1.4;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
  }

  p {
    margin: 0.5rem 0;
    line-height: 1.4;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
  }

  strong {
    color: var(--button-primary-bg);
    font-family: var(--ui-font-family);
    font-weight: 600;
  }

  ul ul {
    margin: 0.25rem 0 0.25rem 1rem;
  }

  ul ul ul {
    margin: 0.25rem 0 0.25rem 1.5rem;
    list-style-type: circle;
  }
</style> 