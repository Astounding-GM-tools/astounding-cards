<script lang="ts">
  import '$lib/styles/global.css';
  import { currentDeck } from '$lib/stores/cards';
  import { onMount } from 'svelte';

  // Update theme on root element
  $: if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = $currentDeck?.meta.theme || 'classic';
  }
</script>

<slot /> 