<script lang="ts">
    import type { HeaderProps } from './types';

    const { title, subtitle, back }: HeaderProps = $props();
</script>

<header class="header">
    <h1 class="header-title">{title}</h1>
    <p class="header-subtitle">{subtitle}</p>
</header>

<style>
    .header {
        display: flex;
        flex-direction: column;
        max-width: 100cqw;
        font-size: var(--font-size);
        margin: 0.6em 0.8em;
    }
    .header-title {
        font-family: var(--font-title);
        color: var(--accent);
        margin: 0;
        font-size: 1.2em;
    }

    .header-subtitle {
        margin: 0;
    }
</style>