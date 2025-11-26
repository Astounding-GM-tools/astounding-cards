<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import { authenticatedFetch } from '$lib/utils/authenticated-fetch';
	import { toasts } from '$lib/stores/toast';
	import type { Card } from '$lib/next/types/card';
	import { getOptimizedImageUrl } from '$lib/utils/image-optimization';

	const props = $props<{
		card: Card;
		currentStyle?: string;
		onImageSelected: (imageUrl: string, imageId: string, style: string) => void;
		onClose?: () => void;
	}>();

	interface SearchResult {
		original_id: string;
		original_url: string;
		original_style: string;
		variants: Array<{
			id: string;
			url: string;
			style: string;
			created_at: string;
		}>;
		similarity: number;
		created_at: string;
	}

	interface SelectedVariant {
		imageUrl: string;
		imageId: string;
		style: string;
	}

	let searchResults = $state<SearchResult[]>([]);
	let isLoading = $state(true);
	let previewUrl = $state<string | null>(null);

	// Track selected variant for each result (by original_id)
	let selectedVariants = $state<Record<string, SelectedVariant>>({});

	// Load similar images on mount
	$effect(() => {
		loadSimilarImages();
	});

	async function loadSimilarImages() {
		isLoading = true;
		try {
			const response = await authenticatedFetch('/api/ai/search-similar-images', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					card: props.card,
					preferredStyle: props.currentStyle,
					limit: 12 // Changed from 10 to fit grid better
				})
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error('Please sign in to search images');
				}
				throw new Error('Failed to search images');
			}

			const data = await response.json();
			searchResults = data.results || [];

			// Initialize selected variants to use deck's preferred style or original
			searchResults.forEach(result => {
				// Try to find a variant matching the deck's current style
				const preferredVariant = result.variants?.find(v => v.style === props.currentStyle);

				if (preferredVariant) {
					// Use the preferred style variant
					selectedVariants[result.original_id] = {
						imageUrl: preferredVariant.url,
						imageId: preferredVariant.id,
						style: preferredVariant.style
					};
				} else if (result.original_style === props.currentStyle) {
					// Original matches preferred style
					selectedVariants[result.original_id] = {
						imageUrl: result.original_url,
						imageId: result.original_id,
						style: result.original_style
					};
				} else {
					// Default to original
					selectedVariants[result.original_id] = {
						imageUrl: result.original_url,
						imageId: result.original_id,
						style: result.original_style
					};
				}
			});
		} catch (err) {
			console.error('Failed to load similar images:', err);
			toasts.error(err instanceof Error ? err.message : 'Failed to load similar images');
		} finally {
			isLoading = false;
		}
	}

	function closeDialog() {
		if (props.onClose) {
			props.onClose();
		} else {
			dialogStore.close();
		}
	}

	function handleUseImage(originalId: string) {
		const selected = selectedVariants[originalId];
		if (selected) {
			props.onImageSelected(selected.imageUrl, selected.imageId, selected.style);
			closeDialog();
		}
	}

	function selectVariant(originalId: string, imageUrl: string, imageId: string, style: string) {
		selectedVariants[originalId] = { imageUrl, imageId, style };
	}

	function openPreview(url: string) {
		previewUrl = url;
	}

	function closePreview() {
		previewUrl = null;
	}

	function getDisplayUrl(result: SearchResult): string {
		return selectedVariants[result.original_id]?.imageUrl || result.original_url;
	}

	function getDisplayStyle(result: SearchResult): string {
		return selectedVariants[result.original_id]?.style || result.original_style;
	}

	function isVariantSelected(originalId: string, variantId: string): boolean {
		return selectedVariants[originalId]?.imageId === variantId;
	}
</script>

