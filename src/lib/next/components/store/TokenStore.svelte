<script lang="ts">
	import { ShoppingCart, Zap, TrendingUp, Rocket, Check } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast';
	import type { TokenTier } from '$lib/payment/lemonSqueezyVariants';
	import Pill from '$lib/next/components/ui/Pill.svelte';
	import { getAuthHeaders } from '$lib/utils/auth-helpers';

	const props = $props<{
		compact?: boolean;
	}>();

	// State
	let tiers = $state<TokenTier[]>([]);
	let selectedTierIndex = $state(1); // Default to middle tier (usually "Popular")
	let acceptedTerms = $state(false);
	let isPurchasing = $state(false);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	// Derived values
	const selectedTier = $derived(tiers[selectedTierIndex]);
	const BASE_FEE = 0.5;
	const FEE_PERCENTAGE = 0.05;
	const discountedPrice = $derived(
		selectedTier ? selectedTier.price * (1 - selectedTier.discount) : 0
	);
	const transactionFee = $derived(BASE_FEE + discountedPrice * FEE_PERCENTAGE);
	const totalPrice = $derived(discountedPrice + transactionFee);
	const imagesCount = $derived(selectedTier ? Math.floor(selectedTier.tokens / 100) : 0);

	// Fetch tiers on mount
	$effect(() => {
		async function loadTiers() {
			try {
				isLoading = true;
				loadError = null;

				const response = await fetch('/api/tokens/tiers');
				const data = await response.json();

				if (!data.success || !data.tiers) {
					throw new Error(data.error || 'Failed to load token tiers');
				}

				tiers = data.tiers;

				// Find the "Popular" tier or default to middle
				const popularIndex = tiers.findIndex(
					(t) => t.name.toLowerCase().includes('popular') || t.packs === 3
				);
				if (popularIndex !== -1) {
					selectedTierIndex = popularIndex;
				} else {
					selectedTierIndex = Math.floor(tiers.length / 2);
				}
			} catch (error) {
				console.error('Failed to load token tiers:', error);
				loadError = error instanceof Error ? error.message : 'Failed to load pricing options';
				toasts.error('Failed to load pricing options');
			} finally {
				isLoading = false;
			}
		}

		loadTiers();
	});

	// Get icon and color for tier based on pack count
	function getTierIcon(packs: number) {
		if (packs <= 1) return Zap;
		if (packs <= 3) return TrendingUp;
		return Rocket;
	}

	function getTierColor(packs: number) {
		if (packs === 3) return 'var(--brand, #c90019)';
		return 'var(--ui-text, #1a202c)';
	}

	function getTierDescription(packs: number) {
		if (packs <= 1) return 'Perfect for trying out AI features';
		if (packs <= 3) return 'Best value for regular creators';
		return 'Maximum savings for power users';
	}

	function isRecommended(packs: number) {
		return packs === 3; // Middle tier is usually recommended
	}

	function formatPrice(amount: number): string {
		return `$${amount.toFixed(2)}`;
	}

	async function handlePurchase() {
		if (!acceptedTerms) {
			toasts.error('Please accept the terms of service');
			return;
		}

		if (!selectedTier) {
			toasts.error('Please select a token pack');
			return;
		}

		isPurchasing = true;

		try {
			const response = await fetch('/api/tokens/purchase', {
				method: 'POST',
				headers: getAuthHeaders({
					'Content-Type': 'application/json'
				}),
				body: JSON.stringify({
					packs: selectedTier.packs
				})
			});

			const data = await response.json();

			if (response.status === 401) {
				toasts.error('Please sign in to purchase tokens');
				isPurchasing = false;
				// Optionally redirect to sign in
				setTimeout(() => goto('/'), 2000);
				return;
			}

			if (data.success && data.checkoutUrl) {
				// Redirect to Lemon Squeezy checkout
				window.location.href = data.checkoutUrl;
			} else {
				toasts.error(data.error || 'Failed to create checkout session');
				isPurchasing = false;
			}
		} catch (error) {
			console.error('Purchase error:', error);
			toasts.error('Failed to start checkout');
			isPurchasing = false;
		}
	}
</script>

