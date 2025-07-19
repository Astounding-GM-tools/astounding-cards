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
    font-size: 0.9rem;
  }

  .low {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .medium {
    background: #fff3e0;
    color: #f57c00;
  }

  .high {
    background: #ffebee;
    color: #c62828;
  }

  .warning {
    font-style: italic;
  }
</style> 