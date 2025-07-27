<script lang="ts">
  import type { Character } from '$lib/types';
  import Card from './Card.svelte';
  import CardStatSelector from './CardStatSelector.svelte';
  import { currentDeck } from '$lib/stores/cards';
  import ImageSelector from './ImageSelector.svelte';

  let { character, showCropMarks = false, onChange, theme = undefined } = $props();
  let showImageInput = $state(false);

  let nameElement = $state<HTMLElement>();
  let roleElement = $state<HTMLElement>();
  let traitsElement = $state<HTMLElement>();

  let currentBlobUrl = $state<string | undefined>();

  // Get the correct portrait URL
  function getPortraitUrl(portrait: string | undefined) {
    if (!portrait) return 'none';

    // If it's already a full URL, use it as is
    if (portrait.startsWith('http')) {
      return portrait;
    }

    // If it's a local portrait (no protocol/blob prefix)
    if (!portrait.includes(':')) {
      return `/portraits/${portrait}`;
    }

    // If we have a blob URL, use it
    if (currentBlobUrl) {
      return currentBlobUrl;
    }

    return 'none';
  }

  // Handle blob URL creation in a separate effect
  $effect(() => {
    if (character.portrait === 'blob:local' && character.portraitBlob && !currentBlobUrl) {
      currentBlobUrl = URL.createObjectURL(character.portraitBlob);
    }
  });

  // Cleanup blob URL when component is destroyed
  $effect(() => {
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = undefined;
      }
    };
  });

  // Update DOM elements when character changes
  $effect(() => {
    if (nameElement && nameElement.innerText !== character.name) {
      nameElement.innerText = character.name;
    }
    if (roleElement && roleElement.innerText !== character.role) {
      roleElement.innerText = character.role;
    }
  });

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

  function toggleImageInput() {
    showImageInput = !showImageInput;
  }

  const activeTheme = $derived(theme ?? $currentDeck?.meta?.theme ?? 'classic');
</script>

