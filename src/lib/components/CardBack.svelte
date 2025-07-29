<script lang="ts">
  import type { Card } from '$lib/types';
  import CardBase from './Card.svelte';
  import { currentDeck } from '$lib/stores/deck';

  // Props
  const props = $props<{
    card: Card;
    theme?: string;
    onchange?: (updates: Partial<Card>) => Promise<void>;
    preview?: boolean;
    showCropMarks?: boolean;
    editable?: boolean;
  }>();

  // Reactive references
  const card = props.card;  // Direct reference to props, not state.raw
  const theme = props.theme;
  const preview = props.preview ?? false;
  const showCropMarks = props.showCropMarks ?? false;
  const editable = props.editable ?? true;
  const activeTheme = $derived(theme ?? $currentDeck?.meta?.theme ?? 'classic');

  // Elements
  let nameElement: HTMLHeadingElement;
  let roleElement: HTMLDivElement;
  let descElement: HTMLParagraphElement;
  let secretsElement: HTMLDivElement;

  // Update DOM elements when card changes
  $effect(() => {
    if (nameElement && nameElement.innerText !== card.name) {
      nameElement.innerText = card.name;
    }
    if (roleElement && roleElement.innerText !== card.role) {
      roleElement.innerText = card.role;
    }
    if (descElement && descElement.innerText !== card.desc) {
      descElement.innerText = card.desc;
    }
  });

  function handleNameBlur() {
    const newName = nameElement?.innerText.trim();
    if (newName && newName !== card.name && props.onchange) {
      props.onchange({ name: newName });
    }
  }

  function handleRoleBlur() {
    const newRole = roleElement.innerText.trim();
    if (newRole !== card.role && props.onchange) {
      props.onchange({ role: newRole });
    }
  }

  function handleDescBlur() {
    const newDesc = descElement?.innerText.trim();
    if (newDesc && newDesc !== card.desc && props.onchange) {
      props.onchange({ desc: newDesc });
    }
  }

  function handleSecretsBlur() {
    const newSecrets = secretsElement ? parseSecrets(secretsElement.innerHTML) : [];
    if (JSON.stringify(newSecrets) !== JSON.stringify(card.secrets) && props.onchange) {
      props.onchange({ secrets: newSecrets });
    }
  }

  function addSecret() {
    const newSecrets = [...(card.secrets || []), 'Label: Description'];
    if (props.onchange) {
      props.onchange({ secrets: newSecrets });
    }
  }

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
</script>

{#if card}
<CardBase theme={activeTheme} showCropMarks={showCropMarks}>
  <div 
    class="card-content"
    class:preview={preview}
  >
    <!-- Content box -->
    <div class="content">
      <!-- Content flourishes -->
      <svg class="flourish content-flourish top-left" viewBox="0 0 100 100">
        <use href="#flourish-{activeTheme}" />
      </svg>
      <svg class="flourish content-flourish top-right" viewBox="0 0 100 100">
        <use href="#flourish-{activeTheme}" />
      </svg>

      <h2 
        class="title back"
        contenteditable={editable}
        onblur={handleNameBlur}
        bind:this={nameElement}
      >{card.name}</h2>
      <div 
        class="role" 
        contenteditable={editable}
        onblur={handleRoleBlur}
        bind:this={roleElement}
      >{card.role}</div>
      <p 
        contenteditable={editable}
        class="desc"
        onblur={handleDescBlur}
        bind:this={descElement}
      >{card.desc}</p>
      <div class="secrets">
        <div 
          class="secrets-content"
          contenteditable={editable}
          onblur={handleSecretsBlur}
          bind:this={secretsElement}
        >{@html formatSecrets(card.secrets)}</div>
        {#if editable}
          <button 
            class="add-secret"
            onclick={addSecret}
          >
            Add Secret
          </button>
        {/if}
      </div>
    </div>
  </div>
</CardBase>
{/if}

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

  /* Content flourishes */
  .flourish {
    width: var(--flourish-size);
    aspect-ratio: var(--flourish-aspect);
    pointer-events: none;
    z-index: 2;
    color: var(--flourish-color);
    opacity: var(--flourish-opacity);
  }

  .content-flourish {
    width: var(--content-flourish-size);
    aspect-ratio: var(--content-flourish-aspect);
    position: absolute;
  }

  .content-flourish.top-left {
    left: calc(-1 * var(--content-box-border-width, 0px));
    top: calc(-1 * var(--content-box-border-width, 0px));
    opacity: var(--flourish-content-top-left-opacity);
  }

  .content-flourish.top-right {
    right: calc(-1 * var(--content-box-border-width, 0px));
    top: calc(-1 * var(--content-box-border-width, 0px));
    transform: rotate(90deg);
    opacity: var(--flourish-content-top-right-opacity);
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

  h2.title {
    margin: 0;
    font-size: 1.2em;
    font-weight: var(--theme-title-weight);
    font-family: var(--theme-title-font);
    text-align: var(--title-text-align);
    line-height: var(--title-line-height, 1.2);
  }

  /* For larger containers (tarot size), use theme's title size */
  @container (min-width: 63mm) {
    h2.title {
      font-size: var(--title-font-size);
    }
  }

  .role {
    margin: var(--content-gap) 0 0;
    font-size: 0.6em;  /* Half of the original 1.2em */
    font-weight: var(--theme-title-weight);
    font-family: var(--theme-title-font);
    text-align: var(--title-text-align);
    line-height: var(--title-line-height, 1.2);
  }

  /* For larger containers (tarot size), use theme's role size */
  @container (min-width: 63mm) {
    .role {
      font-size: calc(var(--role-font-size) * 0.5);  /* Half of the theme role size */
    }
  }

  .desc {
    margin: var(--content-gap) 0;
    font-size: 1em;
    line-height: var(--body-line-height, 1.4);
    text-align: var(--desc-text-align);
    font-family: var(--theme-body-font);
  }

  /* For larger containers (tarot size), use theme's desc size */
  @container (min-width: 63mm) {
    .desc {
      font-size: var(--desc-font-size);
    }
  }

  .secrets {
    position: relative;
    border: var(--content-box-border-width) var(--frame-style) var(--theme-primary);
    padding: var(--content-gap);
    border-radius: var(--content-box-radius);
    min-height: 40mm;
    margin: 0;
    font-family: var(--theme-body-font);
  }

  .secrets legend {
    font-size: 1em;
    color: var(--theme-text);
    font-weight: normal;
    padding: 0 1mm;
    font-family: var(--theme-body-font);
  }

  /* For larger containers (tarot size), use theme's UI size */
  @container (min-width: 63mm) {
    .secrets legend {
      font-size: var(--ui-font-size);
    }
  }

  .secrets-content {
    min-height: 35mm;
    white-space: pre-wrap;
    font-size: 1em;
    line-height: var(--body-line-height, 1.4);
  }

  /* For larger containers (tarot size), use theme's trait size */
  @container (min-width: 63mm) {
    .secrets-content {
      font-size: var(--trait-font-size);
    }
  }

  .secrets-content :global(.secret-label) {
    font-weight: bold;
    color: var(--theme-text);
    opacity: 0.8;
    display: inline-block;
    min-width: 5em;
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
</style> 