<script lang="ts">
  import type { Character } from '$lib/types';
  import { onMount } from 'svelte';
  import Card from './Card.svelte';

  export let character: Character;
  export let showCropMarks = true;
  export let onChange: (updates: Partial<Character>) => void;

  let bioElement: HTMLElement;
  let nameElement: HTMLElement;

  // Update DOM elements when character changes
  $: {
    if (nameElement && nameElement.innerText !== character.name) {
      nameElement.innerText = character.name;
    }
    if (bioElement && bioElement.innerText !== character.bio) {
      bioElement.innerText = character.bio;
    }
  }

  onMount(() => {
    // Ensure bio text doesn't overflow
    if (bioElement) {
      const maxHeight = bioElement.style.maxHeight;
      if (bioElement.scrollHeight > parseInt(maxHeight)) {
        bioElement.textContent = bioElement.textContent?.slice(0, -10) + '...';
      }
    }
  });

  async function updateBio(event: Event) {
    const target = event.target as HTMLElement;
    const newBio = target.innerText;
    if (newBio !== character.bio) {
      await onChange({ bio: newBio });
    }
  }

  async function updateName(event: Event) {
    const target = event.target as HTMLElement;
    const newName = target.innerText;
    if (newName !== character.name) {
      await onChange({ name: newName });
    }
  }
</script>

<Card {showCropMarks}>
  <article 
    class="card-content" 
    style:container-type="inline-size"
  >
    <h2 
      contenteditable="true" 
      on:blur={updateName}
      bind:this={nameElement}
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
</Card>

<style>
  .card-content {
    width: 100%;
    height: 100%;
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
    text-align: center;
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

  @media print {
    .card {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
</style> 