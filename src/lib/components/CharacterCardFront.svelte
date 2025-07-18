<script lang="ts">
  import type { Character } from '$lib/server/db/schema';

  export let character: Character;
  export let showCropMarks = true;
</script>

<article 
  class="card" 
  class:show-crop-marks={showCropMarks}
  style:background-image={character.portrait ? `url(/portraits/${character.portrait})` : undefined}
>
  <section>
    <h2>{character.name}</h2>
    <p class="role">{character.role}. Age {character.age}</p>
    <ul class="traits">
      {#each character.traits as trait}
        <li>{trait}</li>
      {/each}
    </ul>
  </section>
</article>

<style>
  .card {
    position: relative;
    width: 63.5mm;
    height: 88.9mm;
    background-color: white;
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 3mm;
    box-sizing: border-box;
    font-size: 8pt;
    gap: 2mm;
  }

  section {
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    padding: 2mm;
    border-radius: 1mm;
    margin: 0 -1mm;
  }

  h2 {
    margin: 0;
    font-size: 10pt;
    font-weight: bold;
  }

  .role {
    margin: 1mm 0 0;
    font-style: italic;
  }

  .traits {
    list-style-type: none;
    padding: 0;
    margin: 0 -1mm;
    gap: 1mm;
    text-align: left;
  }

  .traits li {
    padding: 0.5mm 2mm;
    font-size: 7pt;
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

  .show-crop-marks::after {
    content: '';
    position: absolute;
  }

  /* Using the first and last child for vertical marks */
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
  :global(.card-grid > :nth-child(3n-1).show-crop-marks) > :first-child::before,
  :global(.card-grid > :nth-child(3n-1).show-crop-marks) > :last-child::after {
    display: none;
  }

  /* Middle row (4,5,6) - hide horizontal marks */
  :global(.card-grid > :nth-child(n+4):nth-child(-n+6).show-crop-marks)::before,
  :global(.card-grid > :nth-child(n+4):nth-child(-n+6).show-crop-marks)::after {
    display: none;
  }
</style> 