{#if character}
<Card {showCropMarks} theme={activeTheme}>
  <div 
    class="card-content"
    class:preview={character.type === 'Preview'}
    style:background-image={`url('${getPortraitUrl(character.portrait)}')`}
    style:background-size="cover"
    style:background-position="top center"
  >
    <!-- Top portrait flourishes -->
    <svg class="flourish portrait-flourish top-left" viewBox="0 0 100 100">
      <use href="#flourish-{activeTheme}" />
    </svg>
    {#if !character.stat}
    <svg class="flourish portrait-flourish top-right" viewBox="0 0 100 100">
      <use href="#flourish-{activeTheme}" />
    </svg>
    {/if}
    
    <!-- Portrait area with controls and bottom flourishes -->
    <div class="portrait-area">
      <!-- Portrait controls -->
      <div class="portrait-container">
        <button 
          class="change-portrait" 
          onclick={toggleImageInput}
          title={character.portrait ? "Change portrait" : "Add portrait"}
        >
          {character.portrait ? "Change portrait" : "Add portrait"}
        </button>

        {#if showImageInput}
          <div class="image-input">
            <ImageSelector 
              onSave={async (blob, sourceUrl) => {
                // Store both the source URL (if provided) and the blob
                await onChange({ 
                  portrait: sourceUrl || 'blob:local',
                  portraitBlob: blob
                });
              }}
              onClose={() => showImageInput = false}
            />
          </div>
        {/if}
      </div>

      <!-- Stat container -->
      <div class="stat-container">
        <CardStatSelector {character} {onChange} />
      </div>

      <!-- Bottom portrait flourishes -->
      <div class="bottom-flourishes">
        <svg class="flourish portrait-flourish bottom-left" viewBox="0 0 100 100">
          <use href="#flourish-{activeTheme}" />
        </svg>
        <svg class="flourish portrait-flourish bottom-right" viewBox="0 0 100 100">
          <use href="#flourish-{activeTheme}" />
        </svg>
      </div>
    </div>

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
        class="title front"
        contenteditable="true" 
        onblur={updateName}
        bind:this={nameElement}
      >{character.name}</h2>
      <div 
        class="role" 
        contenteditable="true"
        onblur={updateRole}
        bind:this={roleElement}
      >{character.role}</div>
      <div 
        class="traits" 
        contenteditable="true"
        onblur={updateTraits}
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
    background-color: var(--theme-background);
    background-image: var(--portrait-url);
    background-size: cover;
    background-position: top center;
    container-type: inline-size;
    width: 100%;
    font-size: var(--base-font-size);
    padding: var(--content-gap);
  }

  .portrait-area {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .bottom-flourishes {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    margin-top: auto;
  }

  .flourish {
    width: var(--flourish-size);
    aspect-ratio: var(--flourish-aspect);
    pointer-events: none;
    z-index: 2;
    color: var(--flourish-color);
  }

  /* Portrait flourishes */
  .portrait-flourish {
    width: var(--portrait-flourish-size);
    aspect-ratio: var(--portrait-flourish-aspect);
  }

  .portrait-flourish.top-left {
    position: absolute;
    left: 0;
    top: 0;
    opacity: var(--flourish-portrait-top-left-opacity);
  }

  .portrait-flourish.top-right {
    position: absolute;
    right: 0;
    top: 0;
    transform: rotate(90deg);
    opacity: var(--flourish-portrait-top-right-opacity);
  }

  .portrait-flourish.bottom-left {
    transform: rotate(-90deg);
    opacity: var(--flourish-portrait-bottom-left-opacity);
  }

  .portrait-flourish.bottom-right {
    transform: rotate(180deg);
    opacity: var(--flourish-portrait-bottom-right-opacity);
  }

  /* Content flourishes */
  .content-flourish {
    width: var(--content-flourish-size);
    aspect-ratio: var(--content-flourish-aspect);
  }

  .content-flourish.top-left {
    position: absolute;
    left: calc(-1 * var(--content-box-border-width, 0px));
    top: calc(-1 * var(--content-box-border-width, 0px));
    z-index: 1;  /* Put behind text */
    opacity: var(--flourish-content-top-left-opacity);
  }

  .content-flourish.top-right {
    position: absolute;
    right: calc(-1 * var(--content-box-border-width, 0px));
    top: calc(-1 * var(--content-box-border-width, 0px));
    transform: rotate(90deg);
    z-index: 1;  /* Put behind text */
    opacity: var(--flourish-content-top-right-opacity);
  }

  /* Debug styles for flourishes - only show in dev mode */
  :global(.dev-mode) .flourish {
    border-top: 2px solid #ff3e00;  /* Svelte orange for debug borders */
    border-left: 2px solid #ff3e00;
  }

  :global(.dev-mode) .portrait-flourish.top-left { background-color: rgba(255,0,0,0.3); }
  :global(.dev-mode) .portrait-flourish.top-right { background-color: rgba(0,255,0,0.3); }
  :global(.dev-mode) .portrait-flourish.bottom-left { background-color: rgba(0,0,255,0.3); }
  :global(.dev-mode) .portrait-flourish.bottom-right { background-color: rgba(255,0,255,0.3); }

  :global(.dev-mode) .content-flourish.top-left { background-color: rgba(255,255,0,0.3); }
  :global(.dev-mode) .content-flourish.top-right { background-color: rgba(0,255,255,0.3); }

  /* Portrait and stat containers */
  .portrait-container {
    position: absolute;
    top: var(--page-margin);
    left: var(--page-margin);
  }

  .stat-container {
    position: absolute;
    top: var(--page-margin);
    right: var(--page-margin);
  }

  /* Content section */
  .content {
    position: relative;
    background: var(--content-box-bg);
    color: var(--theme-text);
    opacity: var(--content-opacity, 1);
    padding: var(--content-gap);
    border-radius: var(--content-box-radius);
    border: var(--content-box-border-width) var(--frame-style) var(--theme-primary);
    box-shadow: var(--content-box-shadow);
    overflow: hidden;  /* Keep flourishes contained */
  }

  h2.title {
    margin: 0 auto;
    max-width: 80%;
    font-size: 1.2em;
    font-weight: var(--theme-title-weight);
    font-family: var(--theme-title-font);
    text-align: var(--title-text-align);
    line-height: var(--title-line-height, 1.2);
    position: relative;
    z-index: 3;  /* Ensure text stays on top */
  }

  /* For larger containers (tarot size), use theme's title size */
  @container (min-width: 63mm) {
    h2.title {
      font-size: var(--title-font-size);
    }
  }

  /* Preview cards should still use smaller font */
  .card-content.preview .title {
    font-size: calc(var(--title-font-size) * 0.8);
  }

  .role {
    margin: 0.25rem auto 0;
    max-width: 80%;
    text-align: var(--role-text-align);
    font-family: var(--role-font-family, var(--theme-body-font));
    font-size: var(--role-font-size);
    line-height: var(--role-line-height, 1.2);
    position: relative;
    z-index: 3;
  }

  .traits {
    margin-top: var(--content-gap);
    font-family: var(--theme-body-font);
    border-top: calc(var(--divider-width) * var(--show-dividers)) var(--divider-style) var(--theme-primary);
    padding-top: var(--content-gap);
    white-space: pre-wrap;
    line-height: var(--body-line-height, 1.4);
    font-size: var(--trait-font-size);
    position: relative;
    z-index: 3;
    text-align: var(--desc-text-align);
  }

  .traits :global(.trait-label) {
    font-weight: bold;
    color: var(--theme-text);
    opacity: 0.8;
    display: inline-block;
    min-width: 5em;
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
    right: 0;
    background: var(--theme-bg, white);
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 10;
  }

  .image-input :global(.image-selector) {
    margin-bottom: 0.5rem;
  }

  .image-input input {
    border: 1px solid var(--theme-primary);
    padding: 1mm;
    border-radius: 0.5mm;
    min-width: 30mm;
    font-size: var(--ui-font-size);
  }

  .image-input button {
    border: none;
    background: var(--theme-primary);
    color: var(--content-box-bg);
    padding: 1mm 2mm;
    border-radius: 0.5mm;
    cursor: pointer;
    font-size: var(--ui-font-size);
  }

  .image-input button:hover {
    opacity: 0.8;
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

  /* Preview card styles */
  .card-content.preview {
    font-size: calc(var(--base-font-size) * 0.8);
  }

  .card-content.preview .role {
    font-size: calc(var(--role-font-size) * 0.8);
  }

  .card-content.preview .traits {
    font-size: calc(var(--trait-font-size) * 0.8);
  }

  .card-content.preview .traits :global(.trait-label) {
    min-width: clamp(15mm, 20cqw, 25mm);
  }

  .card-content.preview .portrait-container,
  .card-content.preview .image-input {
    display: none;
  }
</style> 