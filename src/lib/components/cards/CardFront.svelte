<script lang="ts">
  import type { Card } from '$lib/types';
  import CardBase from './CardBase.svelte';
  import CardStatSelector from './CardStatSelector.svelte';
  import { currentDeck } from '$lib/stores/deck';
  import { getDeckContext } from '$lib/stores/deckContext';
  import ImageSelector from '../ui/ImageSelector.svelte';
  import { debounce } from '$lib/utils/debounce';
  import { formatTraits, parseTraits, addTrait } from '$lib/utils/card-utils';
  import { ImageUrlManager } from '$lib/utils/image-handler';

  // Props - only for theme and preview
  const props = $props<{
    card: Card;
    theme?: string;
    preview?: boolean;
  }>();
  const theme = props.theme;
  const preview = props.preview ?? false;
  const activeTheme = $derived(theme ?? $currentDeck?.meta?.theme ?? 'classic');

  // Get deck context
  const deckContext = getDeckContext();

  // Get card from context
  const cardId = props.card.id;
  function getCard(id: string): Card {
    if (preview) {
      return props.card;
    }
    const found = $currentDeck?.cards.find(c => c.id === id);
    if (!found) {
      return props.card; 
    }
    return found;
  }
  const card = $derived(getCard(cardId));

  function handleNameBlur(e: FocusEvent) {
    const newName = (e.target as HTMLElement).textContent?.trim() || '';
    if (newName !== card.name) {
      deckContext.updateCard(card.id, 'name', newName);
    }
  }

  // Image URL management
  let imageManager = $state(new ImageUrlManager());
  
  // Update image manager when card changes
  $effect(() => {
    imageManager.updateBlob(card.imageBlob);
  });
  
  // Determine which image to use - blob URL takes priority over regular URL
  const backgroundStyle = $derived(() => {
    const blobUrl = imageManager.url;
    const regularUrl = card.image;
    
    if (blobUrl) {
      return `url('${blobUrl}')`;
    } else if (regularUrl) {
      return `url('${regularUrl}')`;
    }
    return 'none';
  });

  // Elements
  let roleElement = $state<HTMLDivElement | null>(null);
  let traitsElement = $state<HTMLDivElement | null>(null);
  let showImageSelector = $state(false);

  // Image selector
  async function handleImageSave(blob: Blob | null, previewUrl: string | undefined) {
    await deckContext.updateCard(card.id, 'image', previewUrl || null);
    if (blob !== undefined) {
      await deckContext.updateCard(card.id, 'imageBlob', blob || undefined);
    }
    showImageSelector = false;
  }


  function handleRoleBlur() {
    const newRole = roleElement?.innerText.trim();
    if (newRole !== card.role) {
      deckContext.updateCard(card.id, 'role', newRole);
    }
  }

  function handleTraitsBlur() {
    const newTraits = parseTraits(traitsElement?.innerHTML || '');
    if (JSON.stringify(newTraits) !== JSON.stringify(card.traits)) {
      deckContext.updateCard(card.id, 'traits', newTraits);
    }
  }

  function handleAddTrait() {
    const newTraits = addTrait(card.traits);
    deckContext.updateCard(card.id, 'traits', newTraits);
  }

  // Cleanup on destroy
  $effect.root(() => {
    return () => {
      imageManager.destroy();
    };
  });
</script>

{#if card}
<CardBase theme={activeTheme}>
  <div 
    class="card-content"
    class:preview={preview}
    style:background-image={backgroundStyle}
  >
    <!-- Top portrait flourishes -->
    <svg class="flourish portrait-flourish top-left" viewBox="0 0 100 100">
      <use href="#flourish-{activeTheme}" />
    </svg>
    {#if !card.stat}
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
          onclick={() => showImageSelector = true}
          title={card.image ? "Change image" : "Add image"}
        >
          {card.image ? "Change image" : "Add image"}
        </button>

        {#if showImageSelector}
          <div class="image-input">
            <ImageSelector 
              onSave={handleImageSave}
              onClose={() => showImageSelector = false}
              hasExistingImage={!!card.image}
            />
          </div>
        {/if}
      </div>

      <!-- Stat container -->
      <div class="stat-container">
        <CardStatSelector {card} />
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
        onblur={handleNameBlur}
      >{card.name}</h2>
      <div 
        class="role" 
        contenteditable="true"
        onblur={handleRoleBlur}
        bind:this={roleElement}
      >{card.role}</div>
      <div class="traits">
        <div 
          class="traits-content" 
          contenteditable="true"
          onblur={handleTraitsBlur}
          bind:this={traitsElement}
        >{@html formatTraits(card.traits)}</div>
        <button 
          class="add-trait"
          onclick={handleAddTrait}
        >
          Add Trait
        </button>
      </div>
    </div>
  </div>
</CardBase>
{/if}

<style>
  .card-content {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--theme-background);
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
    position: relative;
    margin: var(--content-gap) 0 0;
    padding-top: var(--content-gap);
    border-top: calc(var(--divider-width) * var(--show-dividers)) var(--divider-style) var(--theme-primary);
  }

  .traits-content {
    white-space: pre-wrap;
    line-height: var(--body-line-height, 1.4);
    font-size: var(--trait-font-size);
    position: relative;
    z-index: 3;
    text-align: var(--desc-text-align);
    font-family: var(--theme-body-font);
  }

  .traits-content :global(.trait-label) {
    font-weight: bold;
    color: var(--theme-text);
    opacity: 0.8;
    display: inline-block;
    min-width: 5em;
  }

  .add-trait {
    position: absolute;
    bottom: 0;
    right: 0;
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

  .traits:hover .add-trait {
    opacity: 0.8;
  }

  .add-trait:hover {
    opacity: 1 !important;
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

  @container (height < 20mm) {
    .portrait-container {
      display: none;
    }
    .traits {
      display: none;
    }
  }

  @media print {
    .change-portrait,
    .image-input {
      display: none;
    }
    .add-trait {
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