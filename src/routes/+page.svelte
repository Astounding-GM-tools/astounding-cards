<script lang="ts">
  let showCropMarks = true;

  // Function to get the corresponding back position for a card
  function getBackPosition(frontPosition: number): number {
    // When flipping on long edge, columns reverse but rows stay the same
    // Example: 1->3, 2->2, 3->1, 4->6, 5->5, 6->4, 7->9, 8->8, 9->7
    const row = Math.floor((frontPosition - 1) / 3); // 0-based row number
    const col = (frontPosition - 1) % 3; // 0-based column number
    return row * 3 + (2 - col) + 1; // Reverse column position within same row
  }
</script>

<div class="print-container">
  <!-- Print settings -->
  <div class="settings no-print">
    <label>
      <input type="checkbox" bind:checked={showCropMarks}>
      Show crop marks
    </label>
    <div class="print-info">
      Print double-sided, flip on long edge (like a book)
    </div>
  </div>

  <!-- Front page -->
  <div class="page">
    <div class="card-grid" class:show-crop-marks={showCropMarks}>
      {#each Array(9) as _, i}
        <div class="card front">
          <div class="card-inner">
            Card Front {i + 1}
            <div class="position-debug">Position: {i + 1}</div>
          </div>
          {#if showCropMarks}
            <div class="crop-marks">
              <div class="mark top"></div>
              <div class="mark right"></div>
              <div class="mark bottom"></div>
              <div class="mark left"></div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Back page -->
  <div class="page">
    <div class="card-grid" class:show-crop-marks={showCropMarks}>
      {#each Array(9) as _, i}
        {@const backNumber = getBackPosition(i + 1)}
        <div class="card back">
          <div class="card-inner">
            Back of Card {backNumber}
            <div class="position-debug">Position: {i + 1}, Back of: {backNumber}</div>
          </div>
          {#if showCropMarks}
            <div class="crop-marks">
              <div class="mark top"></div>
              <div class="mark right"></div>
              <div class="mark bottom"></div>
              <div class="mark left"></div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  /* Print settings */
  .settings {
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .print-info {
    margin-top: 0.5rem;
    font-style: italic;
    color: #666;
  }

  /* A4 page setup */
  .page {
    width: 210mm;
    height: 297mm;
    padding: 8mm;
    margin: 0 auto 2rem;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    position: relative;
  }

  /* Card grid */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 63.5mm);
    grid-template-rows: repeat(3, 88.9mm);
    gap: 5mm;
    justify-content: center;
    padding-top: 5mm;
  }

  .card {
    position: relative;
    width: 63.5mm;
    height: 88.9mm;
    background: white;
    border: 1px solid #ddd;
  }

  .card-inner {
    padding: 3mm;
    height: 100%;
    box-sizing: border-box;
  }

  .position-debug {
    font-size: 0.8em;
    color: #666;
    margin-top: 1em;
  }

  /* Crop marks */
  .crop-marks {
    position: absolute;
    top: -3mm;
    left: -3mm;
    right: -3mm;
    bottom: -3mm;
    pointer-events: none;
  }

  .mark {
    position: absolute;
    background: black;
  }

  .mark.top, .mark.bottom {
    width: 6mm;
    height: 0.3mm;
    left: 50%;
    transform: translateX(-50%);
  }

  .mark.left, .mark.right {
    width: 0.3mm;
    height: 6mm;
    top: 50%;
    transform: translateY(-50%);
  }

  .mark.top { top: 0; }
  .mark.right { right: 0; }
  .mark.bottom { bottom: 0; }
  .mark.left { left: 0; }

  /* Print styles */
  @media print {
    .no-print {
      display: none;
    }

    .position-debug {
      display: none;
    }

    .print-container {
      margin: 0;
      padding: 0;
    }

    .page {
      margin: 0;
      box-shadow: none;
      page-break-after: always;
    }

    /* Ensure clean page breaks */
    @page {
      size: A4;
      margin: 0;
    }
  }
</style>
