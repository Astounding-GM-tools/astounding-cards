<script lang="ts">
  import { currentDeck } from '$lib/stores/cards';

  let { showCropMarks = false, children, theme = undefined } = $props();
  const activeTheme = $derived(theme ?? $currentDeck?.meta?.theme ?? 'classic');
</script>

<div data-theme={activeTheme} class="card" class:show-crop-marks={showCropMarks}>
  <div class="theme-scope">
    {@render children()}
  </div>
</div>

<style>
  .card {
    position: relative;
    width: 100%;
    height: 100%;
    padding: var(--card-padding);
    box-sizing: border-box;
  }

  .theme-scope {
    height: 100%;
  }

  /* Crop marks using gradient borders */
  .show-crop-marks {
    position: relative;
  }

  .show-crop-marks::before,
  .show-crop-marks::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Horizontal marks */
  .show-crop-marks::before {
    border-top: 0.2mm solid;
    border-bottom: 0.2mm solid;
    border-image: linear-gradient(
      to right,
      var(--content-text) 0,
      var(--content-text) 8mm,
      transparent 8mm,
      transparent calc(100% - 8mm),
      var(--content-text) calc(100% - 8mm),
      var(--content-text) 100%
    ) 1;
  }

  /* Vertical marks */
  .show-crop-marks::after {
    border-left: 0.2mm solid;
    border-right: 0.2mm solid;
    border-image: linear-gradient(
      to bottom,
      var(--content-text) 0,
      var(--content-text) 8mm,
      transparent 8mm,
      transparent calc(100% - 8mm),
      var(--content-text) calc(100% - 8mm),
      var(--content-text) 100%
    ) 1;
  }

  /* Thinner borders for adjacent cards */
  :global(.card-grid[data-size="poker"] > div:not(:nth-child(3n))) .show-crop-marks::after {
    border-right-width: 0.1mm;
  }
  :global(.card-grid[data-size="poker"] > div:not(:nth-child(3n + 1))) .show-crop-marks::after {
    border-left-width: 0.1mm;
  }
  :global(.card-grid[data-size="poker"] > div:nth-child(n+4)) .show-crop-marks::before {
    border-top-width: 0.1mm;
  }
  :global(.card-grid[data-size="poker"] > div:nth-child(-n+6)) .show-crop-marks::before {
    border-bottom-width: 0.1mm;
  }

  /* Tarot size crop marks */
  :global(.card-grid[data-size="tarot"] > div:not(:nth-child(2n))) .show-crop-marks::after {
    border-right-width: 0.1mm;
  }
  :global(.card-grid[data-size="tarot"] > div:not(:nth-child(2n + 1))) .show-crop-marks::after {
    border-left-width: 0.1mm;
  }
  :global(.card-grid[data-size="tarot"] > div:nth-child(n+3)) .show-crop-marks::before {
    border-top-width: 0.1mm;
  }
  :global(.card-grid[data-size="tarot"] > div:nth-child(-n+2)) .show-crop-marks::before {
    border-bottom-width: 0.1mm;
  }
</style> 