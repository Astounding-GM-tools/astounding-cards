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

  async function updateTraits(event: Event) {
    const target = event.target as HTMLElement;
    const newTraits = target.innerText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

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
    style:background-image={character.portrait ? `url('/portraits/${character.portrait}')` : 'none'}
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
    <section class="content">
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
      >{character.traits.join('\n')}</div>
    </section>
  </article>
</Card>

<style>
  .card-content {
    width: 100%;
    height: 100%;
    font-size: var(--base-font-size);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background-color: var(--content-bg);
    background-size: cover;
    background-position: top center;
    container-type: inline-size;
  }

  .content {
    background: var(--content-bg);
    color: var(--content-text);
    opacity: var(--content-opacity);
    margin: var(--content-gap);
    padding: var(--content-gap);
    border-radius: 1mm;
  }

  .stat-container {
    position: absolute;
    top: var(--page-margin);
    right: var(--page-margin);
    font-size: var(--ui-font-size);
  }

  .portrait-container {
    position: absolute;
    top: var(--page-margin);
    left: var(--page-margin);
  }

  .change-portrait {
    background: var(--content-bg);
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
    background: var(--content-bg);
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

  h2 {
    margin: 0;
    font-size: var(--title-font-size);
    font-weight: bold;
    text-align: center;
  }

  .role {
    margin: var(--content-gap) 0;
    font-size: var(--role-font-size);
    text-align: center;
    font-style: italic;
  }

  .traits {
    font-size: var(--trait-font-size);
    line-height: 1.4;
    white-space: pre-wrap;
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