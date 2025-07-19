<script lang="ts">
  import type { Character } from '$lib/types';
  import { onMount } from 'svelte';

  export let character: Character;
  export let gridPosition: number;
  export let showCropMarks = true;
  export let onChange: (updates: Partial<Character>) => void;

  let bioElement: HTMLElement;

  onMount(() => {
    // Ensure bio text doesn't overflow
    if (bioElement) {
      const maxHeight = bioElement.style.maxHeight;
      if (bioElement.scrollHeight > parseInt(maxHeight)) {
        bioElement.textContent = bioElement.textContent?.slice(0, -10) + '...';
      }
    }
  });

  function updateBio(event: Event) {
    const target = event.target as HTMLElement;
    onChange({ bio: target.innerText });
  }
</script>

<article 
  class="card" 
  data-position={gridPosition}
  class:show-crop-marks={showCropMarks}
  style:container-type="inline-size"
>
  <h2 
    contenteditable="true" 
    on:blur={updateBio}
  >{character.name}</h2>
  <p 
    class="bio" 
    contenteditable="true"
    on:blur={updateBio}
    bind:this={bioElement}
  >{character.bio}</p>
  <section class="notes">
    <h3>Notes</h3>
    <div class="notes-content"></div>
  </section>
</article>

<style>
  .card {
    position: relative;
    width: 63.5mm;
    height: 88.9mm;
    padding: 3mm;
    box-sizing: border-box;
    font-size: 8pt;
    display: flex;
    flex-direction: column;
    gap: 3mm;
  }

  h2 {
    margin: 0;
    font-size: 10pt;
    font-weight: bold;
    text-align: center;
    height: 5mm;
  }

  .bio {
    margin: 0;
    font-size: 7pt;
    line-height: 1.4;
    overflow: hidden;
    max-height: calc(88.9mm - 6mm - 5mm - 6mm - 50mm); /* card height - padding - h2 - gaps - notes */
  }

  @container (height < 20mm) {
    .bio {
      max-height: calc(88.9mm - 6mm - 5mm - 3mm); /* card height - padding - h2 - single gap */
    }
  }

  .notes {
    border: 1px solid #ddd;
    padding: 1mm 2mm;
    border-radius: 1mm;
    min-height: 50mm;
    margin-top: auto;
  }

  @container (height < 20mm) {
    .notes {
      display: none;
    }
  }

  .notes h3 {
    font-size: 8pt;
    margin: 0;
    color: #666;
    font-weight: normal;
  }

  .notes-content {
    margin-top: 2mm;
    min-height: 40mm;
  }

  /* Crop marks as pseudo elements */
  .show-crop-marks::before,
  .show-crop-marks::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 6mm;
    border-top: 0.3mm solid black;
  }

  .show-crop-marks::before {
    top: -3mm;
  }

  .show-crop-marks::after {
    bottom: -3mm;
  }

  /* Using first and last child for vertical marks */
  .show-crop-marks > :first-child::before,
  .show-crop-marks > :last-child::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 6mm;
    border-left: 0.3mm solid black;
  }

  .show-crop-marks > :first-child::before {
    left: -3mm;
  }

  .show-crop-marks > :last-child::after {
    right: -3mm;
  }

  /* Hide redundant crop marks */
  /* Middle column (2,5,8) - hide vertical marks */
  :global(.card-grid > div:nth-child(3n-1) .show-crop-marks) > :first-child::before,
  :global(.card-grid > div:nth-child(3n-1) .show-crop-marks) > :last-child::after {
    display: none;
  }

  /* Middle row (4,5,6) - hide horizontal marks */
  :global(.card-grid > div:nth-child(n+4):nth-child(-n+6) .show-crop-marks)::before,
  :global(.card-grid > div:nth-child(n+4):nth-child(-n+6) .show-crop-marks)::after {
    display: none;
  }

  @media print {
    .card {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
</style> 