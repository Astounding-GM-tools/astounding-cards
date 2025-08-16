<script lang="ts">
    import Page from '$lib/next/components/page/Page.svelte';
    import Card from '$lib/next/components/card/Card.svelte';
    import Header from '$lib/next/components/header/Header.svelte';
    import StatFocus from '$lib/next/components/stats/StatFocus.svelte';
    import StatBlock from '$lib/next/components/stats/StatBlock.svelte';
    import TraitList from '$lib/next/components/traits/TraitList.svelte';
    import type { Card as CardType } from '$lib/next/types/card';
    
    let isPoker = false;

    const mockCard: CardType = {
        id: 'test-1',
        name: 'Mountain Pass',
        subtitle: 'Treacherous Route',
        description: 'A narrow passage through the mountains',
        image: null,
        traits: [
            { label: 'Terrain', value: 'Mountain', isPublic: true },
            { label: 'Climate', value: 'Cold', isPublic: true },
            { label: 'Secret', value: 'Hidden Cave', isPublic: false }
        ],
        stats: [
            { id: 'defense', name: 'Defense', value: 15, tracked: false, isPublic: true },
            { id: 'population', name: 'Population', value: '50 Bandits', tracked: false, isPublic: false },
            { id: 'area', name: 'Area', value: '2 miles', tracked: false, isPublic: true }
        ]
    };
</script>

<section class="test-layout">
    <h1>New Card Layout Test</h1>
    
    <label>
        <input type="checkbox" bind:checked={isPoker} />
        Poker size
    </label>
    
    <Page layout={isPoker ? 'poker' : 'tarot'}>
        <!-- Front of card - role as subtitle -->
        <Card>
            <div class="front">
                <Header title={mockCard.name} subtitle={mockCard.subtitle} />
                <StatFocus />
                <TraitList />
            </div>
        </Card>

        <!-- Back of card - description as subtitle -->
        <Card>
            <div class="back">
                <Header title={mockCard.name} subtitle={mockCard.description} />
                <StatBlock />
                <TraitList />
            </div>
        </Card>
    </Page>
</section>

<style>
    .test-layout {
        margin: 20px auto;
        width: 100%;
        max-width: 1000px;
    }
    
    h1 {
        margin-bottom: 1rem;
    }
    
    label {
        display: block;
        margin-bottom: 1rem;
    }

    .front, .back {
        height: 100%;
        padding: var(--card-padding);
        display: flex;
        flex-direction: column;
        gap: var(--section-spacing);
    }

    .front {
        background: var(--color-background);
        color: var(--color-text);
    }

    .back {
        background: white;
        color: black;
    }
</style>
