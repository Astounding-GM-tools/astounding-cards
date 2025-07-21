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
</script>

<Card {showCropMarks}>
  <article 
    class="card-content" 
    style:container-type="inline-size"
  >
    <div class="stat-container">
      <CardStatSelector {character} {onChange} />
    </div>
    <div class="portrait">
      {#if character.portrait}
        <img src={character.portrait} alt={character.name} />
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
    >{character.traits.join('\n')}</div>
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

  @container (height < 20mm) {
    .portrait {
      display: none;
    }
  }
</style> 