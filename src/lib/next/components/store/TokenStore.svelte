<script lang="ts">
	import { LightbulbIcon, ShoppingCart, TrendingDown, Zap } from 'lucide-svelte';

	const props = $props<{
		compact?: boolean; // Whether to show compact version (for dashboard embedding)
	}>();

	// Pricing configuration (base currency: USD)
	const PACK_PRICE_USD = 4.78; // $4.78 USD per pack
	const TOKENS_PER_PACK = 5000;
	const BASE_FEE_USD = 0.5; // Lemon Squeezy base fee
	const FEE_PERCENTAGE = 0.05; // 5%

	// TODO: Get user's currency from settings/locale
	const CURRENCY = 'USD';
	const CURRENCY_SYMBOL = '$';

	// Discount tiers
	const DISCOUNTS = [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.2, 0.2, 0.2, 0.2];

	// State
	let selectedPacks = $state(1);
	let acceptedTerms = $state(false);

	// Calculations
	let basePrice = $derived(selectedPacks * PACK_PRICE_USD);
	let discount = $derived(DISCOUNTS[selectedPacks - 1] || 0);
	let discountedPrice = $derived(basePrice * (1 - discount));
	let transactionFee = $derived(BASE_FEE_USD + discountedPrice * FEE_PERCENTAGE);
	let totalPrice = $derived(discountedPrice + transactionFee);
	let totalTokens = $derived(selectedPacks * TOKENS_PER_PACK);
	let totalImages = $derived(Math.floor(totalTokens / 100));
	let costPerImage = $derived(totalPrice / totalImages);

	// Savings vs single pack
	const SINGLE_PACK_TOTAL = PACK_PRICE_USD + BASE_FEE_USD + PACK_PRICE_USD * FEE_PERCENTAGE;
	let savingsPercent = $derived(
		selectedPacks > 1 ? (1 - costPerImage / (SINGLE_PACK_TOTAL / 100)) * 100 : 0
	);

	function formatPrice(amount: number): string {
		return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
	}
</script>

<div class="token-store" class:compact={props.compact}>
	<!-- Pack Selector -->
	<div class="pack-selector">
		<div class="selector-header">
			<div class="pack-info">
				<span class="pack-count">{selectedPacks}</span>
				<span class="pack-label">{selectedPacks === 1 ? 'pack' : 'packs'}</span>
			</div>
			<div class="value-preview">
				<Zap size={16} />
				<span>{totalTokens.toLocaleString()} tokens</span>
			</div>
		</div>

		<input
			type="range"
			min="1"
			max="10"
			bind:value={selectedPacks}
			class="pack-slider"
			style="--progress: {((selectedPacks - 1) / 9) * 100}%"
		/>

		<div class="discount-indicator">
			{#if discount > 0}
				<TrendingDown size={14} />
				<span
					>{(discount * 100).toFixed(0)}% bulk discount • Save {savingsPercent.toFixed(0)}% per
					image!</span
				>
			{:else}
				<LightbulbIcon size={12} />
				<span>Buy more than one Token Pack and get significan discounts!</span>
			{/if}
		</div>
	</div>

	<!-- Price Summary -->
	<div class="price-summary">
		<div class="summary-row">
			<span
				>{selectedPacks} Token Pack{selectedPacks > 1 ? 's' : ''} ({totalTokens.toLocaleString()} tokens)
				@ {formatPrice(PACK_PRICE_USD)}</span
			>
			<span class="price">{formatPrice(basePrice)}</span>
		</div>

		<div class="summary-row discount">
			<span>Bulk Discount ({(discount * 100).toFixed(0)}%)</span>
			<span class="price">-{formatPrice(basePrice - discountedPrice)}</span>
		</div>

		<div class="summary-row fee">
			<span
				>Lemon Squeezy fee ({formatPrice(BASE_FEE_USD)} + {(FEE_PERCENTAGE * 100).toFixed(
					0
				)}%)</span
			>
			<span class="price">{formatPrice(transactionFee)}</span>
		</div>

		<div class="summary-row total">
			<span>Total</span>
			<span class="price">{formatPrice(totalPrice)}</span>
		</div>

		<div class="value-indicator">
			<span class="images-count"
				>Enough to generate <strong>{totalImages.toLocaleString()}</strong> images</span
			>
			<span class="cost-per">{formatPrice(costPerImage)} per image</span>
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

	<!-- CTA Button -->
	<button class="purchase-button" disabled={props.showComingSoon || !acceptedTerms}>
		<ShoppingCart size={20} />
		<span>Pay {formatPrice(totalPrice)}</span>
		{#if props.showComingSoon}
			<span class="coming-soon-tag">Soon</span>
		{/if}
	</button>
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

	/* Pack Selector */
	.pack-selector {
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 8px;
		padding: 1rem;
	}

	.selector-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.pack-info {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.pack-count {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--brand, #c90019);
		line-height: 1;
	}

	.pack-label {
		font-size: 0.875rem;
		color: var(--ui-muted, #64748b);
		font-weight: 500;
	}

	.value-preview {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: white;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--ui-text, #1a202c);
	}

	.value-preview :global(svg) {
		color: var(--brand, #c90019);
	}

	/* Slider */
	.pack-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		outline: none;
		-webkit-appearance: none;
		background: linear-gradient(
			to right,
			var(--brand, #c90019) 0%,
			var(--brand, #c90019) var(--progress),
			#e2e8f0 var(--progress),
			#e2e8f0 100%
		);
		cursor: pointer;
		margin-bottom: 0.75rem;
	}

	.pack-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		border: 3px solid var(--brand, #c90019);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		transition: transform 0.2s;
	}

	.pack-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.pack-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		border: 3px solid var(--brand, #c90019);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		transition: transform 0.2s;
	}

	.pack-slider::-moz-range-thumb:hover {
		transform: scale(1.15);
	}

	.discount-indicator {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: #059669;
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0.25rem 0;
	}

	/* Price Summary */
	.price-summary {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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
		background: var(--ui-hover-bg, #f8fafc);
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
		margin-top: 1rem;
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
		position: relative;
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

	.coming-soon-tag {
		position: absolute;
		top: -0.375rem;
		right: -0.375rem;
		background: #fbbf24;
		color: #78350f;
		padding: 0.25rem 0.5rem;
		border-radius: 10px;
		font-size: 0.6875rem;
		font-weight: 700;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.selector-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.value-preview {
			align-self: stretch;
			justify-content: center;
		}
	}
</style>
