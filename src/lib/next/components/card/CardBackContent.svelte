<script lang="ts">
    import type { Card } from '../../types/card.js';
    import Header from '../header/Header.svelte';
    import StatBlock from '../stats/StatBlock.svelte';
    import TraitList from '../traits/TraitList.svelte';
    
    interface Props {
        card: Card;
    }
    
    let { card }: Props = $props();
</script>

<Header title={card.title} subtitle={card.description} />
<StatBlock stats={card.stats} />
<TraitList traits={card.traits.filter((trait) => !trait.isPublic)} />
