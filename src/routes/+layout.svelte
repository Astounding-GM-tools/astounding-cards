<script lang="ts">
  import '$lib/styles/global.css';
  import { currentDeck } from '$lib/stores/deck';
  import { onMount } from 'svelte';
  import Toasts from '$lib/components/ui/Toasts.svelte';
</script>

<slot />
<Toasts />
