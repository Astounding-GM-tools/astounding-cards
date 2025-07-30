<script lang="ts">
  import { currentDeck } from '$lib/stores/deck';

  const { children, theme }: { children: any, theme?: string } = $props();
  const activeTheme = $derived(theme ?? $currentDeck?.meta?.theme ?? 'classic');
</script>

{#key activeTheme}
<div class="card-base crop-marks" data-theme={activeTheme}>
  {@render children()}
</div>
{/key}

<style>
  .card-base {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--theme-background);
    border-radius: var(--card-radius);
    overflow: hidden;
    box-shadow: var(--card-shadow);
  }

  /* Crop marks using gradient borders */
  .crop-marks {
    position: relative;
  }

  .crop-marks::before,
  .crop-marks::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Horizontal marks */
  .crop-marks::before {
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
  .crop-marks::after {
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

  /* Thinner borders for adjacent cards - Poker size */
  :global(.card-grid[data-size="poker"] > div:not(:nth-child(3n))) .crop-marks::after {
    border-right-width: 0.1mm;
  }
  :global(.card-grid[data-size="poker"] > div:not(:nth-child(3n + 1))) .crop-marks::after {
    border-left-width: 0.1mm;
  }
  :global(.card-grid[data-size="poker"] > div:nth-child(n+4)) .crop-marks::before {
    border-top-width: 0.1mm;
  }
  :global(.card-grid[data-size="poker"] > div:nth-child(-n+6)) .crop-marks::before {
    border-bottom-width: 0.1mm;
  }

  /* Thinner borders for adjacent cards - Tarot size */
  :global(.card-grid[data-size="tarot"] > div:not(:nth-child(2n))) .crop-marks::after {
    border-right-width: 0.1mm;
  }
  :global(.card-grid[data-size="tarot"] > div:not(:nth-child(2n + 1))) .crop-marks::after {
    border-left-width: 0.1mm;
  }
  :global(.card-grid[data-size="tarot"] > div:nth-child(n+3)) .crop-marks::before {
    border-top-width: 0.1mm;
  }
  :global(.card-grid[data-size="tarot"] > div:nth-child(-n+2)) .crop-marks::before {
    border-bottom-width: 0.1mm;
  }

  @media print {
    .card-base {
      box-shadow: none;
      border: none;
    }
  }
</style> 