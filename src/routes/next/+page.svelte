<script lang="ts">
    import Page from '$lib/next/components/page/Page.svelte';
    import Card from '$lib/next/components/card/Card.svelte';
    import Header from '$lib/next/components/header/Header.svelte';
    import StatFocus from '$lib/next/components/stats/StatFocus.svelte';
    import StatBlock from '$lib/next/components/stats/StatBlock.svelte';
    import TraitList from '$lib/next/components/traits/TraitList.svelte';

    import { mockDeck } from './mocks';
    
    let isPoker = false;
</script>

<section class="deck">
    <h1>New Card Layout Test</h1>
    
    <label>
        <input type="checkbox" bind:checked={isPoker} />
        Poker size
    </label>
    
    <Page layout={isPoker ? 'poker' : 'tarot'}>
        <!-- Front of card - role as subtitle -->
         {#each mockDeck as card}
            <Card>
                <Header 
                    title={card.name} 
                    subtitle={card.subtitle} 
                />
                <StatFocus stats={card.stats} />
                <TraitList />
            </Card>
        {/each}
    </Page>

    <Page layout={isPoker ? 'poker' : 'tarot'}>
        {#each mockDeck as card}
            <Card>
                <Header 
                    back
                    title={card.name} 
                    subtitle={card.description} 
                 />
                <StatBlock />
                <TraitList back />
            </Card>
        {/each}
    </Page>
</section>

<style>
    .deck {
        margin: 20px auto;
    }

    :global(.page), :global(.page *) {
        box-sizing: border-box;
    }

    :global(body) {
        margin: 0;
        padding: 0;
    }
    
    h1 {
        margin-bottom: 1rem;
    }
    
    label {
        display: block;
        margin-bottom: 1rem;
    }
</style>
