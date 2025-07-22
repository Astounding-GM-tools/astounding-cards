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
    background-color: var(--theme-background);
    container-type: inline-size;
    direction: ltr;  /* Ensure content is always LTR regardless of parent */
  }

  .content {
    background: var(--back-content-box-bg, var(--content-box-bg));  /* Use back-specific bg if set */
    color: var(--back-content-text, var(--theme-text));  /* Use back-specific text color if set */
    opacity: var(--content-opacity, 1);
    margin: var(--content-gap);
    padding: var(--content-gap);
    border-radius: var(--content-box-radius);
    border: var(--content-box-border);
    box-shadow: var(--content-box-shadow);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: calc(100% - var(--content-gap) * 2);
    position: relative;
  }

  /* Add corner flourishes if enabled */
  .content::before,
  .content::after {
    content: '';
    position: absolute;
    width: calc(var(--corner-flourish-size) * var(--show-corner-flourish));
    height: calc(var(--corner-flourish-size) * var(--show-corner-flourish));
    background-image: var(--corner-flourish-svg);
    background-size: contain;
    background-repeat: no-repeat;
    opacity: calc(var(--corner-flourish-opacity) * var(--show-corner-flourish));
  }

  .content::before {
    top: var(--content-gap);
    left: var(--content-gap);
  }

  .content::after {
    top: var(--content-gap);
    right: var(--content-gap);
    transform: scaleX(-1);
  }

  /* Add bottom corners */
  .content > :last-child::before,
  .content > :last-child::after {
    content: '';
    position: absolute;
    bottom: var(--content-gap);
    width: calc(var(--corner-flourish-size) * var(--show-corner-flourish));
    height: calc(var(--corner-flourish-size) * var(--show-corner-flourish));
    background-image: var(--corner-flourish-svg);
    background-size: contain;
    background-repeat: no-repeat;
    opacity: calc(var(--corner-flourish-opacity) * var(--show-corner-flourish));
  }

  .content > :last-child::before {
    left: var(--content-gap);
    transform: scaleY(-1);
  }

  .content > :last-child::after {
    right: var(--content-gap);
    transform: scale(-1);
  }

  h2 {
    margin: 0;
    font-size: var(--title-font-size);
    font-weight: var(--theme-title-weight);
    font-family: var(--theme-title-font);
    text-align: center;
  }

  .desc {
    margin: var(--content-gap) 0;
    font-size: var(--role-font-size);
    line-height: 1.4;
    text-align: center;
    font-family: var(--theme-body-font);
  }

  .secrets {
    position: relative;
    border: var(--content-box-border);
    padding: var(--content-gap);
    border-radius: var(--content-box-radius);
    min-height: 40mm;
    margin: 0;
    font-family: var(--theme-body-font);
  }

  .secrets legend {
    font-size: var(--ui-font-size);
    color: var(--theme-text);
    font-weight: normal;
    padding: 0 1mm;
    font-family: var(--theme-body-font);
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