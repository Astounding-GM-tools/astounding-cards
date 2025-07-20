<script lang="ts">
  export let showCropMarks = true;
  export let children: () => any;
</script>

<div class="card" class:show-crop-marks={showCropMarks}>
  {@render children()}
</div>

<style>
  .card {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 3mm;
    box-sizing: border-box;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
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
      black 0,
      black 8mm,
      transparent 8mm,
      transparent calc(100% - 8mm),
      black calc(100% - 8mm),
      black 100%
    ) 1;
  }

  /* Vertical marks */
  .show-crop-marks::after {
    border-left: 0.2mm solid;
    border-right: 0.2mm solid;
    border-image: linear-gradient(
      to bottom,
      black 0,
      black 8mm,
      transparent 8mm,
      transparent calc(100% - 8mm),
      black calc(100% - 8mm),
      black 100%
    ) 1;
  }

  /* Thinner borders for adjacent cards */
  :global(.card-grid > div:not(:nth-child(3n))) .show-crop-marks::after {
    border-right-width: 0.1mm; /* Right border thinner when not last in row */
  }
  :global(.card-grid > div:not(:nth-child(3n + 1))) .show-crop-marks::after {
    border-left-width: 0.1mm; /* Left border thinner when not first in row */
  }
  :global(.card-grid > div:nth-child(n+4)) .show-crop-marks::before {
    border-top-width: 0.1mm; /* Top border thinner for rows 2 and 3 */
  }
  :global(.card-grid > div:nth-child(-n+6)) .show-crop-marks::before {
    border-bottom-width: 0.1mm; /* Bottom border thinner for rows 1 and 2 */
  }
</style> 