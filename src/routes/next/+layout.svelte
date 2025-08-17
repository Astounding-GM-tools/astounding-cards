<script lang="ts">
    import '$lib/next/styles/properties.css';
    import Dialog from '$lib/next/components/dialog/Dialog.svelte';
    import Toasts from '$lib/components/ui/Toasts.svelte';
    import type { Snippet } from 'svelte';

    const { children } = $props<{
        children?: Snippet;
    }>();
</script>

{@render children()}

<Dialog />
<Toasts />