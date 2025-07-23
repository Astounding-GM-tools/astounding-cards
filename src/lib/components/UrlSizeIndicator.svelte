<script lang="ts">
  import { deckToUrl } from '$lib/stores/cards';
  import type { CharacterDeck } from '$lib/types';

  export let deck: CharacterDeck;
  
  $: urlSize = new TextEncoder().encode(deckToUrl(deck)).length;
  $: sizeInKB = (urlSize / 1024).toFixed(1);
  $: warningLevel = urlSize > 30000 ? 'high' : urlSize > 25000 ? 'medium' : 'low';
</script>

<div class="size-indicator {warningLevel}">
  URL Size: {sizeInKB}KB
  {#if warningLevel === 'high'}
    <span class="warning">Near limit - consider creating new deck</span>
  {:else if warningLevel === 'medium'}
    <span class="warning">Approaching size limit</span>
  {/if}
</div>

<style>
  .size-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: var(--ui-font-size);
    font-family: var(--ui-font-family);
  }

  .low {
    background: rgba(76, 175, 80, 0.1);
    color: var(--toast-success);
  }

  .medium {
    background: rgba(255, 152, 0, 0.1);
    color: var(--toast-warning);
  }

  .high {
    background: rgba(244, 67, 54, 0.1);
    color: var(--toast-error);
  }

  .warning {
    font-style: italic;
    font-family: var(--ui-font-family);
  }
</style> 