<script lang="ts">
  import type { Character } from '$lib/types';
  import Card from './Card.svelte';

  export let character: Character;
  export let showCropMarks = true;
  export let onChange: (updates: Partial<Character>) => void;
  export let editable = true;

  let nameElement: HTMLElement;
  let descElement: HTMLElement;
  let secretsElement: HTMLElement;

  // Update DOM elements when character changes
  $: {
    if (nameElement && nameElement.innerText !== character.name) {
      nameElement.innerText = character.name;
    }
    if (descElement && descElement.innerText !== character.desc) {
      descElement.innerText = character.desc;
    }
  }

  async function updateName(event: Event) {
    const target = event.target as HTMLElement;
    const newName = target.innerText;
    if (newName !== character.name) {
      await onChange({ name: newName });
    }
  }

  async function updateDesc(event: Event) {
    const target = event.target as HTMLElement;
    const newDesc = target.innerText;
    if (newDesc !== character.desc) {
      await onChange({ desc: newDesc });
    }
  }

  // Format secrets with strong labels
  function formatSecrets(secrets: string[]) {
    return secrets?.map(secret => {
      const [label, ...rest] = secret.split(':');
      if (rest.length > 0) {
        return `<strong class="secret-label">${label.trim()}:</strong> ${rest.join(':').trim()}`;
      }
      return secret; // If no colon, keep as is
    }).join('\n') || '';
  }

  // Parse HTML back to plain text for secrets
  function parseSecrets(html: string) {
    return html
      .replace(/<strong[^>]*>|<\/strong>/g, '')  // Remove strong tags
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  async function updateSecrets(event: Event) {
    const target = event.target as HTMLElement;
    const newSecrets = parseSecrets(target.innerText);
    if (JSON.stringify(newSecrets) !== JSON.stringify(character.secrets)) {
      await onChange({ secrets: newSecrets });
    }
  }

  function addSecret() {
    const newSecrets = [...(character.secrets || []), 'Label: Description'];
    onChange({ secrets: newSecrets });
  }
</script>

<Card {showCropMarks}>
  <article class="card-content">
    <section class="content">
      <div class="top">
        <h2 
          contenteditable={editable}
          on:blur={updateName}
          bind:this={nameElement}
        >{character.name}</h2>
        <p 
          contenteditable={editable}
          class="desc"
          on:blur={updateDesc}
          bind:this={descElement}
        >{character.desc}</p>
      </div>
      <fieldset class="secrets">
        <legend>Secrets</legend>
        <div 
          class="secrets-content"
          contenteditable={editable}
          on:blur={updateSecrets}
          bind:this={secretsElement}
        >{@html formatSecrets(character.secrets)}</div>
        {#if editable}
          <button 
            class="add-secret" 
            on:click={addSecret}
            title="Add secret"
          >+</button>
        {/if}
      </fieldset>
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
    container-type: inline-size;
    direction: ltr;  /* Ensure content is always LTR regardless of parent */
  }

  .content {
    background: var(--content-bg);
    color: var(--content-text);
    opacity: var(--content-opacity);
    margin: var(--content-gap);
    padding: var(--content-gap);
    border-radius: 1mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: calc(100% - var(--content-gap) * 2);
  }

  .top {
    display: flex;
    flex-direction: column;
    gap: var(--content-gap);
  }

  h2 {
    margin: 0;
    font-size: var(--title-font-size);
    font-weight: bold;
    text-align: center;
  }

  .desc {
    margin: 0;
    font-size: var(--role-font-size);
    line-height: 1.4;
    text-align: center;
  }

  .secrets {
    position: relative;
    border: 1px solid var(--border-color);
    padding: var(--content-gap);
    border-radius: 1mm;
    min-height: 40mm;
    margin: 0;
  }

  .secrets legend {
    font-size: var(--ui-font-size);
    color: var(--content-text);
    font-weight: normal;
    padding: 0 1mm;
  }

  .secrets-content {
    min-height: 35mm;
    white-space: pre-wrap;
    font-size: var(--trait-font-size);
    line-height: 1.4;
  }

  .add-secret {
    position: absolute;
    bottom: var(--content-gap);
    right: var(--content-gap);
    width: 5mm;
    height: 5mm;
    border: none;
    border-radius: 50%;
    background: var(--border-color);
    color: var(--content-text);
    font-size: var(--ui-font-size);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .secrets:hover .add-secret {
    opacity: 0.8;
  }

  .add-secret:hover {
    opacity: 1 !important;
  }

  @container (height < 20mm) {
    .secrets {
      display: none;
    }
  }

  @media print {
    .add-secret {
      display: none;
    }
  }

  .secrets-content :global(.secret-label) {
    font-weight: bold;
    color: var(--content-text);
    opacity: 0.8;
    display: inline-block;
    min-width: clamp(20mm, 25cqw, 30mm);
  }
</style> 