<div class="token-store" class:compact={props.compact}>
	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading pricing options...</p>
		</div>
	{:else if loadError}
		<div class="error-state">
			<p class="error-message">{loadError}</p>
			<button
				class="retry-button"
				onclick={() => window.location.reload()}
				type="button"
			>
				Retry
			</button>
		</div>
	{:else if selectedTier}
		<!-- Tier Selection Cards -->
		<div class="tier-grid">
			{#each tiers as tier, index}
				{@const isSelected = index === selectedTierIndex}
				{@const savings = tier.discount > 0 ? Math.round(tier.discount * 100) : 0}
				{@const recommended = isRecommended(tier.packs)}
				{@const icon = getTierIcon(tier.packs)}
				{@const color = getTierColor(tier.packs)}
				{@const description = getTierDescription(tier.packs)}

				<button
					class="tier-card"
					class:selected={isSelected}
					class:recommended
					onclick={() => (selectedTierIndex = index)}
					type="button"
				>
					{#if recommended}
						<div class="recommended-badge">
							<Pill variant="success">
								{#snippet icon()}<TrendingUp size={12} />{/snippet}
								Recommended
							</Pill>
						</div>
					{/if}

					<div class="tier-header">
						<div class="tier-icon" style="color: {color}">
							<svelte:component this={icon} size={32} />
						</div>
						<h3 class="tier-name">{tier.name}</h3>
						<p class="tier-description">{description}</p>
					</div>

					<div class="tier-details">
						<div class="token-count">
							<Zap size={16} />
							<span>{tier.tokens.toLocaleString()} tokens</span>
						</div>
						<div class="image-count">~{Math.floor(tier.tokens / 100)} images</div>
					</div>

					<div class="tier-pricing">
						<div class="price-main">{formatPrice(tier.price)}</div>
						{#if savings > 0}
							<div class="savings-badge">
								<Pill variant="success">Save {savings}%</Pill>
							</div>
						{/if}
					</div>

					<div class="selection-indicator">
						{#if isSelected}
							<div class="radio-selected">
								<Check size={16} />
							</div>
						{:else}
							<div class="radio-unselected"></div>
						{/if}
					</div>
				</button>
			{/each}
		</div>

		<!-- Price Summary -->
		<div class="price-summary">
			<div class="summary-row">
				<span>{selectedTier.name} ({selectedTier.tokens.toLocaleString()} tokens)</span>
				<span class="price">{formatPrice(selectedTier.price)}</span>
			</div>

			{#if selectedTier.discount > 0}
				<div class="summary-row discount">
					<span>Bulk Discount ({Math.round(selectedTier.discount * 100)}%)</span>
					<span class="price"
						>-{formatPrice(selectedTier.price - discountedPrice)}</span
					>
				</div>
			{:else}
				<div class="summary-row no-discount">
					<span>No bulk discount</span>
					<span class="price">—</span>
				</div>
			{/if}

			<div class="summary-row fee">
				<span>Lemon Squeezy fee</span>
				<span class="price">{formatPrice(transactionFee)}</span>
			</div>

			<div class="summary-row total">
				<span>Total</span>
				<span class="price">{formatPrice(totalPrice)}</span>
			</div>

			<div class="value-indicator">
				<span class="images-count">Enough for <strong>{imagesCount}</strong> images</span>
				<span class="cost-per">{formatPrice(totalPrice / imagesCount)} per image</span>
			</div>
		</div>

		<!-- Terms Acceptance -->
		<div class="terms-acceptance">
			<label class="terms-checkbox">
				<input type="checkbox" bind:checked={acceptedTerms} />
				<span class="terms-text">
					I have read and accept the
					<a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>, including
					that AI-generated images become part of the
					<strong>Community Image Library</strong>.
				</span>
			</label>
		</div>

		<!-- Purchase Button -->
		<button
			class="purchase-button"
			disabled={!acceptedTerms || isPurchasing}
			onclick={handlePurchase}
			type="button"
		>
			{#if isPurchasing}
				<div class="spinner"></div>
				<span>Creating checkout...</span>
			{:else}
				<ShoppingCart size={20} />
				<span>Pay {formatPrice(totalPrice)}</span>
			{/if}
		</button>
	{/if}
</div>

<style>
	.token-store {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.token-store.compact {
		gap: 1rem;
	}

	/* Loading and Error States */
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.loading-state p,
	.error-state p {
		margin-top: 1rem;
		color: var(--ui-muted, #64748b);
	}

	.error-message {
		color: var(--error, #dc2626);
		font-weight: 500;
	}

	.retry-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: var(--button-primary-bg, #3b82f6);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	.retry-button:hover {
		background: var(--button-primary-hover, #2563eb);
	}

	/* Tier Grid */
	.tier-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.tier-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.tier-card:hover {
		border-color: var(--button-primary-bg, #3b82f6);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		transform: translateY(-2px);
	}

	.tier-card.selected {
		border-color: var(--brand, #c90019);
		box-shadow: 0 4px 16px rgba(201, 0, 25, 0.15);
	}

	.tier-card.recommended {
		border-color: var(--brand, #c90019);
	}

	.recommended-badge {
		position: absolute;
		top: -0.5rem;
		left: 50%;
		transform: translateX(-50%);
	}

	/* Tier Header */
	.tier-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.tier-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--ui-hover-bg, #f8fafc);
	}

	.tier-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--ui-text, #1a202c);
	}

	.tier-description {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--ui-muted, #64748b);
		line-height: 1.4;
	}

	/* Tier Details */
	.tier-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
	}

	.token-count {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	.image-count {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
	}

	/* Tier Pricing */
	.tier-pricing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.price-main {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--brand, #c90019);
	}

	.savings-badge {
		margin-top: -0.25rem;
	}

	/* Selection Indicator */
	.selection-indicator {
		display: flex;
		justify-content: center;
		margin-top: 0.5rem;
	}

	.radio-selected,
	.radio-unselected {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.radio-selected {
		background: var(--brand, #c90019);
		color: white;
	}

	.radio-unselected {
		border: 2px solid var(--ui-border, #e2e8f0);
		background: white;
	}

	/* Price Summary */
	.price-summary {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 8px;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 0.875rem;
		gap: 1rem;
	}

	.summary-row span:first-child {
		flex: 1;
		color: var(--ui-text, #1a202c);
	}

	.summary-row .price {
		font-weight: 600;
		white-space: nowrap;
	}

	.summary-row.discount {
		color: #059669;
	}

	.summary-row.discount .price {
		color: #059669;
	}

	.summary-row.no-discount {
		color: var(--ui-muted, #64748b);
		font-size: 0.8125rem;
	}

	.summary-row.fee {
		color: var(--ui-muted, #64748b);
		font-size: 0.8125rem;
	}

	.summary-row.total {
		padding-top: 0.75rem;
		border-top: 2px solid var(--ui-border, #e2e8f0);
		margin-top: 0.25rem;
		font-size: 1rem;
		font-weight: 700;
	}

	.value-indicator {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem;
		background: white;
		border-radius: 6px;
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.images-count {
		color: var(--ui-text, #1a202c);
	}

	.cost-per {
		color: var(--ui-muted, #64748b);
		font-weight: 500;
	}

	/* Terms Acceptance */
	.terms-acceptance {
		padding: 1rem;
		background: var(--ui-bg-secondary, #f9fafb);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 8px;
	}

	.terms-checkbox {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
		user-select: none;
	}

	.terms-checkbox input[type='checkbox'] {
		margin-top: 0.25rem;
		cursor: pointer;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.terms-text {
		font-size: 0.875rem;
		color: var(--text-primary, #2d3748);
		line-height: 1.5;
	}

	.terms-text a {
		color: var(--primary, #3b82f6);
		text-decoration: none;
	}

	.terms-text a:hover {
		text-decoration: underline;
	}

	.terms-text strong {
		color: var(--brand, #c90019);
		font-weight: 600;
	}

	/* Purchase Button */
	.purchase-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: var(--brand, #c90019);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.purchase-button:not(:disabled):hover {
		background: #a80116;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(201, 0, 25, 0.3);
	}

	.purchase-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.tier-grid {
			grid-template-columns: 1fr;
		}

		.tier-card {
			padding: 1.25rem;
		}

		.recommended-badge {
			top: 1rem;
			left: 1rem;
			transform: none;
		}
	}
</style>
