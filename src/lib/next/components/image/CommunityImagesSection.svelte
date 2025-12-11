<script lang="ts">
	import type { Card } from '$lib/next/types/card.js';
	import { authenticatedFetch } from '$lib/utils/authenticated-fetch.js';
	import { getOptimizedImageUrl } from '$lib/utils/image-optimization.js';
	import { toasts } from '$lib/stores/toast.js';
	import { Target, Sparkles } from 'lucide-svelte';

	// Types
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

	// Props from parent
	const {
		card,
		cardId,
		previewCard,
		deckDescription,
		preset,
		onImageSelected
	}: {
		card: Card | null;
		cardId: string;
		previewCard: Card | null;
		deckDescription?: string;
		preset: string;
		onImageSelected: (imageUrl: string, imageId: string) => void;
	} = $props();

	// State
	let communityImages = $state<SearchResult[]>([]);
	let communityImagesLoading = $state(false);
	let communityImagesError = $state<string | null>(null);
	let selectedVariants = $state<Record<string, SelectedVariant>>({});
	let communityImagesPage = $state(1);
	const imagesPerPage = 6;
	let usingCardSpecificEmbedding = $state(false);
	let lastLoadedCardId = $state<string | null>(null);

	// Rate limiting tracking
	const lastCardEmbeddingTimestamps = new Map<string, number>();
	const lastCardSemanticText = new Map<string, string>();
	const CARD_RATE_LIMIT_MS = 60000; // 1 minute between card-specific embeddings

	// Derived state
	let paginatedImages = $derived(
		communityImages.slice(
			(communityImagesPage - 1) * imagesPerPage,
			communityImagesPage * imagesPerPage
		)
	);

	let totalPages = $derived(Math.ceil(communityImages.length / imagesPerPage));

	// Helper: Extract semantic text from card content
	function extractSemanticText(card: Card | null): string {
		if (!card) return '';

		const parts = [
			card.title || '',
			card.subtitle || '',
			card.description || '',
			...(card.traits || []).map((t) => `${t.title} ${t.description}`).filter(Boolean)
		];

		// Normalize: lowercase, collapse whitespace, trim
		return parts.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
	}

	// Helper: Check if text changed significantly
	function hasSignificantTextChange(oldText: string, newText: string): boolean {
		if (oldText === newText) return false;

		const charDiff = Math.abs(newText.length - oldText.length);
		const percentDiff = oldText.length > 0 ? charDiff / oldText.length : 1;

		// Trigger if: > 30 char difference, or > 10% length change
		return charDiff > 30 || percentDiff > 0.1;
	}

	// Helper: Compare if two result sets are identical
	function areResultsIdentical(results1: SearchResult[], results2: SearchResult[]): boolean {
		if (results1.length !== results2.length) return false;

		for (let i = 0; i < results1.length; i++) {
			if (results1[i].original_id !== results2[i].original_id) {
				return false;
			}
		}

		return true;
	}

	// Load community images ONLY when navigating to a different card
	$effect(() => {
		const currentCardId = cardId;

		if (currentCardId && currentCardId !== lastLoadedCardId && card) {
			lastLoadedCardId = currentCardId;
			usingCardSpecificEmbedding = false;
			loadCommunityImages();
		}
	});

	async function loadCommunityImages() {
		if (!previewCard) return;

		// If card has an image, don't show community images
		if (card?.image) {
			communityImages = [];
			return;
		}

		communityImagesLoading = true;
		communityImagesError = null;

		try {
			const response = await authenticatedFetch('/api/ai/search-similar-images', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					card: previewCard,
					deckDescription: deckDescription,
					preferredStyle: preset,
					limit: 24
				})
			});

			if (!response.ok) {
				if (response.status === 401) {
					communityImagesError = 'auth';
					return;
				}
				throw new Error('Failed to load community images');
			}

			const data = await response.json();
			communityImages = data.results || [];

			// Initialize selected variants
			communityImages.forEach((result) => {
				const preferredVariant = result.variants?.find((v) => v.style === preset);
				if (preferredVariant) {
					selectedVariants[result.original_id] = {
						imageUrl: preferredVariant.url,
						imageId: preferredVariant.id,
						style: preferredVariant.style
					};
				} else {
					selectedVariants[result.original_id] = {
						imageUrl: result.original_url,
						imageId: result.original_id,
						style: result.original_style
					};
				}
			});
		} catch (err) {
			console.error('Failed to load community images:', err);
			communityImagesError = 'error';
		} finally {
			communityImagesLoading = false;
		}
	}

	async function getCardSpecificSuggestions() {
		if (!previewCard || !card) return;

		const currentCardId = card.id;
		const currentSemanticText = extractSemanticText(previewCard);

		// Check rate limit
		const lastTimestamp = lastCardEmbeddingTimestamps.get(currentCardId) || 0;
		const timeSinceLastEmbed = Date.now() - lastTimestamp;

		if (timeSinceLastEmbed < CARD_RATE_LIMIT_MS) {
			const remainingSeconds = Math.ceil((CARD_RATE_LIMIT_MS - timeSinceLastEmbed) / 1000);
			toasts.info(`⏱️ Please wait ${remainingSeconds}s before requesting new suggestions`);
			return;
		}

		// Check if content has changed significantly
		const lastSemanticText = lastCardSemanticText.get(currentCardId) || '';
		if (lastSemanticText && !hasSignificantTextChange(lastSemanticText, currentSemanticText)) {
			console.log('[CommunityImages] Content unchanged - skipping re-embedding');
			toasts.info('💡 Card content unchanged - suggestions are already optimized');
			return;
		}

		usingCardSpecificEmbedding = true;
		communityImagesLoading = true;
		communityImagesError = null;

		try {
			console.log('[CommunityImages] Generating card-specific embedding');

			const response = await authenticatedFetch('/api/ai/search-similar-images', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					card: previewCard,
					preferredStyle: preset,
					limit: 24
				})
			});

			if (!response.ok) {
				if (response.status === 401) {
					communityImagesError = 'auth';
					return;
				}
				throw new Error('Failed to generate card-specific suggestions');
			}

			const data = await response.json();
			const newResults = data.results || [];

			// Check if results are identical
			if (areResultsIdentical(communityImages, newResults)) {
				console.log('[CommunityImages] Results unchanged');
				toasts.info('✨ Suggestions are already optimal for this card');
				lastCardEmbeddingTimestamps.set(currentCardId, Date.now());
				lastCardSemanticText.set(currentCardId, currentSemanticText);
				return;
			}

			// Update with new results
			communityImages = newResults;

			// Initialize selected variants
			communityImages.forEach((result) => {
				const preferredVariant = result.variants?.find((v) => v.style === preset);
				if (preferredVariant) {
					selectedVariants[result.original_id] = {
						imageUrl: preferredVariant.url,
						imageId: preferredVariant.id,
						style: preferredVariant.style
					};
				} else {
					selectedVariants[result.original_id] = {
						imageUrl: result.original_url,
						imageId: result.original_id,
						style: result.original_style
					};
				}
			});

			// Update tracking
			lastCardEmbeddingTimestamps.set(currentCardId, Date.now());
			lastCardSemanticText.set(currentCardId, currentSemanticText);

			toasts.success('🎯 Updated suggestions based on card content!');
		} catch (err) {
			console.error('Failed to get card-specific suggestions:', err);
			communityImagesError = 'error';
			usingCardSpecificEmbedding = false;
		} finally {
			communityImagesLoading = false;
		}
	}

	function handleCommunityImageSelected(imageUrl: string, imageId: string) {
		console.log('[CommunityImages] Image selected:', { imageUrl, imageId });
		onImageSelected(imageUrl, imageId);
	}

	function selectVariant(originalId: string, imageUrl: string, imageId: string, style: string) {
		selectedVariants[originalId] = { imageUrl, imageId, style };
	}

	function isVariantSelected(originalId: string, variantId: string): boolean {
		return selectedVariants[originalId]?.imageId === variantId;
	}