<div class="similar-images-dialog">
	<div class="dialog-header">
		<h2>Similar Images</h2>
		{#if !isLoading}
			<p class="subtitle">Found {searchResults.length} matching images</p>
		{/if}
	</div>

	<div class="dialog-content">
		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Searching community library...</p>
			</div>
		{:else if searchResults.length === 0}
			<div class="empty-state">
				<p>No similar images found in the community library.</p>
				<p class="hint">Be the first to generate an image for this type of card!</p>
			</div>
		{:else}
			<div class="results-grid">
				{#each searchResults as result}
					<div class="result-card">
						<!-- Square image preview showing currently selected variant -->
						<button
							class="image-preview"
							onclick={() => openPreview(getDisplayUrl(result))}
							type="button"
						>
							<img
								src={getOptimizedImageUrl(getDisplayUrl(result), {
									width: 300,
									height: 300,
									fit: 'contain'
								})}
								alt=""
							/>
							<div class="style-badge">{getDisplayStyle(result)}</div>
						</button>

						<!-- Style variants selection -->
						<div class="variants">
							<!-- Original style button -->
							<button
								class="variant-chip"
								class:selected={isVariantSelected(result.original_id, result.original_id)}
								onclick={() =>
									selectVariant(
										result.original_id,
										result.original_url,
										result.original_id,
										result.original_style
									)}
								type="button"
							>
								{result.original_style}
							</button>

							<!-- Variant style buttons -->
							{#if result.variants && result.variants.length > 0}
								{#each result.variants as variant}
									<button
										class="variant-chip"
										class:selected={isVariantSelected(result.original_id, variant.id)}
										onclick={() =>
											selectVariant(result.original_id, variant.url, variant.id, variant.style)}
										type="button"
									>
										{variant.style}
									</button>
								{/each}
							{/if}

							<!-- Show "No variants" if only one style available -->
							{#if !result.variants || result.variants.length === 0}
								<span class="no-variants">No variants</span>
							{/if}
						</div>

						<button
							class="use-button"
							onclick={() => handleUseImage(result.original_id)}
							type="button"
						>
							Use This Image
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="dialog-actions">
		<button class="cancel-button" onclick={closeDialog} type="button">
			Cancel
		</button>
	</div>
</div>

<!-- Image Preview Modal -->
{#if previewUrl}
	<div class="preview-overlay" onclick={closePreview}>
		<div class="preview-content" onclick={(e) => e.stopPropagation()}>
			<img
				src={getOptimizedImageUrl(previewUrl, { width: 1200, fit: 'scale-down' })}
				alt="Preview"
			/>
			<button class="close-preview" onclick={closePreview} type="button">✕</button>
		</div>
	</div>
{/if}

<style>
	.similar-images-dialog {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-height: 80vh;
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--ui-text, #1a202c);
	}

	.subtitle {
		margin: 0.5rem 0 0 0;
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
	}

	.dialog-content {
		flex: 1;
		overflow-y: auto;
		min-height: 400px;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: var(--ui-muted, #64748b);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e2e8f0;
		border-top-color: var(--brand, #c90019);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.hint {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--ui-muted, #94a3b8);
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
		padding: 0.5rem;
	}

	.result-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.image-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1; /* Square instead of portrait */
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s;
		padding: 0;
		background: #f8fafc;
	}

	.image-preview:hover {
		border-color: var(--brand, #c90019);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.image-preview img {
		width: 100%;
		height: 100%;
		object-fit: contain; /* Contain instead of cover to show full square image */
	}

	.style-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.variants {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		min-height: 2rem; /* Consistent height even with "No variants" */
		align-items: center;
	}

	.variant-chip {
		padding: 0.25rem 0.75rem;
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-transform: capitalize;
	}

	.variant-chip:hover {
		background: #e2e8f0;
		border-color: #94a3b8;
	}

	.variant-chip.selected {
		background: var(--brand, #c90019);
		color: white;
		border-color: var(--brand, #c90019);
	}

	.variant-chip.selected:hover {
		background: #a80116;
		border-color: #a80116;
	}

	.no-variants {
		font-size: 0.75rem;
		color: var(--ui-muted, #94a3b8);
		font-style: italic;
	}

	.use-button {
		padding: 0.5rem 1rem;
		background: var(--brand, #c90019);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.use-button:hover {
		background: #a80116;
		transform: translateY(-1px);
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.cancel-button {
		padding: 0.5rem 1.5rem;
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel-button:hover {
		background: #e2e8f0;
	}

	/* Preview Modal */
	.preview-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		cursor: pointer;
	}

	.preview-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		cursor: default;
	}

	.preview-content img {
		max-width: 100%;
		max-height: 90vh;
		object-fit: contain;
	}

	.close-preview {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 40px;
		height: 40px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.close-preview:hover {
		background: rgba(0, 0, 0, 0.9);
	}

	@media (max-width: 640px) {
		.results-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 1rem;
		}
	}
</style>
