<script lang="ts">
  import { currentDeck } from '$lib/stores/deck';

  // Props
  const props = $props<{
    theme?: string;
    showCropMarks?: boolean;
  }>();

  // Reactive references
  const theme = props.theme;
  const showCropMarks = props.showCropMarks ?? false;
  const activeTheme = $derived(theme ?? $currentDeck?.meta?.theme ?? 'classic');
</script>

<div class="card-base" class:crop-marks={showCropMarks} data-theme={activeTheme}>
  <slot></slot>
</div>

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

  .card-base.crop-marks::before,
  .card-base.crop-marks::after {
    content: '';
    position: absolute;
    background: var(--theme-primary);
    opacity: 0.5;
  }

  /* Horizontal crop marks */
  .card-base.crop-marks::before {
    left: -5mm;
    right: -5mm;
    height: 1px;
    top: 50%;
    transform: translateY(-50%);
  }

  /* Vertical crop marks */
  .card-base.crop-marks::after {
    top: -5mm;
    bottom: -5mm;
    width: 1px;
    left: 50%;
    transform: translateX(-50%);
  }

  @media print {
    .card-base {
      box-shadow: none;
      border: none;
    }
  }
</style> 