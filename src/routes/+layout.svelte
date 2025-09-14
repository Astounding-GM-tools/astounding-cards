<script lang="ts">
  import '$lib/styles/global.css';
  import { currentDeck } from '$lib/stores/deck';
  import { onMount } from 'svelte';
  import { inject } from '@vercel/analytics';
  import Toasts from '$lib/components/ui/Toasts.svelte';
  
  // Initialize Vercel Web Analytics
  inject();
</script>

<slot />
<Toasts />
