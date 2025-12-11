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

	// Mobile navigation: scroll to section
	function scrollToSection(sectionId: string) {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	// Toggle card sidebar visibility (mobile only)
	let showCardSidebar = $state(false);
	function toggleCardSidebar() {
		showCardSidebar = !showCardSidebar;
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
		<!-- Main Header (always visible) -->
		<header class="main-header">
			<button class="exit-button" onclick={exitEditMode}>
				<ArrowLeft size={20} />
				<span>Exit</span>
			</button>
			<button
				class="nav-button cards-button"
				class:active={showCardSidebar}
				onclick={toggleCardSidebar}
			>
				Cards
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

		<!-- Card Sidebar (toggleable, shown below header) -->
		{#if showCardSidebar}
			<div class="card-sidebar-dropdown">
				{#each allCards as sidebarCard}
					<button
						class="card-thumbnail-small"
						class:active={sidebarCard.id === cardId}
						onclick={() => {
							navigateToCard(sidebarCard.id);
							showCardSidebar = false;
						}}
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
		{/if}

		<!-- Mobile Navigation (mobile only, below header) -->
		<nav class="mobile-nav-bar">
			<button class="nav-button" onclick={() => scrollToSection('text-fields')}>Text</button>
			<button class="nav-button" onclick={() => scrollToSection('image-settings')}>Image</button>
			<button class="nav-button" onclick={() => scrollToSection('preview-front')}>Preview</button>
		</nav>

		<!-- Main Content (flat structure, positioned by CSS Grid on desktop) -->
		<main class="editor-main">
			<!-- Text Fields (Title & Subtitle) -->
			<section class="text-fields" id="text-fields">
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
			</section>

			<!-- Traits Section -->
			{#if capabilities.supportsTraits}
				<section class="traits-section" id="traits">
					<TraitsEditor
						traits={formData.traits}
						onUpdate={(newTraits) => {
							formData.traits = newTraits;
						}}
					/>
				</section>
			{/if}

			<!-- Description Field -->
			<section class="description-field" id="description">
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
			</section>

			<!-- Stats Section -->
			{#if capabilities.supportsStats}
				<section class="stats-section" id="stats">
					<StatsEditor
						stats={formData.stats}
						onUpdate={(newStats) => {
							formData.stats = newStats;
						}}
					/>
				</section>
			{/if}

			<!-- Front Card Preview -->
			<section class="preview-front" id="preview-front">
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

			<!-- Back Card Preview -->
			<section class="preview-back" id="preview-back">
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

			<!-- Image Settings -->
			<section class="image-settings" id="image-settings">
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
			</section>

			<!-- Community Images Gallery -->
			<section class="image-gallery" id="image-gallery">
				<CommunityImagesSection
					{card}
					{cardId}
					{previewCard}
					deckDescription={currentDeck?.meta?.description}
					{preset}
					onImageSelected={handleCommunityImageSelected}
				/>
			</section>
		</main>
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
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	.edit-mode {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--ui-bg, #f8fafc);
	}

	/* ===== MAIN HEADER (always visible) ===== */
	.main-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: white;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		z-index: 100;
		flex-wrap: wrap;
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

	.nav-button {
		padding: 0.5rem 1rem;
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 0.375rem;
		background: white;
		color: var(--ui-text, #1e293b);
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.nav-button:hover {
		background: var(--ui-bg-secondary, #f8fafc);
	}

	.nav-button.active,
	.nav-button.cards-button.active {
		background: var(--primary, #3b82f6);
		color: white;
		border-color: var(--primary, #3b82f6);
	}

	.deck-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--ui-text, #1e293b);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.spacer {
		flex: 1;
		min-width: 1rem;
	}

	.header-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
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

	/* ===== CARD SIDEBAR DROPDOWN (toggleable) ===== */
	.card-sidebar-dropdown {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		overflow-x: auto;
		background: var(--ui-bg-secondary, #f8fafc);
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		z-index: 99;
	}

	.card-thumbnail-small {
		flex-shrink: 0;
		width: 80px;
		padding: 0;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		overflow: hidden;
		container-type: inline-size;
		container-name: card-thumbnail;
		transition: all 0.15s ease;
	}

	.card-thumbnail-small:hover {
		border-color: var(--ui-text, #1e293b);
	}

	.card-thumbnail-small.active {
		border-color: var(--primary, #3b82f6);
		box-shadow: 0 0 0 3px var(--primary-light, #eff6ff);
	}

	.card-thumbnail-small :global(.card) {
		width: 100%;
		border: none;
		box-shadow: none;
	}

	/* ===== MOBILE NAVIGATION BAR (mobile only) ===== */
	.mobile-nav-bar {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: white;
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		overflow-x: auto;
	}

	/* ===== MAIN CONTENT (mobile: vertical scroll, desktop: grid) ===== */
	.editor-main {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1rem;
	}

	.editor-main > section {
		background: white;
		padding: 1rem;
		margin-bottom: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Form fields */
	.field-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.field-row label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ui-muted, #64748b);
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
		margin: 0 auto;
	}

	.card-preview :global(.card) {
		width: 100%;
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

	/* ===== DESKTOP LAYOUT (899px+) ===== */
	@media screen and (min-width: 899px) {
		/* Hide mobile nav bar on desktop */
		.mobile-nav-bar {
			display: none;
		}

		/* Larger header on desktop */
		.main-header {
			padding: 1rem 1.5rem;
			gap: 1rem;
		}

		.deck-title {
			font-size: 1.25rem;
		}

		/* Larger card thumbnails on desktop */
		.card-sidebar-dropdown .card-thumbnail-small {
			width: 120px;
		}

		/* Grid layout on desktop */
		.editor-main {
			display: grid;
			grid-template-columns: clamp(300px, 30cqw, 500px) clamp(300px, 30cqw, 300px) clamp(300px, 30cqw, 300px);
			grid-template-rows: auto auto auto auto auto;
			grid-auto-flow: column;
			min-width: 900px;
			margin-top: 0;
			padding: 1.5rem;
			gap: 1.5rem;
			grid-template-areas:
				'text-fields    preview-front   image-settings'
				'traits-section preview-front   image-settings'
				'traits-section preview-front   image-gallery'
				'description    preview-back    image-gallery'
				'stats-section  preview-back    image-gallery';
		}

		.text-fields {
			grid-area: text-fields;
		}

		.traits-section {
			grid-area: traits-section;
		}

		.description-field {
			grid-area: description;
		}

		.stats-section {
			grid-area: stats-section;
		}

		.preview-front {
			grid-area: preview-front;
			grid-row: span 3;
		}

		.preview-back {
			grid-area: preview-back;
			grid-row: span 2;
		}

		.image-settings {
			grid-area: image-settings;
			grid-row: span 2;
		}

		.image-gallery {
			grid-area: image-gallery;
			grid-row: span 3;
		}

		/* Remove mobile styling on desktop */
		.editor-main > section {
			margin-bottom: 0;
		}

		.field-row {
			flex-direction: row;
			align-items: center;
			gap: 0.75rem;
		}

		.field-row label {
			min-width: 100px;
			text-align: right;
			font-size: 0.875rem;
			font-weight: 500;
			text-transform: none;
			letter-spacing: normal;
			color: var(--ui-text, #1e293b);
		}

		.field-row-tall {
			align-items: flex-start;
		}

		.field-row-tall label {
			padding-top: 0.5rem;
		}
	}
</style>
