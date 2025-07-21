<script lang="ts">
  import type { Character } from '$lib/types';
  import Card from './Card.svelte';
  import CardStatSelector from './CardStatSelector.svelte';

  export let character: Character;
  export let showCropMarks = true;
  export let onChange: (updates: Partial<Character>) => void;

  let nameElement: HTMLElement;
  let roleElement: HTMLElement;
  let traitsElement: HTMLElement;
  let imageUrl = '';
  let showImageInput = false;

  // Update DOM elements when character changes
  $: {
    if (nameElement && nameElement.innerText !== character.name) {
      nameElement.innerText = character.name;
    }
    if (roleElement && roleElement.innerText !== character.role) {
      roleElement.innerText = character.role;
    }
  }

  async function updateName(event: Event) {
    const target = event.target as HTMLElement;
    const newName = target.innerText;
    if (newName !== character.name) {
      await onChange({ name: newName });
    }
  }

  async function updateRole(event: Event) {
    const target = event.target as HTMLElement;
    const newRole = target.innerText;
    if (newRole !== character.role) {
      await onChange({ role: newRole });
    }
  }

  // Format traits with strong labels
  function formatTraits(traits: string[]) {
    return traits?.map(trait => {
      const [label, ...rest] = trait.split(':');
      if (rest.length > 0) {
        return `<strong class="trait-label">${label.trim()}</strong>:${rest.join(':')}`; // Added class
      }
      return trait;
    }).join('\n') || '';
  }

  // Parse HTML back to plain text for traits
  function parseTraits(html: string) {
    return html
      .replace(/<strong>|<\/strong>/g, '')  // Remove strong tags
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  async function updateTraits(event: Event) {
    const target = event.target as HTMLElement;
    const newTraits = parseTraits(target.innerHTML);

    if (JSON.stringify(newTraits) !== JSON.stringify(character.traits)) {
      await onChange({ traits: newTraits });
    }
  }

  async function updatePortrait() {
    if (!imageUrl) return;
    await onChange({ portrait: imageUrl });
    imageUrl = '';
    showImageInput = false;
  }
</script>

<Card {showCropMarks}>
  <article 
    class="card-content" 
    style:container-type="inline-size"
  >
    <div class="stat-container">
      <CardStatSelector {character} {onChange} />
    </div>
    <div class="portrait-container">
      <button 
        class="change-portrait" 
        on:click={() => showImageInput = !showImageInput}
        title="Change portrait"
      >
        {#if character.portrait}
          Change portrait
        {:else}
          Add portrait
        {/if}
      </button>

      {#if showImageInput}
        <div class="image-input">
          <input 
            type="text"
            bind:value={imageUrl}
            placeholder="Enter image name"
          />
          <button on:click={updatePortrait}>Set</button>
          <button on:click={() => showImageInput = false}>Cancel</button>
        </div>
      {/if}
    </div>
    <div class="portrait">
      {#if character.portrait}
        <img src={`/portraits/${character.portrait}`} alt={character.name} />
      {/if}
    </div>
    <h2 
      contenteditable="true" 
      on:blur={updateName}
      bind:this={nameElement}
    >{character.name}</h2>
    <p 
      class="role" 
      contenteditable="true"
      on:blur={updateRole}
      bind:this={roleElement}
    >{character.role}</p>
    <div 
      class="traits" 
      contenteditable="true"
      on:blur={updateTraits}
      bind:this={traitsElement}
    >{@html formatTraits(character.traits)}</div>
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

  .stat-container {
    position: absolute;
    top: 2mm;
    right: 2mm;
  }

  .portrait-container {
    position: absolute;
    top: 2mm;
    left: 2mm;
  }

  .change-portrait {
    background: rgba(255, 255, 255, 0.8);
    border: none;
    padding: 1mm 2mm;
    border-radius: 1mm;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 7pt;
  }

  .card-content:hover .change-portrait {
    opacity: 0.8;
  }

  .change-portrait:hover {
    opacity: 1 !important;
    background: rgba(255, 255, 255, 0.95);
  }

  .image-input {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    padding: 2mm;
    border-radius: 1mm;
    display: flex;
    gap: 1mm;
    box-shadow: 0 1mm 2mm rgba(0,0,0,0.1);
    z-index: 10;
  }

  .image-input input {
    border: 1px solid #ddd;
    padding: 1mm;
    border-radius: 0.5mm;
    min-width: 30mm;
    font-size: 7pt;
  }

  .image-input button {
    border: none;
    background: #eee;
    padding: 1mm 2mm;
    border-radius: 0.5mm;
    cursor: pointer;
    font-size: 7pt;
  }

  .image-input button:hover {
    background: #ddd;
  }

  .portrait {
    width: 100%;
    aspect-ratio: 1;
    background: #f5f5f5;
    border-radius: 1mm;
    overflow: hidden;
  }

  .portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;  /* Focus on the face/top of image */
  }

  h2 {
    margin: 0;
    font-size: 10pt;
    font-weight: bold;
    text-align: center;
  }

  .role {
    margin: 0;
    font-size: 8pt;
    text-align: center;
    font-style: italic;
  }

  .traits {
    margin: 0;
    font-size: 7pt;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .traits :global(strong) {
    font-weight: bold;
    color: #444;
  }

  .traits :global(.trait-label) {
    font-weight: bold;
    color: #444;
    display: inline-block;
    min-width: 20mm;
  }

  @container (height < 20mm) {
    .portrait {
      display: none;
    }
  }

  @media print {
    .change-portrait,
    .image-input {
      display: none;
    }
  }
</style> 