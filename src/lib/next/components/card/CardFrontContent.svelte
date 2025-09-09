<script lang="ts">
    import type { Card } from '../../types/card.js';
    import CardImage from '../image/CardImage.svelte';
    import Header from '../header/Header.svelte';
    import StatFocus from '../stats/StatFocus.svelte';
    import TraitList from '../traits/TraitList.svelte';
    
    interface Props {
        card: Card;
    }
    
    let { card }: Props = $props();
</script>

<CardImage {card} />

<div class="card-content-front">
    <Header title={card.title} subtitle={card.subtitle} />
    <TraitList traits={card.traits.filter((trait) => trait.isPublic)} />
    <StatFocus stats={card.stats} />
</div>

<style>
    .card-content-front {
        display: flex;
        flex-direction: column;
        margin: auto 0.8em 0.8em 0.8em;
        background: white;
        border-radius: 0.2em;
        box-shadow: 0 0 0.6em 0 rgba(0, 0, 0, 0.1);
        z-index: 10;
    }
</style>
