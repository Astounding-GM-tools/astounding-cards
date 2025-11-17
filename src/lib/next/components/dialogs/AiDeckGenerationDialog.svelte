<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import { isAuthenticated } from '../../stores/auth.js';
	import { toasts } from '$lib/stores/toast.js';
	import { tokenAmount, tokenBalanceStore } from '../../stores/tokenBalance.js';
	import { nextDeckStore } from '../../stores/deckStore.svelte.js';
	import AuthGatedCtaButton from '../cta/AuthGatedCtaButton.svelte';
	import { DECK_GENERATION_CTA } from '$lib/config/cta-configs.js';
	import { calculateDeckGenerationCost, formatTokenBalance } from '$lib/config/token-costs.js';
	import { getAuthHeaders } from '$lib/utils/auth-helpers.js';
	import { importDeckFromJson } from '../../utils/jsonImporter.js';
	import { nextDb } from '../../stores/database.js';

	interface Props {
		// Optional props for testing/stories
		isAuthenticatedOverride?: boolean;
	}

	let { isAuthenticatedOverride }: Props = $props();

	// State
	let prompt = $state('');
	let cardCount = $state(10);
	let isGenerating = $state(false);
	let showExamples = $state(false);

	// Auth check (use override for testing, otherwise use real store)
	const isUserAuthenticated = $derived(
		isAuthenticatedOverride !== undefined ? isAuthenticatedOverride : $isAuthenticated
	);

	// Calculate cost and check affordability
	const generationCost = $derived(calculateDeckGenerationCost(cardCount));
	const userTokenBalance = $derived($tokenAmount);
	const canAfford = $derived(userTokenBalance >= generationCost);

	// Example prompts to inspire users
	const examplePrompts = [
		{
			title: 'Fantasy Heroes',
			prompt:
				'A deck of fantasy RPG heroes including Elara Moonwhisper (elven ranger), Grimm Ironforge (dwarven warrior), and Zephyr Nightshade (tiefling rogue). Each should have combat stats (strength, agility, intelligence), unique special abilities, and a compelling backstory. Make them diverse in race, class, and background.'
		},
		{
			title: 'Startup Founders',
			prompt:
				'Tech startup founders from different industries. Each should have stats like funding raised, team size, and burn rate. Include their startup idea, their biggest challenge, and a unique trait. Mix successful and struggling founders.'
		},
		{
			title: 'Mythical Creatures',
			prompt:
				'Creatures from world mythology - Greek, Norse, Japanese, African, and Native American. Give each one threat level, habitat, and special powers. Include lesser-known creatures, not just the famous ones.'
		},
		{
			title: 'Cooking Ingredients',
			prompt:
				'Turn common cooking ingredients into characters. Each ingredient should have flavor profile stats (sweet, salty, umami, bitter, sour), cooking method preferences, and a personality that matches their culinary role. Make them quirky and fun.'
		}
	];

	function useExample(example: (typeof examplePrompts)[number]) {
		prompt = example.prompt;
		showExamples = false;
	}

	async function generateDeck() {
		if (!prompt.trim()) {
			toasts.error('Please enter a prompt for your deck');
			return;
		}

		isGenerating = true;
		const startTime = Date.now();

		try {
			// Call the API endpoint
			const authHeaders = getAuthHeaders();
			const response = await fetch('/api/ai/generate-deck', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...authHeaders
				},
				body: JSON.stringify({ prompt, cardCount })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(errorData.message || `Failed to generate deck: ${response.statusText}`);
			}

			const result = await response.json();

			if (!result.success || !result.deck) {
				throw new Error('Invalid response from server');
			}

			// Convert the generated deck JSON to standard format
			const jsonString = JSON.stringify(result.deck);
			const importResult = await importDeckFromJson(jsonString);

			if (!importResult.success || !importResult.deck) {
				throw new Error(importResult.error || 'Failed to import generated deck');
			}

			// Save the deck to IndexedDB
			const savedDeck = await nextDb.saveDeck(importResult.deck);

			// Load the deck into the store
			await nextDeckStore.loadDeck(savedDeck.id);

			// Refresh token balance
			await tokenBalanceStore.fetchBalance();

			const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
			toasts.success(
				`✅ Deck generated with ${result.cardCount} cards in ${elapsedTime}s! (${result.cost} tokens)`
			);

			dialogStore.close();
		} catch (error) {
			console.error('Generation error:', error);
			toasts.error(error instanceof Error ? error.message : 'Failed to generate deck');
		} finally {
			isGenerating = false;
		}
	}

	function handleAuthenticatedClick() {
		generateDeck();
	}
</script>

