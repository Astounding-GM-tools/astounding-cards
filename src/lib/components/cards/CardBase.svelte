<script lang="ts">
  // TODO: Future refactor - Combine CardBase and CardFront into a single component
  // This would simplify preview modes, theme previews, and reduce prop passing complexity
  // Also consider standardizing preview sizing across all preview contexts (deck manager, theme selector, etc.)
  import { currentDeck } from '$lib/stores/deck';
  import { createCardBaseState, type CardBaseState } from './CardBase.svelte';

  const { children, theme, preview, cardSize }: { children: any, theme?: string, preview?: boolean, cardSize?: string } = $props();
  
  // Note: CardBase doesn't have access to individual card data, theme priority handled in CardFront
  const state = $derived<CardBaseState>(createCardBaseState(theme, preview, cardSize, $currentDeck));
</script>

{#key state.activeTheme}
<div class="card-base" class:crop-marks={!state.isPreview} class:preview={state.isPreview} data-theme={state.activeTheme} data-size={state.size}>
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

  /* Preview mode styles */
  .card-base.preview {
    max-width: 300px;
    aspect-ratio: 63/88; /* Standard poker card ratio */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .card-base.preview[data-size="tarot"] {
    aspect-ratio: 70/120; /* Tarot card ratio */
  }

  @media print {
    .card-base {
      box-shadow: none;
      border: none;
    }
  }
</style> 