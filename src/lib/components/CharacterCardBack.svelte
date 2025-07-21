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

  // Ensure description text doesn't overflow
  $: {
    if (descElement) {
      const maxHeight = descElement.style.maxHeight;
      if (descElement.scrollHeight > parseInt(maxHeight)) {
        descElement.textContent = descElement.textContent?.slice(0, -10) + '...';
      }
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
      .replace(/<strong>|<\/strong>/g, '')  // Remove strong tags
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  async function updateSecrets(event: Event) {
    const target = event.target as HTMLElement;
    // Split into lines and process each line
    const newSecrets = target.innerText
      .split('\n')
      .map(line => {
        // If line already has a colon, ensure proper format
        if (line.includes(':')) {
          const [label, ...rest] = line.split(':');
          return `${label.trim()}: ${rest.join(':').trim()}`;
        }
        // If no colon, return line as is
        return line.trim();
      })
      .filter(s => s.length > 0);
    
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
  <article 
    class="card-content" 
    style:container-type="inline-size"
  >
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
  </article>
</Card>

<style>
  .card-content {
    width: 100%;
    height: 100%;
    font-size: clamp(7pt, 2.5cqw, 12pt);
    display: flex;
    flex-direction: column;
    gap: 3mm;
    direction: ltr;  /* Ensure content is always LTR regardless of parent */
  }

  h2 {
    margin: 0;
    font-size: clamp(9pt, 3cqw, 14pt);
    font-weight: bold;
    text-align: center;
    height: 5mm;
  }

  .desc {
    margin: 0;
    font-size: clamp(7pt, 2.5cqw, 12pt);
    line-height: 1.4;
    overflow: hidden;
    max-height: calc(88.9mm - 6mm - 5mm - 6mm - 50mm); /* card height - padding - h2 - gaps - secrets */
    text-align: center;
  }

  @container (height < 20mm) {
    .desc {
      max-height: calc(88.9mm - 6mm - 5mm - 3mm); /* card height - padding - h2 - single gap */
    }
  }

  .secrets {
    position: relative;
    border: 1px solid #ddd;
    padding: 1mm 2mm;
    border-radius: 1mm;
    min-height: 50mm;
    margin-top: auto;
  }

  @container (height < 20mm) {
    .secrets {
      display: none;
    }
  }

  .secrets legend {
    font-size: clamp(7pt, 2.5cqw, 12pt);
    color: #666;
    font-weight: normal;
    padding: 0 1mm;
  }

  .secrets-content {
    min-height: 40mm;
    white-space: pre-wrap;
    font-size: clamp(7pt, 2.5cqw, 12pt);
    line-height: 1.4;
  }

  .secrets-content :global(strong) {
    font-weight: bold;
    color: #444;
  }

  .secrets-content :global(.secret-label) {
    font-weight: bold;
    color: #444;
    display: inline-block;
    min-width: clamp(20mm, 25cqw, 30mm);
  }

  .secrets-content :global(.separator) {
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }

  .add-secret {
    position: absolute;
    bottom: 2mm;
    right: 2mm;
    width: 5mm;
    height: 5mm;
    border: none;
    border-radius: 50%;
    background: #eee;
    color: #666;
    font-size: clamp(7pt, 2.5cqw, 12pt);
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
    background: #ddd;
  }

  @media print {
    .card {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .add-secret {
      display: none;
    }
  }
</style> 