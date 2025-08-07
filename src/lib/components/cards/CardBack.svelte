<!-- CardBack.svelte -->
<script lang="ts">
  import type { Card } from '$lib/types';
  import CardBase from './CardBase.svelte';
  import { currentDeck } from '$lib/stores/deck';
  import { canonUpdateCard, isFieldLoading } from '$lib/stores/canonUpdate';
  import { formatSecrets, parseSecrets, addSecret } from '$lib/utils/card-utils';
  import CardMechanicsDisplay from './CardMechanicsDisplay.svelte';
  import CardMechanicsDialog from './CardMechanicsDialog.svelte';
  import StatblockTemplateDialog from '../StatblockTemplateDialog.svelte';
  import type { CardMechanic } from '$lib/types';
  import type { StatblockTemplate } from '$lib/statblockTemplates';
  import { instantiateTemplate } from '$lib/statblockTemplates';

  // Props - only for theme, preview, and editable
  const props = $props<{
    card: Card;
    theme?: string;
    preview?: boolean;
    editable?: boolean;
  }>();
  const theme = props.theme;
  const preview = props.preview ?? false;
  const editable = props.editable ?? true;
  const activeTheme = $derived(theme ?? $currentDeck?.meta?.theme ?? 'classic');

  // Get loading states for different fields
  const isNameUpdating = $derived(isFieldLoading('card-back-name'));
  const isDescUpdating = $derived(isFieldLoading('card-back-desc'));
  const isSecretsUpdating = $derived(isFieldLoading('card-back-secrets'));

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
  

  async function handleNameBlur(e: FocusEvent) {
    if (!editable) return;
    const newName = (e.target as HTMLElement).textContent?.trim() || '';
    if (newName !== card.name) {
      await canonUpdateCard(card.id, { name: newName }, ['card-back-name'], 'Updating name...');
    }
  }

  // Elements
  let descElement = $state<HTMLParagraphElement | null>(null);
  let secretsElement = $state<HTMLDivElement | null>(null);
  
  // Dialog state  
  let showMechanicsDialog = $state(false);
  let showTemplateDialog = $state(false);
  let templateDialogCardType = $state('');

  // Subscribe to card updates
  $effect(() => {
  });

  async function handleDescBlur() {
    if (!editable) return;
    const newDesc = descElement?.innerText.trim();
    if (newDesc && newDesc !== card.desc) {
      await canonUpdateCard(card.id, { desc: newDesc }, ['card-back-desc'], 'Updating description...');
    }
  }

  async function handleSecretsBlur() {
    if (!editable) return;
    const newSecrets = secretsElement ? parseSecrets(secretsElement.innerHTML) : [];
    if (JSON.stringify(newSecrets) !== JSON.stringify(card.secrets)) {
      await canonUpdateCard(card.id, { secrets: newSecrets }, ['card-back-secrets'], 'Updating secrets...');
    }
  }

  async function handleAddSecret() {
    if (!editable) return;
    const newSecrets = addSecret(card.secrets);
    await canonUpdateCard(card.id, { secrets: newSecrets }, ['card-back-secrets'], 'Adding secret...');
  }
  
  // Handle template application
  async function handleApplyTemplate(mechanics: CardMechanic[]) {
    if (!editable) return;
    await canonUpdateCard(card.id, { mechanics }, ['card-back-mechanics'], 'Applying template...');
  }
  
  // Handle showing template dialog
  function handleShowTemplateDialog(cardType: string) {
    templateDialogCardType = cardType;
    showTemplateDialog = true;
  }
  
  // Handle template selection
  function handleTemplateSelect(event: CustomEvent<StatblockTemplate>) {
    const template = event.detail;
    const newMechanics = instantiateTemplate(template);
    handleApplyTemplate(newMechanics);
  }
  
  // Handle custom stats creation from template dialog
  function handleCustomStats() {
    showMechanicsDialog = true;
  }
  

</script>

{#if card}
<CardBase theme={activeTheme}>
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
        class:updating={isNameUpdating}
        contenteditable={editable && !isNameUpdating}
        class:disabled={!editable}
        onblur={handleNameBlur}
      >
        {#if isNameUpdating}
          <span class="updating-text">Updating...</span>
        {:else}
          {card.name}
        {/if}
      </h2>
      <p 
        class="desc"
        class:updating={isDescUpdating}
        contenteditable={editable && !isDescUpdating}
        onblur={handleDescBlur}
        bind:this={descElement}
      >
        {#if isDescUpdating}
          <span class="updating-text">Updating...</span>
        {:else}
          {card.desc}
        {/if}
      </p>
      
      <!-- Mechanics Display -->
      <CardMechanicsDisplay 
        card={card} 
        {editable}
        onedit={() => showMechanicsDialog = true}
        onapplytemplate={handleApplyTemplate}
        onshowtemplatedialog={handleShowTemplateDialog}
        on:showTemplateDialog={(event) => handleShowTemplateDialog(event.detail.cardType)}
      />
      
      <div class="secrets">
        <div 
          class="secrets-content"
          class:updating={isSecretsUpdating}
          contenteditable={editable && !isSecretsUpdating}
          onblur={handleSecretsBlur}
          bind:this={secretsElement}
        >
          {#if isSecretsUpdating}
            <span class="updating-text">Updating...</span>
          {:else}
            {@html formatSecrets(card.secrets)}
          {/if}
        </div>
        {#if editable}
          <button 
            class="add-secret"
            onclick={handleAddSecret}
            disabled={isSecretsUpdating}
          >
            {#if isSecretsUpdating}
              Adding...
            {:else}
              Add Secret
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </div>
</CardBase>

{#if showMechanicsDialog}
  <CardMechanicsDialog 
    {card}
    onclose={() => showMechanicsDialog = false}
  />
{/if}
{/if}

<!-- Template Selection Dialog - rendered outside card content -->
{#if showTemplateDialog}
  <StatblockTemplateDialog 
    bind:show={showTemplateDialog}
    cardType={templateDialogCardType}
    on:select={handleTemplateSelect}
    on:custom={handleCustomStats}
    on:cancel={() => showTemplateDialog = false}
  />
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

  .desc {
    margin: var(--content-gap) 0 auto;
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

  .disabled {
    pointer-events: none;
    opacity: 0.7;
  }

  /* Loading states */
  .updating {
    opacity: 0.6;
    pointer-events: none;
  }

  .updating-text {
    font-style: italic;
    opacity: 0.8;
  }

  .add-secret:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style> 