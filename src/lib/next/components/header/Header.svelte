<script lang="ts">
    import type { HeaderProps } from './types';

    const { title, subtitle }: HeaderProps = $props();
</script>

<header class="header">
    <h1 class="header-title">{title}</h1>
    <p class="header-subtitle">{subtitle}</p>
</header>

<style>
    @import './Header.css';
</style>