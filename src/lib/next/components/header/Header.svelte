<script lang="ts">
    import type { HeaderProps } from './types';

    const { title, subtitle, back }: HeaderProps = $props();
</script>

<header class="header" class:back={back}>
    <h1 class="header-title">{title}</h1>
    <p class="header-subtitle">{subtitle}</p>
</header>

<style>
    @import './Header.css';
</style>