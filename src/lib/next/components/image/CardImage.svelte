<!--
    CardImage.svelte
    
    Displays card images for the Next system.
    Handles both blob URLs and regular URLs.
-->
<script lang="ts">
    import type { Card } from '../../types/card.js';
    import { ImageUrlManager } from '$lib/utils/image-handler.js';
    
    const { card } = $props<{
        card: Card;
    }>();
    
    let imageUrlManager = $state(new ImageUrlManager());
    
    // Derived image URL - prioritize blob, fall back to image URL
    let imageUrl = $derived(() => {
        if (card.imageBlob) {
            imageUrlManager.updateBlob(card.imageBlob);
            return imageUrlManager.url;
        } else if (card.image) {
            imageUrlManager.updateBlob(null);
            return card.image;
        } else {
            imageUrlManager.updateBlob(null);
            return null;
        }
    });
    
    // Cleanup on destroy
    $effect(() => {
        return () => {
            imageUrlManager.destroy();
        };
    });
</script>

{#if imageUrl()}
    <div class="card-image">
        <img 
            src={imageUrl()} 
            alt={card.title}
            loading="lazy"
        />
    </div>
{/if}

<style>
    .card-image {
        width: 100%;
        height: auto;
        max-height: 40%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 4px;
        margin-bottom: 1em;
    }
    
    .card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
    }
</style>
