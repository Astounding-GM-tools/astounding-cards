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
    <img 
        src={imageUrl()} 
        alt={card.title}
        loading="lazy"
    />
{/if}

<style>
    img {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
    }
</style>
