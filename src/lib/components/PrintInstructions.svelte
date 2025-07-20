<!-- PrintInstructions.svelte -->
<script lang="ts">
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
    <section>
      <h3>Printer Settings</h3>
      <ul>
        <li>Paper Size: A4</li>
        <li>Orientation: Portrait</li>
        <li>Scale: 100% (Do not "Fit to page")</li>
        <li>Margins: None/Minimum</li>
        <li>Double-sided: Long-edge binding</li>
      </ul>
    </section>

    <section>
      <h3>Important Notes</h3>
      <ul>
        <li>Most printers have a minimum margin of 6.35mm - the crop marks will help you align the cards correctly.</li>
        <li>For best results, use card stock paper (160-200gsm).</li>
        <li>Test print a single page first to verify alignment.</li>
        <li>When cutting, use the crop marks as guides - they're designed to be visible even with printer margins.</li>
      </ul>
    </section>

    <section>
      <h3>Card Dimensions</h3>
      <ul>
        <li>Each card is standard poker size: 63.5mm × 88.9mm</li>
        <li>9 cards per page, arranged in a 3×3 grid</li>
        <li>Back sides are automatically arranged to match when printed double-sided</li>
      </ul>
    </section>
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

  section {
    margin-bottom: 1.5rem;
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    color: #333;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    line-height: 1.5;
  }

  li {
    margin-bottom: 0.5rem;
  }
</style> 