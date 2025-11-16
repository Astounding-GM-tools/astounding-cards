<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import { isAuthenticated } from '../../stores/auth.js';
	import { toasts } from '$lib/stores/toast.js';
	import { tokenAmount, tokenBalanceStore } from '../../stores/tokenBalance.js';
	import { nextDeckStore } from '../../stores/deckStore.svelte.js';
	import AuthGatedCtaButton from '../cta/AuthGatedCtaButton.svelte';
	import { IMAGE_GENERATION_CTA } from '$lib/config/cta-configs.js';
	import { TOKEN_COSTS, formatTokenBalance } from '$lib/config/token-costs.js';
	import { getAuthHeaders } from '$lib/utils/auth-helpers.js';
	import { ART_STYLES } from '$lib/ai/prompts/image-generation.js';

	interface Props {
		// Optional props for testing/stories
		isAuthenticatedOverride?: boolean;
		cardsOverride?: any[]; // For Storybook - override deck cards
		deckThemeOverride?: string; // For Storybook - override deck theme
	}

	let { isAuthenticatedOverride, cardsOverride, deckThemeOverride }: Props = $props();

	// State
	let selectedStyle = $state('');
	let isGenerating = $state(false);
	let generationProgress = $state({ current: 0, total: 0 });
	let isCheckingVariants = $state(false);
	let cardImageStatus = $state<Record<string, { hasImage: boolean; imageUrl: string | null; isLoading: boolean }>>({}); 
	let previewImageUrl = $state<string | null>(null);

	// Get current deck from store (or use overrides for Storybook)
	let currentDeck = $derived(nextDeckStore.deck);
	let deckTheme = $derived(deckThemeOverride || currentDeck?.meta.theme || 'classic');
	
	// Initialize selected style to deck theme
	$effect(() => {
		if (!selectedStyle && deckTheme) {
			selectedStyle = deckTheme;
		}
	});

	// Auth check (use override for testing, otherwise use real store)
	const isUserAuthenticated = $derived(
		isAuthenticatedOverride !== undefined ? isAuthenticatedOverride : $isAuthenticated
	);

	// Cards that will be processed (use override for Storybook if provided)
	const cards = $derived(cardsOverride || currentDeck?.cards || []);
	const cardCount = $derived(cards.length);

	// Calculate how many cards need generation based on image status
	const cardsNeedingGeneration = $derived(
		Object.values(cardImageStatus).filter(status => !status.hasImage).length || cardCount
	);
	const cardsWithExistingImages = $derived(
		Object.values(cardImageStatus).filter(status => status.hasImage).length
	);

	// Cost calculation
	const costPerImage = TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY;
	const totalCost = $derived(cardsNeedingGeneration * costPerImage);
	const userTokenBalance = $derived($tokenAmount);
	const canAfford = $derived(userTokenBalance >= totalCost);

	// Art style options
	const artStyleOptions = $derived(
		Object.entries(ART_STYLES).map(([key, description]) => ({
			value: key,
			label: `${key.charAt(0).toUpperCase() + key.slice(1)} - ${description.split(':')[0].trim()}`
		}))
	);

	// Initialize card image status when cards or style changes
	$effect(() => {
		if (cards.length > 0 && selectedStyle) {
			checkImageVariants();
		}
	});

	// Initialize card status on mount
	$effect(() => {
		if (cards.length > 0) {
			// Initialize with current images
			const initialStatus: typeof cardImageStatus = {};
			for (const card of cards) {
				initialStatus[card.id] = {
					hasImage: !!card.image,
					imageUrl: card.image || null,
					isLoading: false
				};
			}
			cardImageStatus = initialStatus;
		}
	});

	// Check if images exist in the selected style
	async function checkImageVariants() {
		if (!selectedStyle || selectedStyle === deckTheme || isCheckingVariants) {
			// If style is same as deck theme, use current images
			if (selectedStyle === deckTheme) {
				const status: typeof cardImageStatus = {};
				for (const card of cards) {
					status[card.id] = {
						hasImage: !!card.image,
						imageUrl: card.image || null,
						isLoading: false
					};
				}
				cardImageStatus = status;
			}
			return;
		}

		isCheckingVariants = true;

		// Set all to loading
		const loadingStatus: typeof cardImageStatus = {};
		for (const card of cards) {
			loadingStatus[card.id] = {
				hasImage: false,
				imageUrl: null,
				isLoading: true
			};
		}
		cardImageStatus = loadingStatus;

		try {
			// Check for each card if an image exists in the selected style
			const authHeaders = getAuthHeaders();
			const response = await fetch('/api/ai/check-image-variants', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...authHeaders
				},
				body: JSON.stringify({
					cards: cards.map(c => ({
						id: c.id,
						imageMetadata: c.imageMetadata
					})),
					style: selectedStyle
				})
			});

			if (response.ok) {
				const result = await response.json();
				const newStatus: typeof cardImageStatus = {};
				
				for (const card of cards) {
					const variantInfo = result.variants[card.id];
					newStatus[card.id] = {
						hasImage: variantInfo?.exists || false,
						imageUrl: variantInfo?.url || null,
						isLoading: false
					};
				}
				
				cardImageStatus = newStatus;
			} else {
				// On error, assume all need generation
				const errorStatus: typeof cardImageStatus = {};
				for (const card of cards) {
					errorStatus[card.id] = {
						hasImage: false,
						imageUrl: null,
						isLoading: false
					};
				}
				cardImageStatus = errorStatus;
			}
		} catch (error) {
			console.error('Error checking image variants:', error);
			// On error, assume all need generation
			const errorStatus: typeof cardImageStatus = {};
			for (const card of cards) {
				errorStatus[card.id] = {
					hasImage: false,
					imageUrl: null,
					isLoading: false
				};
			}
			cardImageStatus = errorStatus;
		} finally {
			isCheckingVariants = false;
		}
	}

	async function generateImages() {
		if (!currentDeck || cards.length === 0) {
			toasts.error('No cards to generate images for');
			return;
		}

		isGenerating = true;
		generationProgress = { current: 0, total: cardsNeedingGeneration };
		const startTime = Date.now();

		try {
			// Call the API endpoint with full card data
			const authHeaders = getAuthHeaders();
			const response = await fetch('/api/ai/batch-generate-images', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...authHeaders
				},
				body: JSON.stringify({
					cards: cards.map(c => ({
						id: c.id,
						title: c.title,
						subtitle: c.subtitle,
						description: c.description,
						traits: c.traits,
						stats: c.stats,
						imageMetadata: c.imageMetadata
					})),
					style: selectedStyle
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(errorData.message || `Failed to generate images: ${response.statusText}`);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to generate images');
			}

			// Update cards with generated/cached images AND update thumbnails in real-time
			let completedCount = 0;
			for (const imageResult of result.results) {
				if (imageResult.success && imageResult.url) {
					// Update the card in the deck store
					await nextDeckStore.updateCard(imageResult.cardId, {
						image: imageResult.url,
						imageMetadata: {
							imageId: imageResult.imageId,
							source: 'ai-generation',
							addedAt: Date.now()
						}
					});

					// Update the thumbnail in the dialog immediately
					if (!imageResult.cached) {
						completedCount++;
						generationProgress = { current: completedCount, total: cardsNeedingGeneration };
					}

					// Update card image status to show the new image
					cardImageStatus = {
						...cardImageStatus,
						[imageResult.cardId]: {
							hasImage: true,
							imageUrl: imageResult.url,
							isLoading: false
						}
					};
				}
			}

			// Refresh token balance
			await tokenBalanceStore.fetchBalance();

			const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
			const generated = result.results.filter((r: any) => !r.cached).length;
			const cached = result.results.filter((r: any) => r.cached).length;
			
			toasts.success(
				`✅ Batch generation complete in ${elapsedTime}s! Generated: ${generated}, Cached: ${cached} (${result.totalCost} tokens)`
			);

			// Show completion state briefly before allowing close
			setTimeout(() => {
				isGenerating = false;
			}, 1500);
		} catch (error) {
			console.error('Batch generation error:', error);
			toasts.error(error instanceof Error ? error.message : 'Failed to generate images');
			isGenerating = false;
			generationProgress = { current: 0, total: 0 };
		}
	}

	function handleAuthenticatedClick() {
		generateImages();
	}
</script>

<div class="batch-image-generation">
	<div class="header">
		<h2>🖼️ Generate Images for All Cards</h2>
		<button class="close-button" onclick={() => dialogStore.close()}>×</button>
	</div>

	<div class="content">
		{#if isGenerating}
			<!-- Generating State with Live Updates -->
			<div class="generating-state">
				<div class="spinner">🎨</div>
				<h3>Generating Images...</h3>
				<p class="progress-text">
					Completed {generationProgress.current} of {generationProgress.total} cards
				</p>
				
				<!-- Progress bar -->
				<div class="progress-bar">
					<div 
						class="progress-fill" 
						style="width: {generationProgress.total > 0 ? (generationProgress.current / generationProgress.total) * 100 : 0}%"
					></div>
				</div>

				<!-- Live thumbnail updates -->
				<div class="generating-card-list">
					{#each cards as card}
						{@const status = cardImageStatus[card.id]}
						<div class="generating-card-item" class:completed={status?.hasImage}>
							<!-- Thumbnail -->
							{#if status?.imageUrl}
								<div class="card-thumbnail completed-thumbnail">
									<img src={status.imageUrl} alt={card.title} />
									<div class="check-overlay">✓</div>
								</div>
							{:else}
								<div class="card-thumbnail loading">
									<div class="loading-spinner">⏳</div>
								</div>
							{/if}
							
							<div class="card-info-compact">
								<span class="card-name-small">{card.title}</span>
							</div>
						</div>
					{/each}
				</div>

				<p class="safe-notice">
					💡 Watch your images appear in real-time!
				</p>
			</div>
		{:else}
			<!-- Configuration -->
			<div class="config-section">
				<!-- Style Selector -->
				<div class="form-group">
					<label for="style">Image Style</label>
					<select id="style" bind:value={selectedStyle} class="style-select">
						{#each artStyleOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
					<p class="help-text">Choose the art style for generated images</p>
				</div>

				<!-- Card List Preview -->
				<div class="card-list-section">
					<h3>Cards to Process ({cardCount})</h3>
					<div class="card-list">
						{#each cards as card}
							{@const status = cardImageStatus[card.id]}
							<div class="card-item">
								<!-- Image thumbnail (clickable to preview) -->
								{#if status?.isLoading}
									<div class="card-thumbnail loading">
										<div class="loading-spinner">⏳</div>
									</div>
								{:else if status?.imageUrl}
									<button 
										class="card-thumbnail" 
										onclick={() => previewImageUrl = status.imageUrl}
										title="Click to preview"
									>
										<img src={status.imageUrl} alt={card.title} />
									</button>
								{:else}
									<div class="card-thumbnail empty">
										<span class="empty-icon">🖼️</span>
									</div>
								{/if}
								
								<div class="card-info">
									<span class="card-name">{card.title}</span>
									<span class="card-subtitle">{card.subtitle}</span>
								</div>
								
								{#if status?.isLoading}
									<span class="status-badge checking">Checking...</span>
								{:else if status?.hasImage}
									<span class="status-badge existing">Has image</span>
								{:else}
									<span class="status-badge needs">Needs image</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Cost Summary -->
				{#if isUserAuthenticated}
					<div class="cost-notice" class:insufficient={!canAfford}>
						<div class="notice-header">
							<span class="icon">💰</span>
							<strong>Cost Summary</strong>
						</div>
						<div class="cost-breakdown">
							<div class="cost-line">
								<span>Cards needing generation:</span>
								<span>{cardsNeedingGeneration} × {costPerImage} tokens</span>
							</div>
							{#if cardsWithExistingImages > 0}
								<div class="cost-line cached">
									<span>Cards with existing images:</span>
									<span>{cardsWithExistingImages} × 0 tokens (cached)</span>
								</div>
							{/if}
							<div class="cost-line total">
								<span><strong>Total Cost:</strong></span>
								<span><strong>{totalCost} tokens</strong></span>
							</div>
						</div>
						{#if canAfford}
							<p class="balance-info">
								You have <strong>{formatTokenBalance(userTokenBalance)}</strong> ✅
							</p>
						{:else}
							<p class="balance-info insufficient-text">
								You have <strong>{formatTokenBalance(userTokenBalance)}</strong> ❌<br />
								You need <strong>{totalCost} tokens</strong> to generate these images.
							</p>
							<button class="buy-tokens-btn" onclick={() => console.log('Buy tokens')}>
								💰 Buy More Tokens
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="footer">
		{#if isGenerating}
			<button class="secondary-button" onclick={() => dialogStore.close()}>
				Close & Continue Generation
			</button>
		{:else}
			<button class="secondary-button" onclick={() => dialogStore.close()}>Cancel</button>
			<AuthGatedCtaButton
				config={IMAGE_GENERATION_CTA}
				onAuthenticatedClick={handleAuthenticatedClick}
				{isAuthenticatedOverride}
			/>
		{/if}
	</div>
</div>

<!-- Image Preview Dialog -->
{#if previewImageUrl}
	<div class="preview-overlay" onclick={() => previewImageUrl = null}>
		<div class="preview-content" onclick={(e) => e.stopPropagation()}>
			<button class="preview-close" onclick={() => previewImageUrl = null}>×</button>
			<img src={previewImageUrl} alt="Preview" class="preview-image" />
		</div>
	</div>
{/if}

<style>
	.batch-image-generation {
		display: flex;
		flex-direction: column;
		width: 600px;
		max-width: 90vw;
		max-height: 90vh;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 28px;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.2s;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		opacity: 1;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	/* Generating State */
	.generating-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 32px 0;
	}

	.spinner {
		font-size: 64px;
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.generating-state h3 {
		margin: 16px 0 8px;
		font-size: 18px;
	}

	.progress-text {
		font-size: 14px;
		opacity: 0.8;
		margin: 0 0 16px;
	}

	/* Progress bar */
	.progress-bar {
		width: 100%;
		max-width: 400px;
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 24px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #22c55e 0%, #10b981 100%);
		transition: width 0.5s ease;
	}

	/* Generating card list */
	.generating-card-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 12px;
		width: 100%;
		max-width: 600px;
		max-height: 300px;
		overflow-y: auto;
		padding: 16px;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 8px;
		margin-bottom: 16px;
	}

	.generating-card-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		opacity: 0.6;
		transition: opacity 0.3s, transform 0.3s;
	}

	.generating-card-item.completed {
		opacity: 1;
		transform: scale(1.05);
	}

	.completed-thumbnail {
		position: relative;
	}

	.check-overlay {
		position: absolute;
		top: 4px;
		right: 4px;
		background: #22c55e;
		color: white;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: bold;
		animation: checkPop 0.3s ease;
	}

	@keyframes checkPop {
		0% { transform: scale(0); }
		50% { transform: scale(1.2); }
		100% { transform: scale(1); }
	}

	.card-info-compact {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		width: 100%;
	}

	.card-name-small {
		font-size: 11px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.info-box {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 16px;
		width: 100%;
		max-width: 400px;
	}

	.info-box p {
		margin: 8px 0;
		font-size: 14px;
	}

	.safe-notice {
		margin-top: 16px !important;
		padding-top: 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		opacity: 0.7;
	}

	/* Configuration */
	.config-section {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-group label {
		font-weight: 600;
		font-size: 14px;
	}

	.style-select {
		padding: 10px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.05);
		font-size: 14px;
		cursor: pointer;
	}

	.help-text {
		font-size: 12px;
		opacity: 0.7;
		margin: 0;
	}

	/* Card List */
	.card-list-section h3 {
		margin: 0 0 12px;
		font-size: 16px;
		font-weight: 600;
	}

	.card-list {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.02);
	}

	.card-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.card-item:last-child {
		border-bottom: none;
	}

	/* Card thumbnail */
	.card-thumbnail {
		width: 50px;
		height: 70px;
		border-radius: 4px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		cursor: pointer;
		transition: transform 0.2s;
		padding: 0;
	}

	.card-thumbnail:hover:not(.loading):not(.empty) {
		transform: scale(1.05);
		border-color: rgba(34, 197, 94, 0.5);
	}

	.card-thumbnail.empty {
		cursor: default;
		opacity: 0.5;
	}

	.card-thumbnail.loading {
		cursor: default;
	}

	.card-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.loading-spinner {
		font-size: 20px;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.empty-icon {
		font-size: 24px;
		opacity: 0.3;
	}

	/* Card info */
	.card-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.card-name {
		font-size: 14px;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-subtitle {
		font-size: 12px;
		opacity: 0.7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-badge {
		font-size: 11px;
		padding: 4px 8px;
		border-radius: 12px;
		font-weight: 600;
	}

	.status-badge.existing {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.status-badge.needs {
		background: rgba(251, 191, 36, 0.2);
		color: #fbbf24;
	}

	.status-badge.checking {
		background: rgba(59, 130, 246, 0.2);
		color: #3b82f6;
	}

	/* Cost Notice */
	.cost-notice {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: 8px;
		padding: 16px;
	}

	.cost-notice.insufficient {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.notice-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
	}

	.icon {
		font-size: 20px;
	}

	.cost-breakdown {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 12px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 6px;
	}

	.cost-line {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
	}

	.cost-line.cached {
		opacity: 0.7;
	}

	.cost-line.total {
		padding-top: 8px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin-top: 4px;
	}

	.balance-info {
		font-size: 14px;
		margin: 0;
	}

	.insufficient-text {
		color: #ef4444;
	}

	.buy-tokens-btn {
		margin-top: 12px;
		padding: 8px 16px;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.buy-tokens-btn:hover {
		transform: translateY(-1px);
	}

	/* Footer */
	.footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 16px 24px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.secondary-button {
		padding: 10px 20px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.secondary-button:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	/* Image Preview Overlay */
	.preview-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		animation: fadeIn 0.2s;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.preview-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		animation: scaleIn 0.2s;
	}

	@keyframes scaleIn {
		from { transform: scale(0.9); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.preview-image {
		max-width: 100%;
		max-height: 90vh;
		object-fit: contain;
		border-radius: 8px;
	}

	.preview-close {
		position: absolute;
		top: -40px;
		right: 0;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		font-size: 32px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.preview-close:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
