<script lang="ts">
    import type { Stat } from '$lib/next/types/card';

    const { stats = [] } = $props<{
        stats: Stat[];
    }>();
</script>

<section class="stat-focus">
    {#each stats.filter((stat: Stat) => stat.isPublic) as stat}
        <article class="stat-item">
            <div class="stat-item-label">{stat.title}</div>
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
        margin: 1em;
        font-size: var(--font-size);
    }

    .stat-item {
        align-items: center;
        width: var(--stat-size);
        height: var(--stat-size);
        background: white;
        border-radius: 50%;
        border: 2px solid var(--accent);
        color: var(--accent);
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0.4em;
        text-align: center;
    }

    .stat-item-label {
        font-size: 0.6em;
    }

    .stat-item-value {
        font-size: 0.9em;
    }
</style>