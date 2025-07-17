<script lang="ts">
  import type { Character } from '$lib/server/db/schema';

  export let character: Character;
  export let gridPosition: number;
  export let showCropMarks = true;
</script>

<div class="card back" data-position={gridPosition}>
  <div class="card-inner">
    <div class="card-header">
      <h2>{character.name}</h2>
      <div class="role">{character.role}</div>
    </div>
    <div class="bio">
      <h3>Background</h3>
      <p>{character.details.bio}</p>
    </div>
    <div class="notes">
      <h3>Notes</h3>
      <ul>
        {#each character.details.notes as note}
          <li>{note}</li>
        {/each}
      </ul>
    </div>
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

<style>
  .card {
    position: relative;
    width: 63.5mm;
    height: 88.9mm;
    background: white;
    border: 1px solid #ddd;
    order: var(--position);
  }

  .card[data-position] {
    --position: attr(data-position number);
  }

  .card-inner {
    padding: 3mm;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 8pt;
  }

  .card-header {
    text-align: center;
    margin-bottom: 2mm;
  }

  .card-header h2 {
    margin: 0;
    font-size: 10pt;
    font-weight: bold;
  }

  .role {
    font-style: italic;
    margin-top: 1mm;
  }

  .bio h3, .notes h3 {
    font-size: 9pt;
    margin: 2mm 0 1mm;
  }

  .bio p {
    margin: 1mm 0;
    font-size: 7pt;
  }

  .notes ul {
    margin: 0;
    padding-left: 4mm;
    font-size: 7pt;
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

  /* Hide redundant crop marks */
  /* Middle column (2,5,8) - hide side marks */
  :global(.card-grid > :nth-child(3n-1)) .mark.left,
  :global(.card-grid > :nth-child(3n-1)) .mark.right {
    display: none;
  }

  /* Middle row (4,5,6) - hide top/bottom marks */
  :global(.card-grid > :nth-child(n+4):nth-child(-n+6)) .mark.top,
  :global(.card-grid > :nth-child(n+4):nth-child(-n+6)) .mark.bottom {
    display: none;
  }
</style> 