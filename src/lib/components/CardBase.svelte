<script lang="ts">
  import { currentDeck } from '$lib/stores/deck';

  const props = $props<{
    theme?: string;
  }>();

  const theme = props.theme;
  const activeTheme = $derived(theme ?? $currentDeck?.meta?.theme ?? 'classic');
</script>

<div class="card-base" data-theme={activeTheme}>
  <slot></slot>
</div>

<style>
  .card-base {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--theme-background);
    border-radius: var(--card-radius);
    overflow: hidden;
    box-shadow: var(--card-shadow);
  }

  @media print {
    .card-base {
      box-shadow: none;
      border: none;
    }
  }
</style> 