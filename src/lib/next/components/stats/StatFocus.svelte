<script lang="ts">
    import type { Stat } from '$lib/next/types/card';

    const { stats = [] } = $props<{
        stats: Stat[];
    }>();
</script>

<section class="stat-focus">
    {#each stats.filter((stat: Stat) => stat.isPublic) as stat}
        <article class="stat-item" data-id={stat.id}>
            <div class="stat-item-label">{stat.name}</div>
            <div class="stat-item-value">{stat.value}</div>
        </article>
    {/each}
</section>

<style>
    .stat-focus {
        --stat-size: 3em;
        position: absolute;
        top: 0;
        right: 0;
        width: fit-content;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.5em;
        margin: 0.5em;
        font-size: var(--font-size);
        --border-radius: 50%;
    }

    .stat-item[data-id="defense"] {
        --border-radius: 0 0 50% 50%;
    }

    .stat-item[data-id="value"] {
        --border-radius: 1cqw;
    }

    .stat-item {
        align-items: center;
        width: var(--stat-size);
        height: var(--stat-size);
        background: white;
        border-radius: var(--border-radius);
        border: 2px solid var(--accent);
        color: var(--accent);
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0.4em;
        text-align: center;
    }

    .stat-item[data-id="health"] {
        position: relative;
        width: var(--stat-size);
        height: var(--stat-size);
        padding: 0;
        margin-top: -4cqw;
        background: none;
        border: none;
    }

    .stat-item[data-id="health"]::before,
    .stat-item[data-id="health"]::after {
        content: '';
        position: absolute;
        top: 0;
        width: calc(var(--stat-size) * 0.5);
        height: calc(var(--stat-size) * 0.8);
        background: var(--accent);
        border: 2px solid var(--accent);
        border-radius: calc(var(--stat-size) * 0.5) calc(var(--stat-size) * 0.5) 0 0;
        color: white;
    }

    .stat-item[data-id="health"]::before {
        left: 12%;
        transform: rotate(45deg);
        transform-origin: 0 100%;
    }

    .stat-item[data-id="health"]::after {
        left: 36%;
        transform: rotate(-45deg);
        transform-origin: 100% 100%;
        border-right: none;
    }

    .stat-item[data-id="health"] .stat-item-label {
        display: none;
    }

    .stat-item[data-id="health"] .stat-item-value {
        position: relative;
        top: 28%;
        z-index: 1;
        color: white;
        font-size: 1.2em;
    }

    .stat-item-label {
        font-size: 0.6em;
    }

    .stat-item-value {
        font-size: 0.9em;
    }
</style>