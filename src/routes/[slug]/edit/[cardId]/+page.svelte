<script lang="ts">
	import type { Card } from '$lib/next/types/card.js';
	import type { Stat, Trait } from '$lib/next/types/card.js';
	import type { ImageDisplayInfo } from '$lib/next/utils/imageDisplayInfo.js';
	import type { CardFormData } from '$lib/next/utils/cardChangeDetection.js';

	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Save, Check, CircleAlert, Trash2 } from 'lucide-svelte';

	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import StatsEditor from '$lib/next/components/editors/StatsEditor.svelte';
	import TraitsEditor from '$lib/next/components/editors/TraitsEditor.svelte';
	import CardComponent from '$lib/next/components/card/Card.svelte';
	import CardFrontContent from '$lib/next/components/card/CardFrontContent.svelte';
	import CardBackContent from '$lib/next/components/card/CardBackContent.svelte';
	import CardPresetMinimal from '$lib/next/components/card/CardPresetMinimal.svelte';
	import InlineImageSelector from '$lib/next/components/image/InlineImageSelector.svelte';
	import AuthGatedCtaButton from '$lib/next/components/cta/AuthGatedCtaButton.svelte';
	import CommunityImagesSection from '$lib/next/components/image/CommunityImagesSection.svelte';
	import AiImageGenerationDialog from '$lib/next/components/dialogs/AiImageGenerationDialog.svelte';

	import { toasts } from '$lib/stores/toast.js';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';
	import { safeDeepClone } from '$lib/utils/clone-utils.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { ImageUrlManager } from '$lib/utils/image-handler.js';
	import { createDebounce } from '$lib/next/utils/debounce.svelte.js';
	import { IMAGE_GENERATION_CTA } from '$lib/config/cta-configs.js';
	import { getPresetCapabilities } from '$lib/next/utils/presetCapabilities.js';
	import { hasCardChanges, formDataToCardUpdate } from '$lib/next/utils/cardChangeDetection.js';
	import { computeImageDisplayInfo, getFilenameFromUrl } from '$lib/next/utils/imageDisplayInfo.js';

	// Get params from URL
	let deckId = $derived($page.params.slug);
	let cardId = $derived($page.params.cardId);

	// Load the deck on mount
	onMount(async () => {
		// Check if deck is already loaded
		if (!nextDeckStore.deck || nextDeckStore.deck.id !== deckId) {
			await nextDeckStore.loadDeck(deckId as string);
		}
	});

	// Get the card and deck from store
	let card = $derived(nextDeckStore.getCard(cardId as string));
	let currentDeck = $derived(nextDeckStore.deck);

	// Get all cards for sidebar navigation
	let allCards = $derived(currentDeck?.cards || []);
	let currentCardIndex = $derived(allCards.findIndex((c) => c.id === (cardId as string)));

	// Get the deck's preset setting
	let preset = $derived(currentDeck?.meta.preset || 'trading');

	// Get preset capabilities to determine what form fields to show
	let capabilities = $derived(getPresetCapabilities(preset));

	// Check if deck shows card backs (for print layout)
	// Only show back preview if the preset has a back card design
	let showBackInPreview = $state(true);

	// Working state for form (unsaved changes)
	let formData = $state<CardFormData>({
		title: '',
		subtitle: '',
		description: '',
		stats: [] as Stat[],
		traits: [] as Trait[],
		imageBlob: null as Blob | null,
		imageUrl: null as string | null,
		imageMetadata: null as Card['imageMetadata'] | null
	});

	// Track if form has been initialized to prevent false change detection
	let isFormInitialized = $state(false);

	// Image URL manager for blob handling
	let imageUrlManager = $state(new ImageUrlManager());

	// Check if card has image for display
	let hasImage = $derived(
		!!(formData.imageBlob || formData.imageUrl || card?.imageBlob || card?.image)
	);

	// Create preview card with live form data
	let previewCard = $derived(
		card
			? {
					...card,
					title: isFormInitialized ? formData.title : card.title,
					subtitle: isFormInitialized ? formData.subtitle : card.subtitle,
					description: isFormInitialized ? formData.description : card.description,
					stats: isFormInitialized ? formData.stats : card.stats || [],
					traits: isFormInitialized ? formData.traits : card.traits || [],
					imageBlob: isFormInitialized ? formData.imageBlob : card.imageBlob || null,
					image: isFormInitialized ? formData.imageUrl : card.image || null
				}
			: null
	);

	// Compute image display info reactively
	let imageDisplayInfo = $derived<ImageDisplayInfo>(
		computeImageDisplayInfo({
			formBlob: formData.imageBlob,
			formUrl: formData.imageUrl,
			formMetadata: formData.imageMetadata,
			cardImageBlob: card?.imageBlob,
			cardImageUrl: card?.image,
			cardMetadata: card?.imageMetadata,
			isFormInitialized
		})
	);

	// Update form when card changes
	$effect(() => {
		if (card) {
			isFormInitialized = false;

			formData.title = card.title;
			formData.subtitle = card.subtitle;
			formData.description = card.description;
			formData.stats = safeDeepClone(card.stats || []);
			formData.traits = safeDeepClone(card.traits || []);
			formData.imageBlob = card.imageBlob || null;
			formData.imageUrl = card.image || null;
			formData.imageMetadata = card.imageMetadata ? safeDeepClone(card.imageMetadata) : null;

			imageUrlManager.updateBlob(card.imageBlob);

			Promise.resolve().then(() => {
				isFormInitialized = true;
			});
		}
	});

	// Image handling functions
	async function handleImageChange(
		blob: Blob | null,
		sourceUrl?: string,
		originalFileName?: string
	) {
		formData.imageBlob = blob;
		formData.imageUrl = sourceUrl || null;

		if (blob || sourceUrl) {
			formData.imageMetadata = {
				originalName: originalFileName || getFilenameFromUrl(sourceUrl) || 'image',
				addedAt: Date.now(),
				source: sourceUrl ? 'url' : 'upload',
				size: blob?.size
			};
		} else {
			formData.imageMetadata = null;
		}

		imageUrlManager.updateBlob(blob);
	}

	function removeImage() {
		formData.imageBlob = null;
		formData.imageUrl = null;
		formData.imageMetadata = null;
		imageUrlManager.updateBlob(null);
	}

	// Cleanup on destroy
	$effect(() => {
		return () => {
			imageUrlManager.destroy();
		};
	});

	// Detect unsaved changes
	let hasChanges = $derived(isFormInitialized && hasCardChanges(formData, card));

	// Auto-save with 2-second debounce
	async function saveChanges() {
		if (!card || !hasChanges) return;

		const updates = formDataToCardUpdate(formData);
		const success = await nextDeckStore.updateCard(card.id, updates, 'Saving card changes...');

		if (!success) {
			console.error('[Edit] Failed to save changes');
		}
	}

	// Create debounced save function
	const debouncedSave = createDebounce(saveChanges, 2000);

	// Auto-save effect
	$effect(() => {
		if (hasChanges) {
			debouncedSave();
		}
	});

	// Cleanup on destroy
	$effect(() => {
		return () => {
			debouncedSave.cancel();
		};
	});

	function exitEditMode() {
		goto(`/${deckId}`);
	}

	async function deleteCard() {
		if (!card) return;

		const cardTitle = card.title;
		const confirmed = confirm(`Delete card "${cardTitle}"?\n\nThis action cannot be undone.`);

		if (!confirmed) return;

		// Navigate to first card or exit if this is the last card
		if (allCards.length > 1) {
			const nextIndex = currentCardIndex > 0 ? currentCardIndex - 1 : 1;
			const nextCard = allCards[nextIndex];
			goto(`/${deckId}/edit/${nextCard.id}`);
		} else {
			goto(`/${deckId}`);
		}

		// Then delete the card
		const success = await nextDeckStore.removeCard(cardId as string);

		if (success) {
			toasts.success(`🗑️ Card "${cardTitle}" deleted`);
		} else {
			toasts.error(`Failed to delete card "${cardTitle}"`);
		}
	}

	// Open AI Image Generation Dialog
	function openImageGenerationDialog() {
		if (!card) return;

		const deckImageStyle = nextDeckStore.deck?.meta?.imageStyle || 'classic';

		const currentCardData: Card = {
			...card,
			title: formData.title,
			subtitle: formData.subtitle,
			description: formData.description,
			stats: formData.stats,
			traits: formData.traits
		};

		dialogStore.setContent(AiImageGenerationDialog, {
			card: currentCardData,
			deckImageStyle
		});
	}

	// Navigate to specific card
	function navigateToCard(targetCardId: string) {
		goto(`/${deckId}/edit/${targetCardId}`);
	}

	// Keyboard navigation
	function handleKeydown(e: KeyboardEvent) {
		// Don't trigger if user is typing in an input/textarea
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
			return;
		}

		if (e.key === 'Escape') {
			exitEditMode();
		} else if (e.key === 'ArrowLeft' && currentCardIndex > 0) {
			navigateToCard(allCards[currentCardIndex - 1].id);
		} else if (e.key === 'ArrowRight' && currentCardIndex < allCards.length - 1) {
			navigateToCard(allCards[currentCardIndex + 1].id);
		}
	}

	// Handler for community images section
	function handleCommunityImageSelected(imageUrl: string, imageId: string) {
		handleImageChange(null, imageUrl, `community-${imageId}.png`);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title
		>Edit {card?.title || 'Card'} - {currentDeck?.meta?.title || 'Deck'} - Astounding Cards</title
	>
</svelte:head>

{#if card && currentDeck}
	<div class="edit-mode">
		<!-- Header -->
		<header class="edit-header">
			<button class="exit-button" onclick={exitEditMode}>
				<ArrowLeft size={20} />
				<span>Exit Edit Mode</span>
			</button>
			<h1 class="deck-title">{currentDeck.meta.title}</h1>
			<div class="spacer"></div>

			<!-- Status Indicator -->
			<div class="header-status">
				{#if nextDeckStore.isLoading}
					<Save size={16} />
					<span>{nextDeckStore.loadingMessage || 'Saving...'}</span>
				{:else if hasChanges}
					<CircleAlert size={16} />
					<span>Unsaved changes</span>
				{:else}
					<Check size={16} />
					<span>All saved</span>
				{/if}
			</div>

			<!-- Actions -->
			<button
				class="header-action-button danger"
				onclick={deleteCard}
				disabled={nextDeckStore.isLoading}
			>
				<Trash2 size={16} />
				<span>Delete Card</span>
			</button>
		</header>

		<div class="edit-layout">
			<!-- Card List Sidebar -->
			<aside class="card-sidebar">
				<div class="card-list">
					{#each allCards as sidebarCard, index}
						<button
							class="card-thumbnail"
							class:active={sidebarCard.id === cardId}
							onclick={() => navigateToCard(sidebarCard.id)}
							title={sidebarCard.title || 'Untitled'}
						>
							<CardComponent preview>
								{#if preset === 'minimal'}
									<CardPresetMinimal card={sidebarCard} showBack={false} />
								{:else}
									<CardFrontContent card={sidebarCard} />
								{/if}
							</CardComponent>
						</button>
					{/each}
				</div>
			</aside>

			<!-- Main Editor Area -->
			<main class="editor-main">
				<div class="editor-content-grid">
					<!-- LEFT-TOP: Front Card Fields (Title, Subtitle, Traits) -->
					<section class="left-top">
						<!-- Title Field -->
						<div class="field-row">
							<label for="card-title">Title</label>
							<input
								id="card-title"
								type="text"
								bind:value={formData.title}
								placeholder="Enter card title"
								maxlength="100"
								class="field-input"
							/>
						</div>

						<!-- Subtitle Field -->
						<div class="field-row">
							<label for="card-subtitle">Subtitle</label>
							<input
								id="card-subtitle"
								type="text"
								bind:value={formData.subtitle}
								placeholder="Enter subtitle (optional)"
								maxlength="50"
								class="field-input"
							/>
						</div>

						<!-- Traits Section (if preset supports) -->
						{#if capabilities.supportsTraits}
							<TraitsEditor
								traits={formData.traits}
								onUpdate={(newTraits) => {
									formData.traits = newTraits;
								}}
							/>
						{/if}
					</section>

					<!-- CENTER-TOP: Front Card Preview -->
					<section class="center-top">
						{#if previewCard}
							<div class="card-preview">
								<CardComponent preview>
									{#if preset === 'minimal'}
										<CardPresetMinimal card={previewCard} showBack={false} />
									{:else}
										<CardFrontContent card={previewCard} />
									{/if}
								</CardComponent>
							</div>
						{/if}
					</section>

					<!-- RIGHT: Image Tools (spans both rows) -->
					<section class="right-column">
						<fieldset class="form-fieldset">
							<legend>Image</legend>
							<InlineImageSelector
								cardSize="tarot"
								card={previewCard as Card}
								currentStyle={currentDeck?.meta.imageStyle}
								hasExistingImage={hasImage}
								existingImageInfo={imageDisplayInfo}
								onImageChange={handleImageChange}
								onRemoveImage={removeImage}
							/>

							<!-- AI Image Generation -->
							<div class="ai-image-generation">
								<AuthGatedCtaButton
									config={IMAGE_GENERATION_CTA}
									onAuthenticatedClick={openImageGenerationDialog}
								/>
							</div>
						</fieldset>

						<!-- Community Images Section -->
						<CommunityImagesSection
							{card}
							{cardId}
							{previewCard}
							deckDescription={currentDeck?.meta?.description}
							{preset}
							onImageSelected={handleCommunityImageSelected}
						/>
					</section>

					<!-- LEFT-BOTTOM: Back Card Fields (Description, Stats) -->
					<section class="left-bottom">
						<!-- Description Field -->
						<div class="field-row field-row-tall">
							<label for="card-description">Description</label>
							<textarea
								id="card-description"
								bind:value={formData.description}
								placeholder="Enter card description"
								rows="6"
								maxlength="500"
								class="field-textarea"
							></textarea>
						</div>

						<!-- Stats Section (only for presets that support stats) -->
						{#if capabilities.supportsStats}
							<StatsEditor
								stats={formData.stats}
								onUpdate={(newStats) => {
									formData.stats = newStats;
								}}
							/>
						{/if}
					</section>

					<!-- CENTER-BOTTOM: Back Card Preview -->
					<section class="center-bottom">
						{#if previewCard && showBackInPreview && capabilities.hasBackCard}
							<div class="card-preview">
								<CardComponent preview>
									{#if preset === 'minimal'}
										<CardPresetMinimal card={previewCard} showBack={true} />
									{:else}
										<CardBackContent card={previewCard} />
									{/if}
								</CardComponent>
							</div>
						{/if}
					</section>
				</div>
			</main>
		</div>
	</div>
{:else}
	<div class="error-state">
		<h2>Card Not Found</h2>
		<p>The card you're trying to edit could not be found.</p>
		<button onclick={exitEditMode}>Back to Deck</button>
	</div>
{/if}

<Dialog />

<style>
	.edit-mode {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--ui-bg, #f8fafc);
	}

	/* Header */
	.edit-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: white;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		z-index: 10;
	}

	.exit-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 0.375rem;
		background: white;
		color: var(--ui-text, #1e293b);
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.exit-button:hover {
		background: var(--ui-bg-secondary, #f8fafc);
		border-color: var(--ui-text, #1e293b);
	}

	.deck-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--ui-text, #1e293b);
		margin: 0;
	}

	.spacer {
		flex: 1;
	}

	.header-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s ease;
	}

	.header-status :global(svg) {
		flex-shrink: 0;
	}

	.header-status span {
		white-space: nowrap;
	}

	.header-action-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 0.375rem;
		background: white;
		color: var(--ui-text, #1e293b);
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.header-action-button:hover:not(:disabled) {
		background: var(--ui-bg-secondary, #f8fafc);
		border-color: var(--ui-text, #1e293b);
	}

	.header-action-button.danger {
		background: #dc2626;
		color: white;
		border-color: #dc2626;
	}

	.header-action-button.danger:hover:not(:disabled) {
		background: #b91c1c;
	}

	.header-action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Layout */
	.edit-layout {
		display: grid;
		grid-template-columns: 200px 1fr;
		flex: 1;
		overflow: hidden;
	}

	/* Sidebar */
	.card-sidebar {
		background: white;
		border-right: 1px solid var(--ui-border, #e2e8f0);
		overflow-y: auto;
		padding: 0.75rem;
	}

	.card-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.card-thumbnail {
		width: 100%;
		padding: 0;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: var(--font-body);
		overflow: hidden;
		text-align: initial;
	}

	.card-thumbnail:hover {
		border-color: var(--ui-text, #1e293b);
		transform: translateX(2px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.card-thumbnail.active {
		border-color: var(--primary, #3b82f6);
		box-shadow: 0 0 0 3px var(--primary-light, #eff6ff);
	}

	.card-thumbnail :global(.card) {
		width: 100%;
		border: none;
		box-shadow: none;
		border-radius: 0;
	}

	/* Main Editor */
	.editor-main {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.editor-content-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		grid-template-rows: auto auto;
		grid-template-areas:
			'left-top center-top right'
			'left-bottom center-bottom right';
		gap: 2rem 2rem;
		flex: 1;
		overflow: hidden;
		padding: 1.5rem;
	}

	/* Grid areas */
	.left-top {
		grid-area: left-top;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.5rem;
		container-type: inline-size;
		container-name: left-column;
	}

	.left-bottom {
		grid-area: left-bottom;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.5rem;
		container-type: inline-size;
		container-name: left-column;
	}

	.center-top {
		grid-area: center-top;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 0 1.5rem;
		min-width: 360px;
		max-width: 400px;
	}

	.center-bottom {
		grid-area: center-bottom;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 0 1.5rem;
		min-width: 360px;
		max-width: 400px;
	}

	.right-column {
		grid-area: right;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.5rem;
	}

	.field-row {
		display: grid;
		grid-template-columns: 100px 1fr;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	/* Stack fields vertically when container is narrow */
	@container left-column (max-width: 400px) {
		.field-row {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}

		.field-row label {
			text-align: left;
			padding-top: 0;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--ui-muted, #64748b);
		}
	}

	.field-row-tall {
		align-items: start;
	}

	.field-row label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--ui-text, #1e293b);
		text-align: right;
		padding-top: 0.5rem;
	}

	.field-input,
	.field-textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 0.375rem;
		font-family: var(--font-body);
		font-size: 0.9rem;
		background: white;
		transition: all 0.15s ease;
	}

	.field-input:focus,
	.field-textarea:focus {
		outline: none;
		border-color: var(--primary, #3b82f6);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.field-textarea {
		resize: vertical;
		line-height: 1.5;
		min-height: 120px;
	}

	/* Reuse all the form styles from CardEditDialog */
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

	.ai-image-generation {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.card-preview {
		width: 100%;
		max-width: 360px;
	}

	/* Ensure cards maintain aspect ratio */
	.card-preview :global(.card) {
		width: 100%;
		margin: 0 auto;
		border: 1px solid #ddd;
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	/* Error State */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		padding: 2rem;
		text-align: center;
	}

	.error-state h2 {
		color: #e74c3c;
		margin-bottom: 1rem;
	}

	.error-state button {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--primary, #3b82f6);
		color: white;
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.edit-layout {
			grid-template-columns: 150px 1fr;
		}
	}

	@media (max-width: 768px) {
		.edit-layout {
			grid-template-columns: 1fr;
		}

		.card-sidebar {
			display: none;
		}
	}
</style>
