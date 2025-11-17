<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import { isAuthenticated } from '../../stores/auth.js';
	import { tokenAmount, refreshTokenBalance } from '../../stores/tokenBalance.js';
	import { nextDeckStore } from '../../stores/deckStore.svelte.js';
	import { toasts } from '$lib/stores/toast.js';
	import { getImageStyles } from '$lib/config/image-styles.js';
	import { TOKEN_COSTS, formatTokenBalance } from '$lib/config/token-costs.js';
	import { getAccessToken } from '$lib/utils/auth-helpers.js';
	import type { Card } from '../../types/card.js';
	import type { ImageStyle } from '../../types/deck.js';

	interface Props {
		card: Card;
		deckImageStyle: ImageStyle;
		// Optional props for testing/stories
		isAuthenticatedOverride?: boolean;
		tokenBalanceOverride?: number; // For testing - overrides real token balance
	}

	let { card, deckImageStyle, isAuthenticatedOverride, tokenBalanceOverride }: Props = $props();

	// State
	let selectedStyle = $state<ImageStyle>(deckImageStyle);
	let isGenerating = $state(false);
	let wasCached = $state(false);
	let generationStartTime = $state<number>(0);

	// Auth/Token checks (use overrides for testing, otherwise use real store/logic)
	const isUserAuthenticated = $derived(
		isAuthenticatedOverride !== undefined ? isAuthenticatedOverride : $isAuthenticated
	);
	const userTokenBalance = $derived(
		tokenBalanceOverride !== undefined ? tokenBalanceOverride : $tokenAmount
	);
	const generationCost = TOKEN_COSTS.IMAGE_GENERATION_COMMUNITY;
	const canAffordGeneration = $derived(userTokenBalance >= generationCost);
	const canGenerate = $derived(isUserAuthenticated && canAffordGeneration);

	const imageStyles = getImageStyles();

	async function generateImage() {
		isGenerating = true;
		wasCached = false;
		generationStartTime = Date.now();

		// Capture card data (in case user closes dialog)
		const cardId = card.id;
		const cardData = card;
		const cardTitle = card.title;
		const style = selectedStyle;
		const existingImage = card.image ?? undefined;
		const sourceImageId = card.imageMetadata?.imageId ?? null;

		// Set generating flag on card to show loading indicator
		await nextDeckStore.updateCard(cardId, {
			imageMetadata: {
				...(card.imageMetadata || {}),
				isGenerating: true
			}
		});

		try {
			// Get access token for Authorization header
			const accessToken = getAccessToken();
			if (!accessToken) {
				throw new Error('Not authenticated - please refresh and log in again');
			}

			const response = await fetch('/api/ai/generate-image', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`
				},
				body: JSON.stringify({
					card: cardData,
					deckTheme: style,
					existingImageUrl: existingImage,
					sourceImageId: sourceImageId
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Generation failed' }));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const data = await response.json();

			if (!data.success || !data.url) {
				throw new Error('Invalid response from server');
			}

			// Track if this was a cached result
			wasCached = data.cached || false;

			// Update card with new image URL and clear generating flag
			await nextDeckStore.updateCard(cardId, {
				image: data.url,
				imageMetadata: {
					originalName: `ai-generated-${cardTitle}.png`,
					addedAt: Date.now(),
					source: 'ai-generation',
					imageId: data.imageId,
					style: style,
					isGenerating: false
				}
			});

			// Refresh token balance
			await refreshTokenBalance();

			// Calculate generation time
			const generationTime = ((Date.now() - generationStartTime) / 1000).toFixed(1);

			// Show success message
			if (data.cached) {
				toasts.success('✨ Found existing image - no tokens charged!');
			} else {
				toasts.success(`✅ Image generated in ${generationTime}s! ${data.cost} tokens used`);
			}

			// Close dialog after success
			dialogStore.close();
		} catch (error) {
			console.error('Generation error:', error);
			toasts.error(error instanceof Error ? error.message : 'Failed to generate image');

			// Clear generating flag on error
			await nextDeckStore.updateCard(cardId, {
				imageMetadata: {
					...(card.imageMetadata || {}),
					isGenerating: false
				}
			});

			isGenerating = false; // Allow retry
		}
	}

	async function removeImage() {
		// Clear card image
		await nextDeckStore.updateCard(card.id, {
			image: null,
			imageBlob: null,
			imageMetadata: null
		});
		dialogStore.close();
	}
</script>

<div class="ai-image-generation">
	<div class="header">
		<h2>🎨 Generate AI Image</h2>
		<button class="close-button" onclick={() => dialogStore.close()}>×</button>
	</div>

	<div class="content">
		{#if isGenerating}
			<!-- Generating State -->
			<div class="generating-state">
				<div class="spinner">🎨</div>
				<h3>Generating Image...</h3>
				<p class="card-name">{card.title}</p>
				<div class="info-box">
					<p><strong>✓ Generation started</strong></p>
					<p>Expected time: ~20-30 seconds</p>
					<p class="safe-notice">
						💡 Safe to close this dialog or even the browser tab - your image will be generated and
						saved automatically!
					</p>
				</div>
			</div>
		{:else}
			<!-- Card Preview -->
			<div class="card-info">
				<strong>{card.title}</strong>
				{#if card.subtitle}
					<span class="subtitle">- {card.subtitle}</span>
				{/if}
			</div>

			<!-- Image Style Selector -->
			<div class="form-group">
				<label for="imageStyle">Image Style</label>
				<select id="imageStyle" bind:value={selectedStyle}>
					{#each imageStyles as style}
						<option value={style.id}>
							{style.name}
							{#if style.id === deckImageStyle}(Deck Default){/if}
						</option>
					{/each}
				</select>
				<p class="help-text">{imageStyles.find((s) => s.id === selectedStyle)?.description}</p>
			</div>

			<!-- Existing Image Notice -->
			{#if card.image}
				<div class="notice">
					ℹ️ This card has an existing image. It will be used as a style reference for the new
					generation.
				</div>
			{/if}

			<!-- Community Generation Info (when logged in) -->
			{#if isUserAuthenticated}
				<div class="community-info">
					<div class="info-header">
						<span class="icon">🌐</span>
						<strong>Community Generation</strong>
					</div>
					<ul class="benefits">
						<li>✨ AI-generated artwork for <strong>100 tokens (1 NOK)</strong></li>
						<li>📚 Image added to shared library for all members</li>
						<li>🔓 Browse & reuse community images for free</li>
					</ul>

					<!-- Token Balance & Affordability -->
					<div class="token-balance" class:insufficient={!canAffordGeneration}>
						{#if canAffordGeneration}
							<p>
								Generating this image will cost <strong>{generationCost} tokens</strong>
								(you have <strong>{formatTokenBalance(userTokenBalance)}</strong> ✅)
							</p>
						{:else}
							<p>
								Generating this image will cost <strong>{generationCost} tokens</strong>
								(you have <strong>{formatTokenBalance(userTokenBalance)}</strong> ❌)
							</p>
							<button class="buy-tokens-btn" onclick={() => console.log('Buy tokens')}>
								💰 Buy More Tokens
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Auth Gate (not logged in) -->
			{#if !isUserAuthenticated}
				<div class="auth-gate">
					<p>🔒 Please log in to generate images</p>
					<button class="primary-button" onclick={() => console.log('Login')}>Login</button>
				</div>
			{/if}
		{/if}
	</div>

	<div class="footer">
		{#if isGenerating}
			<button class="secondary-button" onclick={() => dialogStore.close()}
				>Close & Continue Generation</button
			>
		{:else}
			{#if card.image}
				<button class="secondary-button" onclick={removeImage}>Remove Image</button>
			{/if}
			<button
				class="primary-button"
				onclick={generateImage}
				disabled={!canGenerate || isGenerating}
			>
				🌐 Generate & Share (100 tokens)
			</button>
		{/if}
	</div>
</div>

<style>
	.ai-image-generation {
		background: white;
		display: flex;
		flex-direction: column;
		max-height: 85vh;
		min-width: 500px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		color: #64748b;
		border-radius: 4px;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background: #f8fafc;
		color: #1a202c;
	}

	.content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.card-info {
		background: #f8fafc;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
	}

	.card-info strong {
		font-size: 1.1rem;
	}

	.subtitle {
		color: #64748b;
		font-style: italic;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		font-size: 0.875rem;
		color: #1a202c;
	}

	.form-group select {
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
	}

	.form-group select:focus {
		outline: none;
		border-color: #059669;
	}

	.help-text {
		font-size: 0.75rem;
		color: #64748b;
		margin: 0;
		line-height: 1.4;
	}

	.notice {
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 6px;
		padding: 0.75rem;
		font-size: 0.875rem;
		color: #1a202c;
	}

	.community-info {
		background: rgba(34, 197, 94, 0.05);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: 8px;
		padding: 1rem;
		font-size: 0.875rem;
	}

	.info-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		color: #1a202c;
	}

	.info-header .icon {
		font-size: 1.25rem;
	}

	.info-header strong {
		font-size: 0.95rem;
	}

	.benefits {
		margin: 0;
		padding-left: 1.5rem;
		color: #1a202c;
	}

	.benefits li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.benefits li:last-child {
		margin-bottom: 0;
	}

	.token-balance {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(34, 197, 94, 0.2);
	}

	.token-balance p {
		margin: 0 0 0.5rem 0;
		color: #1a202c;
		font-size: 0.875rem;
	}

	.token-balance.insufficient {
		background: rgba(239, 68, 68, 0.05);
		margin: 0.75rem -1rem -1rem;
		padding: 1rem;
		border-top: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 0 0 8px 8px;
	}

	.buy-tokens-btn {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		background: #f59e0b;
		color: white;
		border: none;
		width: 100%;
	}

	.buy-tokens-btn:hover {
		background: #d97706;
		transform: translateY(-1px);
	}

	.auth-gate {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 6px;
		padding: 1rem;
		text-align: center;
	}

	.auth-gate p {
		margin: 0 0 0.75rem 0;
		color: #1a202c;
	}

	.footer {
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.primary-button,
	.secondary-button {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-button {
		background: #059669;
		color: white;
		border: none;
	}

	.primary-button:hover:not(:disabled) {
		background: #047857;
		transform: translateY(-1px);
	}

	.primary-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.secondary-button {
		background: white;
		color: #1a202c;
		border: 1px solid #e2e8f0;
	}

	.secondary-button:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
	}

	/* Generating State */
	.generating-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		gap: 1rem;
	}

	.spinner {
		font-size: 3rem;
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
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a202c;
	}

	.generating-state .card-name {
		margin: 0;
		font-size: 1rem;
		color: #64748b;
		font-style: italic;
	}

	.generating-state .info-box {
		background: rgba(59, 130, 246, 0.08);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 8px;
		padding: 1.25rem;
		margin-top: 1rem;
		max-width: 400px;
	}

	.generating-state .info-box p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		color: #1a202c;
	}

	.generating-state .info-box p:first-child {
		margin-top: 0;
	}

	.generating-state .info-box p:last-child {
		margin-bottom: 0;
	}

	.safe-notice {
		background: rgba(34, 197, 94, 0.08);
		padding: 0.75rem;
		border-radius: 6px;
		margin-top: 0.5rem !important;
		font-weight: 500;
	}
</style>