<div class="ai-deck-generation">
	<div class="header">
		<h2>✨ Generate New Deck</h2>
		<button class="close-button" onclick={() => dialogStore.close()}>×</button>
	</div>

	<div class="content">
		{#if isGenerating}
			<!-- Generating State -->
			<div class="generating-state">
				<div class="spinner">🎴</div>
				<h3>Generating Your Deck...</h3>
				<p class="generating-prompt">{prompt.substring(0, 100)}...</p>
				<div class="info-box">
					<p><strong>✓ Generation started</strong></p>
					<p>Creating {cardCount} unique cards</p>
					<p>Expected time: ~{Math.ceil(cardCount / 2)}-{cardCount} seconds</p>
					<p class="safe-notice">
						💡 Safe to close this dialog - your deck will be created and loaded automatically!
					</p>
				</div>
			</div>
		{:else}
			<!-- Prompt Input -->
			<div class="prompt-section">
				<label for="prompt">Describe Your Deck</label>
				<p class="help-text">
					Be detailed! Describe the theme, what kind of cards you want, what stats or abilities they
					should have. The more specific you are, the better your deck will be.
				</p>

				<textarea
					id="prompt"
					bind:value={prompt}
					placeholder="Example: A deck of cyberpunk hackers with different specializations. Each should have hacking skill, stealth, and tech level stats. Include their signature hack, their motivation, and a unique cybernetic enhancement..."
					rows="6"
					maxlength="1000"
				></textarea>

				<div class="prompt-footer">
					<span class="char-count">{prompt.length}/1000</span>
					<button class="text-button" onclick={() => (showExamples = !showExamples)}>
						{showExamples ? '✕ Hide' : '💡'} Example Prompts
					</button>
				</div>

				{#if showExamples}
					<div class="examples-grid">
						{#each examplePrompts as example}
							<button class="example-card" onclick={() => useExample(example)}>
								<strong>{example.title}</strong>
								<p>{example.prompt.substring(0, 100)}...</p>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Card Count -->
			<div class="form-group">
				<label for="cardCount">Number of Cards</label>
				<div class="slider-container">
					<input
						id="cardCount"
						type="range"
						bind:value={cardCount}
						min="3"
						max="52"
						step="1"
						class="slider"
					/>
					<div class="slider-value">{cardCount} cards</div>
				</div>
				<p class="help-text">Recommended: 8-20 cards for most decks</p>
			</div>

			<!-- Cost & Balance Notice -->
			{#if isUserAuthenticated}
				<div class="cost-notice" class:insufficient={!canAfford}>
					<div class="notice-header">
						<span class="icon">💰</span>
						<strong>Cost: {generationCost} tokens</strong>
					</div>
					{#if canAfford}
						<p>
							You have <strong>{formatTokenBalance(userTokenBalance)}</strong> ✅ Deck generation
							costs <strong>{generationCost} tokens</strong> ({cardCount} cards × 10 tokens each). Images
							cost extra (100 tokens each).
						</p>
					{:else}
						<p>
							You have <strong>{formatTokenBalance(userTokenBalance)}</strong> ❌ You need
							<strong>{generationCost} tokens</strong> to generate this deck.
						</p>
						<button class="buy-tokens-btn" onclick={() => console.log('Buy tokens')}>
							💰 Buy More Tokens
						</button>
					{/if}
				</div>
			{/if}
		{/if}
	</div>

	<div class="footer">
		{#if isGenerating}
			<button class="secondary-button" onclick={() => dialogStore.close()}>
				Close & Continue Generation
			</button>
		{:else}
			<AuthGatedCtaButton
				config={DECK_GENERATION_CTA}
				onAuthenticatedClick={handleAuthenticatedClick}
				{isAuthenticatedOverride}
			/>
		{/if}
	</div>
</div>

<style>
	.ai-deck-generation {
		background: white;
		display: flex;
		flex-direction: column;
		max-height: 85vh;
		min-width: 600px;
		max-width: 800px;
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

	.generating-prompt {
		margin: 0;
		font-size: 0.875rem;
		color: #64748b;
		font-style: italic;
		max-width: 400px;
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

	/* Prompt Section */
	.prompt-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.prompt-section label {
		font-weight: 600;
		font-size: 0.875rem;
		color: #1a202c;
	}

	.prompt-section textarea {
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
		min-height: 120px;
	}

	.prompt-section textarea:focus {
		outline: none;
		border-color: #059669;
	}

	.prompt-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: -0.25rem;
	}

	.char-count {
		font-size: 0.75rem;
		color: #64748b;
	}

	.text-button {
		background: none;
		border: none;
		color: #059669;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.text-button:hover {
		background: rgba(5, 150, 105, 0.1);
	}

	.examples-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.example-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
	}

	.example-card:hover {
		background: #e2e8f0;
		border-color: #cbd5e1;
		transform: translateY(-1px);
	}

	.example-card strong {
		display: block;
		font-size: 0.875rem;
		color: #1a202c;
		margin-bottom: 0.25rem;
	}

	.example-card p {
		margin: 0;
		font-size: 0.75rem;
		color: #64748b;
		line-height: 1.4;
	}

	/* Form Group */
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

	.slider-container {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.slider {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: #e2e8f0;
		outline: none;
		-webkit-appearance: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #059669;
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #059669;
		cursor: pointer;
		border: none;
	}

	.slider-value {
		font-weight: 600;
		font-size: 0.875rem;
		color: #059669;
		min-width: 80px;
		text-align: right;
	}

	.help-text {
		font-size: 0.75rem;
		color: #64748b;
		margin: 0;
		line-height: 1.4;
	}

	/* Cost Notice */
	.cost-notice {
		background: rgba(34, 197, 94, 0.05);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: 8px;
		padding: 1rem;
		font-size: 0.875rem;
	}

	.cost-notice.insufficient {
		background: rgba(239, 68, 68, 0.05);
		border-color: rgba(239, 68, 68, 0.2);
	}

	.notice-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		color: #1a202c;
	}

	.notice-header .icon {
		font-size: 1.25rem;
	}

	.notice-header strong {
		font-size: 0.95rem;
	}

	.cost-notice p {
		margin: 0;
		color: #1a202c;
		line-height: 1.5;
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
		margin-top: 0.5rem;
	}

	.buy-tokens-btn:hover {
		background: #d97706;
		transform: translateY(-1px);
	}

	/* Footer */
	.footer {
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.secondary-button {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		background: white;
		color: #1a202c;
		border: 1px solid #e2e8f0;
	}

	.secondary-button:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
	}
</style>
