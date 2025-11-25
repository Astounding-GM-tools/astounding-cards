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

	// Check if image is currently being generated
	let isGenerating = $derived(card.imageMetadata?.isGenerating || false);

	// Cleanup on destroy
	$effect(() => {
		return () => {
			imageUrlManager.destroy();
		};
	});
</script>

<div class="image-container">
	{#if imageUrl()}
		<img src={imageUrl()} alt={card.title} loading="lazy" class:generating={isGenerating} />
	{/if}

	{#if isGenerating}
		<div class="generating-overlay">
			<div class="spinner-container">
				<div class="spinner"></div>
				<p>Generating...</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.image-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
	}

	img {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center top;
	}

	img.generating {
		opacity: 0.4;
		filter: blur(2px);
	}

	.generating-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.spinner-container {
		text-align: center;
		background: rgba(255, 255, 255, 0.95);
		padding: 1rem 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e2e8f0;
		border-top-color: #059669;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 0.5rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.spinner-container p {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 500;
		color: #1a202c;
	}
</style>
