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
        return `<strong class="trait-label">${label.trim()}:</strong> ${rest.join(':').trim()}`;
      }
      return trait; // If no colon, keep as is
    }).join('\n') || '';
  }

  // Parse HTML back to plain text for traits
  function parseTraits(html: string) {
    return html
      .replace(/<strong[^>]*>|<\/strong>/g, '')  // Remove strong tags
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  async function updateTraits(event: Event) {
    const target = event.target as HTMLElement;
    const newTraits = parseTraits(target.innerText);
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

{#if character}
<Card {showCropMarks}>
  <div 
    class="card-content"
    style:background-image={character.portrait ? `url('/portraits/${character.portrait}')` : 'none'}
  >
    <!-- Portrait flourishes -->
    <div class="flourish portrait-flourish top-left"></div>
    {#if !character.stat}
    <div class="flourish portrait-flourish top-right"></div>
    {/if}
    
    <!-- Portrait container -->
    <div class="portrait-container">
      {#if character.portrait}
        <button 
          class="change-portrait" 
          on:click={() => showImageInput = !showImageInput}
          title="Change portrait"
        >
          Change portrait
        </button>
      {:else}
        <button 
          class="change-portrait" 
          on:click={() => showImageInput = !showImageInput}
          title="Add portrait"
        >
          Add portrait
        </button>
      {/if}

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

    <!-- Stat container -->
    <div class="stat-container">
      <CardStatSelector {character} {onChange} />
    </div>

    <div class="content">
      <!-- Content flourishes -->
      <div class="flourish content-flourish top-left"></div>
      <div class="flourish content-flourish top-right"></div>

      <h2 
        contenteditable="true" 
        on:blur={updateName}
        bind:this={nameElement}
      >{character.name}</h2>
      <div 
        class="role" 
        contenteditable="true"
        on:blur={updateRole}
        bind:this={roleElement}
      >{character.role}</div>
      <div 
        class="traits" 
        contenteditable="true"
        on:blur={updateTraits}
        bind:this={traitsElement}
      >{@html formatTraits(character.traits)}</div>
    </div>
  </div>
</Card>
{/if}

<style>
  .card-content {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background-color: var(--theme-background);
    background-size: cover;
    background-position: top center;
    container-type: inline-size;
    width: 100%;
    font-size: var(--base-font-size);
  }

  .flourish {
    position: absolute;
    width: var(--corner-flourish-size, 3rem);
    height: var(--corner-flourish-size, 3rem);
    background-image: var(--corner-flourish-svg);
    background-size: contain;
    background-repeat: no-repeat;
    pointer-events: none;
    z-index: 2;
  }

  .portrait-flourish {
    filter: invert(1) opacity(0.6);
  }

  .content-flourish {
    opacity: 0.2;
  }

  .flourish.top-left {
    left: var(--content-gap);
    top: var(--content-gap);
  }

  .flourish.top-right {
    right: var(--content-gap);
    top: var(--content-gap);
  }

  .content-flourish.top-left,
  .content-flourish.top-right {
    top: calc(-1 * var(--content-gap));
  }

  .portrait-container {
    position: absolute;
    top: var(--page-margin);
    left: var(--page-margin);
  }

  .change-portrait {
    background: var(--content-box-bg);
    opacity: var(--content-opacity);
    border: none;
    padding: var(--content-gap);
    border-radius: 1mm;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    font-size: var(--ui-font-size);
  }

  .card-content:hover .change-portrait {
    opacity: 0.8;
  }

  .change-portrait:hover {
    opacity: 1 !important;
  }

  .image-input {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--content-box-bg);
    padding: var(--content-gap);
    border-radius: 1mm;
    display: flex;
    gap: var(--content-gap);
    box-shadow: 0 1mm 2mm rgba(0,0,0,0.1);
    z-index: 10;
  }

  .image-input input {
    border: 1px solid var(--border-color);
    padding: 1mm;
    border-radius: 0.5mm;
    min-width: 30mm;
    font-size: var(--ui-font-size);
  }

  .image-input button {
    border: none;
    background: var(--border-color);
    padding: 1mm 2mm;
    border-radius: 0.5mm;
    cursor: pointer;
    font-size: var(--ui-font-size);
  }

  .image-input button:hover {
    opacity: 0.8;
  }

  .stat-container {
    position: absolute;
    top: var(--page-margin);
    right: var(--page-margin);
    font-size: var(--ui-font-size);
  }

  .content {
    background: var(--content-box-bg);
    color: var(--theme-text);
    opacity: var(--content-opacity, 1);
    margin: var(--content-gap);
    padding: var(--content-gap);
    border-radius: var(--content-box-radius);
    border: var(--content-box-border);
    box-shadow: var(--content-box-shadow);
    position: relative;
  }

  /* Center the title with max-width */
  h2 {
    margin: 0 auto;
    max-width: 80%;
    font-size: var(--title-font-size);
    font-weight: var(--theme-title-weight);
    font-family: var(--theme-title-font);
    text-align: center;
    position: relative;
    z-index: 3;
  }

  .role {
    margin: 0.25rem auto 0;
    max-width: 80%;
    font-style: italic;
    text-align: center;
    font-family: var(--theme-body-font);
    position: relative;
    z-index: 3;
  }

  .traits {
    margin-top: var(--content-gap);
    font-family: var(--theme-body-font);
    border-top: calc(var(--divider-width) * var(--show-dividers)) var(--divider-style) var(--divider-color);
    opacity: var(--divider-opacity);
    padding-top: var(--content-gap);
    white-space: pre-wrap;
    line-height: 1.4;
    font-size: var(--trait-font-size);
    position: relative;
    z-index: 3;
  }

  .traits :global(.trait-label) {
    font-weight: bold;
    color: var(--content-text);
    opacity: 0.8;
    display: inline-block;
    min-width: clamp(20mm, 25cqw, 30mm);
  }

  @container (height < 20mm) {
    .portrait-container {
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