</script>

{#if !card?.image && (deckDescription || communityImages.length > 0)}
	<fieldset class="form-fieldset community-images-section">
		<div class="community-header">
			<legend>Community Images</legend>
			{#if !usingCardSpecificEmbedding && deckDescription}
				<button class="get-suggestions-btn" onclick={getCardSpecificSuggestions} type="button">
					<Target size={16} />
					Get Better Suggestions for This Card
				</button>
			{:else if usingCardSpecificEmbedding}
				<span class="suggestions-label">
					<Sparkles size={16} />
					Showing card-specific suggestions
				</span>
			{/if}
		</div>

		{#if communityImagesLoading}
			<div class="community-loading">
				<div class="spinner"></div>
				<p>Loading community images...</p>
			</div>
		{:else if communityImagesError === 'auth'}
			<div class="community-auth-message">
				<p>
					The community library of AI-generated images is free to use, but requires that you are
					logged in.
				</p>
			</div>
		{:else if communityImagesError}
			<div class="community-error">
				<p>Failed to load community images</p>
			</div>
		{:else if communityImages.length === 0}
			<div class="community-empty">
				<p>No similar images found in the community library</p>
			</div>
		{:else}
			<div class="community-grid">
				{#each paginatedImages as result}
					<div class="community-image-card">
						<button
							class="community-image-preview"
							onclick={() =>
								handleCommunityImageSelected(
									selectedVariants[result.original_id]?.imageUrl || result.original_url,
									selectedVariants[result.original_id]?.imageId || result.original_id
								)}
							type="button"
						>
							<img
								src={getOptimizedImageUrl(
									selectedVariants[result.original_id]?.imageUrl || result.original_url,
									{
										width: 200,
										height: 200,
										fit: 'contain'
									}
								)}
								alt=""
							/>
							<div class="style-badge">
								{selectedVariants[result.original_id]?.style || result.original_style}
							</div>
						</button>

						<!-- Style variants -->
						<div class="variants-row">
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
						</div>
					</div>
				{/each}
			</div>

			{#if totalPages > 1}
				<div class="pagination">
					<button
						onclick={() => (communityImagesPage = Math.max(1, communityImagesPage - 1))}
						disabled={communityImagesPage === 1}
						type="button"
					>
						Previous
					</button>
					<span>Page {communityImagesPage} of {totalPages}</span>
					<button
						onclick={() => (communityImagesPage = Math.min(totalPages, communityImagesPage + 1))}
						disabled={communityImagesPage === totalPages}
						type="button"
					>
						Next
					</button>
				</div>
			{/if}
		{/if}
	</fieldset>
{/if}

<style>
	.form-fieldset {
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 0.75rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: white;
	}

	.form-fieldset legend {
		font-weight: 600;
		color: var(--color);
		font-size: 0.85rem;
		padding: 0 0.5rem;
	}

	/* Community Images Section */
	.community-images-section {
		max-height: 600px;
		overflow-y: auto;
	}

	.community-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.community-header legend {
		margin-bottom: 0;
	}

	.get-suggestions-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.get-suggestions-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.get-suggestions-btn:active {
		transform: translateY(0);
	}

	.suggestions-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #667eea;
		font-weight: 500;
		white-space: nowrap;
	}

	.community-loading,
	.community-auth-message,
	.community-error,
	.community-empty {
		padding: 2rem 1rem;
		text-align: center;
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
	}

	.community-auth-message p {
		color: var(--ui-text, #1e293b);
	}

	.community-error {
		color: #dc2626;
	}

	.community-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--ui-border, #e2e8f0);
		border-top-color: var(--primary, #3b82f6);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.community-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.community-image-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.community-image-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
		background: #f9f9f9;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0;
	}

	.community-image-preview:hover {
		border-color: var(--primary, #3b82f6);
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
	}

	.community-image-preview img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.style-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		font-size: 0.75rem;
		text-transform: capitalize;
	}

	.variants-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.variant-chip {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		background: white;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-transform: capitalize;
	}

	.variant-chip:hover {
		border-color: var(--primary, #3b82f6);
	}

	.variant-chip.selected {
		background: var(--primary, #3b82f6);
		color: white;
		border-color: var(--primary, #3b82f6);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1rem 0;
		margin-top: 1rem;
		border-top: 1px solid #ddd;
	}

	.pagination button {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.15s ease;
	}

	.pagination button:hover:not(:disabled) {
		background: var(--primary, #3b82f6);
		color: white;
		border-color: var(--primary, #3b82f6);
	}

	.pagination button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pagination span {
		font-size: 0.875rem;
		color: var(--ui-text, #1e293b);
	}
</style>
