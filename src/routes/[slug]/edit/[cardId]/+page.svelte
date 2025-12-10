<script lang="ts">
	import type { Card } from '$lib/next/types/card.js';
	import type { Stat, Trait } from '$lib/next/types/card.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	// Import actual card components
	import CardComponent from '$lib/next/components/card/Card.svelte';
	import CardFrontContent from '$lib/next/components/card/CardFrontContent.svelte';
	import CardBackContent from '$lib/next/components/card/CardBackContent.svelte';
	import CardPresetMinimal from '$lib/next/components/card/CardPresetMinimal.svelte';
	import InlineImageSelector from '$lib/next/components/image/InlineImageSelector.svelte';
	import BinaryToggle from '$lib/next/components/ui/BinaryToggle.svelte';
	import AuthGatedCtaButton from '$lib/next/components/cta/AuthGatedCtaButton.svelte';
	import AiImageGenerationDialog from '$lib/next/components/dialogs/AiImageGenerationDialog.svelte';
	import Dialog from '$lib/next/components/dialog/Dialog.svelte';
	import { IMAGE_GENERATION_CTA } from '$lib/config/cta-configs.js';
	import { toasts } from '$lib/stores/toast.js';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';
	import { authenticatedFetch } from '$lib/utils/authenticated-fetch.js';
	import { getOptimizedImageUrl } from '$lib/utils/image-optimization.js';
	import { isAuthenticated } from '$lib/next/stores/auth.js';

	import { ImageUrlManager } from '$lib/utils/image-handler.js';
	import { safeDeepClone } from '$lib/utils/clone-utils.js';
	import {
		createDragState,
		createDragHandlers,
		DRAG_CLASSES
	} from '$lib/utils/drag-drop.svelte.js';

	import { ArrowLeft, X, Save, Check, AlertCircle, Trash2, Target, Sparkles } from 'lucide-svelte';
	import { getPresetCapabilities } from '$lib/next/utils/presetCapabilities.js';

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
	let formData = $state({
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

	// Use $state for image display info and update via $effect
	let imageDisplayInfo = $state<{
		filename: string;
		source: string;
		timestamp: Date | null;
		status: string;
		message: string | null;
	}>({
		filename: 'No image added',
		source: '',
		timestamp: null,
		status: 'add-image',
		message: 'Add an image to enhance your card! 📸'
	});

	// Update imageDisplayInfo whenever formData or card changes
	$effect(() => {
		// Read reactive values to establish dependencies
		const formUrl = formData.imageUrl;
		const formMeta = formData.imageMetadata;
		const formBlob = formData.imageBlob;
		const cardImageData = card?.image;
		const cardImageBlob = card?.imageBlob;
		const cardMetadata = card?.imageMetadata;

		const hasCardImageData = !!(cardImageBlob || cardImageData);
		const hasFormImageData = !!(formBlob || formUrl);

		const hasImageChanges =
			isFormInitialized &&
			(formBlob !== cardImageBlob ||
				formUrl !== cardImageData ||
				JSON.stringify(formMeta) !== JSON.stringify(cardMetadata));

		if (!hasCardImageData && !hasFormImageData) {
			imageDisplayInfo = {
				filename: 'No image added',
				source: '',
				timestamp: null,
				status: 'add-image',
				message: 'Add an image to enhance your card! 📸'
			};
			return;
		}

		let filename = '';
		let source = '';
		let timestamp = null;
		let status = 'ok'; // Always 'ok' since auto-save is fast (< 1 second)

		const imageMetadata = hasImageChanges ? formMeta : cardMetadata;
		const imageUrl = hasImageChanges ? formUrl : cardImageData;
		const imageBlob = hasImageChanges ? formBlob : cardImageBlob;

		if (imageMetadata?.originalName) {
			filename = imageMetadata.originalName;
			source = imageMetadata.source === 'url' ? 'downloaded' : 'uploaded';
			timestamp = new Date(imageMetadata.addedAt!);
		} else if (imageUrl) {
			const urlFilename = getFilenameFromUrl(imageUrl);
			filename = urlFilename || imageUrl.substring(0, 40) + '...';
			source = `Using: ${imageUrl}`;
			timestamp = null;
		} else if (imageBlob) {
			filename = 'Uploaded file';
			source = 'Using: local file';
			timestamp = null;
		}

		imageDisplayInfo = {
			filename,
			source,
			timestamp,
			status,
			message: null
		};
	});

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

	let isSaving = $state(false);
	let hasChanges = $state(false);
	let saveTimeoutId: number | null = null;

	// Auto-save with debounce
	$effect(() => {
		if (card && isFormInitialized) {
			const imageChanged = formData.imageUrl !== (card.image || null);
			hasChanges =
				formData.title !== card.title ||
				formData.subtitle !== card.subtitle ||
				formData.description !== card.description ||
				JSON.stringify(formData.stats) !== JSON.stringify(card.stats) ||
				JSON.stringify(formData.traits) !== JSON.stringify(card.traits) ||
				formData.imageBlob !== (card.imageBlob || null) ||
				imageChanged ||
				JSON.stringify(formData.imageMetadata) !== JSON.stringify(card.imageMetadata || null);

			// Auto-save after 2 seconds of no changes
			if (hasChanges) {
				if (saveTimeoutId !== null) {
					clearTimeout(saveTimeoutId);
				}
				saveTimeoutId = window.setTimeout(() => {
					saveChanges();
				}, 2000);
			}
		}

		return () => {
			if (saveTimeoutId !== null) {
				clearTimeout(saveTimeoutId);
			}
		};
	});

	async function saveChanges() {
		if (!card || !hasChanges) return;

		isSaving = true;

		const updates = {
			title: formData.title,
			subtitle: formData.subtitle,
			description: formData.description,
			stats: formData.stats,
			traits: formData.traits,
			image: formData.imageUrl,
			imageBlob: formData.imageBlob,
			imageMetadata: formData.imageMetadata
		};

		const success = await nextDeckStore.updateCard(card.id, updates, 'Saving card changes...');

		isSaving = false;

		if (!success) {
			console.error('[Edit] Failed to save changes');
		}
	}

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

	function resetForm() {
		if (card) {
			formData.title = card.title;
			formData.subtitle = card.subtitle;
			formData.description = card.description;
			formData.stats = safeDeepClone(card.stats || []);
			formData.traits = safeDeepClone(card.traits || []);
			formData.imageBlob = card.imageBlob || null;
			formData.imageUrl = card.image || null;
			formData.imageMetadata = card.imageMetadata ? safeDeepClone(card.imageMetadata) : null;

			imageUrlManager.updateBlob(card.imageBlob);
		}
	}

	// Helper functions for image info
	function getImageDisplayInfo() {
		const hasCardImageData = !!(card?.imageBlob || card?.image);
		const hasFormImageData = !!(formData.imageBlob || formData.imageUrl);

		const cardImageBlob = card?.imageBlob || null;
		const cardImageUrl = card?.image || null;
		const cardImageMetadata = card?.imageMetadata || null;

		const hasImageChanges =
			isFormInitialized &&
			(formData.imageBlob !== cardImageBlob ||
				formData.imageUrl !== cardImageUrl ||
				JSON.stringify(formData.imageMetadata) !== JSON.stringify(cardImageMetadata));

		if (!hasCardImageData && !hasFormImageData) {
			return {
				filename: 'No image added',
				source: '',
				timestamp: null,
				status: 'add-image',
				message: 'Add an image to enhance your card! 📸'
			};
		}

		let filename = '';
		let source = '';
		let timestamp = null;
		let status = 'ok'; // Always 'ok' since auto-save is fast (< 1 second)

		const imageMetadata = hasImageChanges ? formData.imageMetadata : card?.imageMetadata;
		const imageUrl = hasImageChanges ? formData.imageUrl : card?.image;
		const imageBlob = hasImageChanges ? formData.imageBlob : card?.imageBlob;

		if (imageMetadata?.originalName) {
			filename = imageMetadata.originalName;
			source = imageMetadata.source === 'url' ? 'downloaded' : 'uploaded';
			timestamp = new Date(imageMetadata.addedAt!);
		} else if (imageUrl) {
			const urlFilename = getFilenameFromUrl(imageUrl);
			filename = urlFilename || imageUrl.substring(0, 40) + '...';
			source = `Using: ${imageUrl}`;
			timestamp = null;
		} else if (imageBlob) {
			filename = 'Uploaded file';
			source = 'Using: local file';
			timestamp = null;
		}

		return {
			filename,
			source,
			timestamp,
			status,
			message: null
		};
	}

	function getFilenameFromUrl(url?: string | null): string | null {
		if (!url) return null;
		try {
			const urlObj = new URL(url);
			const filename = urlObj.pathname.split('/').pop() || '';
			return filename.includes('.') ? filename : null;
		} catch {
			return null;
		}
	}

	// Drag and drop for stats
	const statsDrag = createDragState<Stat>();
	const statsHandlers = createDragHandlers(
		statsDrag,
		(newStats) => {
			formData.stats = [...newStats];
		},
		() => formData.stats
	);

	// Drag and drop for traits
	const traitsDrag = createDragState<Trait>();
	const traitsHandlers = createDragHandlers(
		traitsDrag,
		(newTraits) => {
			formData.traits = [...newTraits];
		},
		() => formData.traits
	);

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

	// Community Images
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

	let communityImages = $state<SearchResult[]>([]);
	let communityImagesLoading = $state(false);
	let communityImagesError = $state<string | null>(null);
	let selectedVariants = $state<Record<string, SelectedVariant>>({});
	let communityImagesPage = $state(1);
	const imagesPerPage = 6;
	let usingCardSpecificEmbedding = $state(false);
	let lastLoadedCardId = $state<string | null>(null);

	// Track semantic content and rate limiting for "Get Better Suggestions" button
	const lastCardEmbeddingTimestamps = new Map<string, number>();
	const lastCardSemanticText = new Map<string, string>();
	const CARD_RATE_LIMIT_MS = 60000; // 1 minute between card-specific embeddings

	// Helper: Extract semantic text from card content
	function extractSemanticText(card: typeof previewCard): string {
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

	// Load community images ONLY when navigating to a different card (not on content changes)
	$effect(() => {
		// Watch cardId (from URL), not card content
		const currentCardId = cardId;

		if (currentCardId && currentCardId !== lastLoadedCardId && card) {
			lastLoadedCardId = currentCardId;
			usingCardSpecificEmbedding = false; // Reset to deck-level on card navigation
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
					deckDescription: currentDeck?.meta?.description,
					preferredStyle: preset,
					limit: 24 // Load more for pagination
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

		// Check rate limit: don't re-embed more than once per minute
		const lastTimestamp = lastCardEmbeddingTimestamps.get(currentCardId) || 0;
		const timeSinceLastEmbed = Date.now() - lastTimestamp;

		if (timeSinceLastEmbed < CARD_RATE_LIMIT_MS) {
			const remainingSeconds = Math.ceil((CARD_RATE_LIMIT_MS - timeSinceLastEmbed) / 1000);
			toasts.info(`⏱️ Please wait ${remainingSeconds}s before requesting new suggestions`);
			return;
		}

		// Check if content has changed significantly since last embedding
		const lastSemanticText = lastCardSemanticText.get(currentCardId) || '';
		if (lastSemanticText && !hasSignificantTextChange(lastSemanticText, currentSemanticText)) {
			console.log('[Edit] Content unchanged - skipping re-embedding');
			toasts.info('💡 Card content unchanged - suggestions are already optimized');
			return;
		}

		usingCardSpecificEmbedding = true;
		communityImagesLoading = true;
		communityImagesError = null;

		try {
			console.log('[Edit] Generating card-specific embedding for better suggestions');

			const response = await authenticatedFetch('/api/ai/search-similar-images', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					card: previewCard,
					// Don't send deck description - force card-specific embedding
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

			// Check if results are identical to current results (avoid unnecessary UI updates)
			if (areResultsIdentical(communityImages, newResults)) {
				console.log('[Edit] Results unchanged - keeping current suggestions');
				toasts.info('✨ Suggestions are already optimal for this card');
				// Update tracking even if results are the same
				lastCardEmbeddingTimestamps.set(currentCardId, Date.now());
				lastCardSemanticText.set(currentCardId, currentSemanticText);
				return;
			}

			// Results are different - update display
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
		console.log('[Edit] Community image selected:', { imageUrl, imageId });
		handleImageChange(null, imageUrl, `community-${imageId}.png`);
	}

	function selectVariant(originalId: string, imageUrl: string, imageId: string, style: string) {
		selectedVariants[originalId] = { imageUrl, imageId, style };
	}

	function isVariantSelected(originalId: string, variantId: string): boolean {
		return selectedVariants[originalId]?.imageId === variantId;
	}

	let paginatedImages = $derived(
		communityImages.slice(
			(communityImagesPage - 1) * imagesPerPage,
			communityImagesPage * imagesPerPage
		)
	);

	let totalPages = $derived(Math.ceil(communityImages.length / imagesPerPage));
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
				{#if isSaving}
					<Save size={16} />
					<span>Saving...</span>
				{:else if hasChanges}
					<AlertCircle size={16} />
					<span>Unsaved changes</span>
				{:else}
					<Check size={16} />
					<span>All saved</span>
				{/if}
			</div>

			<!-- Actions -->
			<button class="header-action-button danger" onclick={deleteCard} disabled={isSaving}>
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
							<fieldset class="form-fieldset" aria-labelledby="traits-legend-top">
								<legend id="traits-legend-top">Traits</legend>
								<div role="list" aria-label="Reorderable list of traits">
									{#each formData.traits as trait, index}
										<div
											class="inline-attribute-editor {DRAG_CLASSES.draggable}"
											draggable="true"
											role="listitem"
											aria-label="Trait: {trait.title || 'Untitled'} - Drag to reorder"
											ondragstart={(e) => traitsHandlers.handleDragStart(e, index)}
											ondragover={(e) => {
												traitsHandlers.handleDragOver(e);
												e.currentTarget.classList.add('drag-over');
											}}
											ondragleave={(e) => {
												e.currentTarget.classList.remove('drag-over');
											}}
											ondrop={(e) => traitsHandlers.handleDrop(e, index)}
											ondragend={traitsHandlers.handleDragEnd}
											data-index={index}
										>
											<div class={DRAG_CLASSES.handle} title="Drag to reorder">⋮⋮</div>

											<div class="attribute-content">
												<div class="trait-compact-row">
													<BinaryToggle
														checked={trait.isPublic}
														onToggle={(isPublic) => {
															trait.isPublic = isPublic;
														}}
														trueLabel="◉ Public"
														falseLabel="○ Secret"
														size="sm"
														name={`trait-public-${index}`}
													/>
													<input
														type="text"
														bind:value={trait.title}
														placeholder="Trait title"
														class="title-input"
													/>
													<button
														class="delete-btn"
														onclick={() => {
															const newTraits = [...formData.traits];
															newTraits.splice(index, 1);
															formData.traits = newTraits;
														}}
													>
														🗑️
													</button>
												</div>

												<div class="description-row">
													<textarea
														bind:value={trait.description}
														placeholder="Description"
														class="description-input trait-description"
														rows="1"
														required
													></textarea>
												</div>
											</div>
										</div>
									{/each}

									<div
										class="drop-zone-end"
										role="region"
										aria-label="Drop zone for traits"
										ondragover={(e) => {
											traitsHandlers.handleDragOver(e);
											e.currentTarget.classList.add('drag-over');
										}}
										ondragleave={(e) => {
											e.currentTarget.classList.remove('drag-over');
										}}
										ondrop={(e) => traitsHandlers.handleDrop(e, formData.traits.length)}
									></div>
								</div>

								<button
									class="add-attribute-btn"
									onclick={() => {
										formData.traits = [
											...formData.traits,
											{ title: '', isPublic: true, description: '' }
										];
									}}
								>
									+ Add Trait
								</button>
							</fieldset>
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
						{#if !card?.image && (currentDeck?.meta?.description || communityImages.length > 0)}
							<fieldset class="form-fieldset community-images-section">
								<div class="community-header">
									<legend>Community Images</legend>
									{#if !usingCardSpecificEmbedding && currentDeck?.meta?.description}
										<button
											class="get-suggestions-btn"
											onclick={getCardSpecificSuggestions}
											type="button"
										>
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
											The community library of AI-generated images is free to use, but requires that
											you are logged in.
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
														class:selected={isVariantSelected(
															result.original_id,
															result.original_id
														)}
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
																	selectVariant(
																		result.original_id,
																		variant.url,
																		variant.id,
																		variant.style
																	)}
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
												onclick={() =>
													(communityImagesPage = Math.min(totalPages, communityImagesPage + 1))}
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
							<fieldset class="form-fieldset" aria-labelledby="stats-legend-bottom">
								<legend id="stats-legend-bottom">Stats</legend>
								<div role="list" aria-label="Reorderable list of stats">
									{#each formData.stats as stat, index}
										<div
											class="inline-attribute-editor {DRAG_CLASSES.draggable}"
											draggable="true"
											role="listitem"
											aria-label="Stat: {stat.title || 'Untitled'} - Drag to reorder"
											ondragstart={(e) => statsHandlers.handleDragStart(e, index)}
											ondragover={(e) => {
												statsHandlers.handleDragOver(e);
												e.currentTarget.classList.add('drag-over');
											}}
											ondragleave={(e) => {
												e.currentTarget.classList.remove('drag-over');
											}}
											ondrop={(e) => statsHandlers.handleDrop(e, index)}
											ondragend={statsHandlers.handleDragEnd}
											data-index={index}
										>
											<div class={DRAG_CLASSES.handle} title="Drag to reorder">⋮⋮</div>

											<div class="attribute-content">
												<div class="stat-compact-row">
													<BinaryToggle
														checked={stat.isPublic}
														onToggle={(isPublic) => {
															stat.isPublic = isPublic;
															if (isPublic) {
																stat.tracked = false;
															}
														}}
														trueLabel="◉ Front"
														falseLabel="○ Back"
														size="sm"
														name={`stat-public-${index}`}
													/>
													<input
														type="text"
														bind:value={stat.title}
														placeholder="Stat title"
														class="title-input"
													/>
													<input
														type="number"
														bind:value={stat.value}
														placeholder="Value"
														class="value-input"
														min="0"
														max="999"
														oninput={(e: Event) => {
															const num = parseInt((e.target as HTMLInputElement).value) || 0;
															stat.value = Math.max(0, Math.min(999, num));
														}}
													/>
													<BinaryToggle
														checked={stat.tracked}
														onToggle={(tracked) => {
															stat.tracked = tracked;
														}}
														trueLabel="■ Track"
														falseLabel="□ Track"
														size="sm"
														name={`stat-track-${index}`}
														disabled={stat.isPublic}
													/>
													<button
														class="delete-btn"
														onclick={() => {
															const newStats = [...formData.stats];
															newStats.splice(index, 1);
															formData.stats = newStats;
														}}
													>
														🗑️
													</button>
												</div>

												{#if !stat.isPublic}
													<div class="description-row">
														<textarea
															bind:value={stat.description}
															placeholder="Description (private stats only)"
															class="description-input stat-description"
															rows="2"
														></textarea>
													</div>
												{/if}
											</div>
										</div>
									{/each}

									<div
										class="drop-zone-end"
										role="region"
										aria-label="Drop zone for stats"
										ondragover={(e) => {
											statsHandlers.handleDragOver(e);
											e.currentTarget.classList.add('drag-over');
										}}
										ondragleave={(e) => {
											e.currentTarget.classList.remove('drag-over');
										}}
										ondrop={(e) => statsHandlers.handleDrop(e, formData.stats.length)}
									></div>
								</div>

								<button
									class="add-attribute-btn"
									onclick={() => {
										formData.stats = [
											...formData.stats,
											{ title: '', isPublic: true, value: 0, tracked: false, description: '' }
										];
									}}
								>
									+ Add Stat
								</button>
							</fieldset>
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

	/* Status colors */
	.header-status:has(svg:first-child[data-lucide='save']) {
		color: #ff6b00;
		background: #fff4ed;
	}

	.header-status:has(svg:first-child[data-lucide='alert-circle']) {
		color: #e67e22;
		background: #fef3e9;
	}

	.header-status:has(svg:first-child[data-lucide='check']) {
		color: #27ae60;
		background: #edf7f0;
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

	/* Left column field layout */
	.section-header {
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	.section-header:first-child {
		margin-top: 0;
	}

	.section-header h3 {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--ui-muted, #64748b);
		margin: 0;
		text-transform: uppercase;
	}

	.section-divider {
		height: 1px;
		background: var(--ui-border, #e2e8f0);
		margin: 1.5rem 0;
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

	.form-fieldset input,
	.form-fieldset textarea {
		width: 100%;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-family: var(--font-body);
		font-size: 0.9rem;
		resize: vertical;
	}

	.form-fieldset input:focus,
	.form-fieldset textarea:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.1);
	}

	/* Field-specific styles */
	.field-title {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.field-subtitle {
		font-size: 0.95rem;
	}

	.field-description {
		font-size: 0.9rem;
		line-height: 1.5;
		min-height: 120px;
	}

	.placeholder-text {
		color: var(--ui-muted, #64748b);
		font-size: 0.875rem;
		text-align: center;
		padding: 2rem 1rem;
		font-style: italic;
	}

	/* All the inline attribute styles from dialog... */
	.inline-attribute-editor {
		border: 1px solid #eee;
		border-radius: 4px;
		padding: 0.375rem;
		background: #fafafa;
		margin-bottom: 0.375rem;
		display: flex;
		gap: 0.375rem;
		align-items: flex-start;
		transition: all 0.2s ease;
		position: relative;
	}

	.inline-attribute-editor:hover {
		border-color: #ddd;
		background: #f5f5f5;
	}

	.inline-attribute-editor.drag-over::before {
		content: '';
		position: absolute;
		top: -2px;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--accent, #4a90e2);
		border-radius: 1.5px;
		z-index: 10;
	}

	.drop-zone-end {
		height: 4px;
		margin: 0.375rem 0;
		background: transparent;
		border-radius: 2px;
		transition: background-color 0.2s ease;
	}

	.drop-zone-end.drag-over {
		background: var(--accent, #4a90e2);
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 100%;
		color: #999;
		cursor: grab;
		font-size: 14px;
		line-height: 1;
		user-select: none;
		flex-shrink: 0;
		padding: 0.25rem 0;
	}

	.drag-handle:hover {
		color: var(--accent, #4a90e2);
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.attribute-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stat-compact-row,
	.trait-compact-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.15rem;
	}

	.stat-compact-row .title-input,
	.trait-compact-row .title-input {
		flex: 1;
		min-width: 120px;
	}

	.description-row {
		width: 100%;
		margin-bottom: 0.15rem;
	}

	.description-row .description-input {
		width: 100%;
	}

	.title-input {
		padding: 0.375rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-family: var(--font-body);
		font-size: 0.85rem;
		min-width: 0;
	}

	.value-input {
		width: 80px;
		padding: 0.375rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-family: var(--font-body);
		font-size: 0.85rem;
		text-align: center;
	}

	.description-input {
		padding: 0.375rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-family: var(--font-body);
		font-size: 0.85rem;
		resize: vertical;
		min-height: 32px;
	}

	.description-input.stat-description {
		height: 2.7em;
		padding: 2px 4px;
		resize: none;
	}

	.delete-btn {
		padding: 0.25rem 0.375rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		background: white;
		cursor: pointer;
		font-size: 0.8rem;
		color: #999;
		flex-shrink: 0;
	}

	.delete-btn:hover {
		background: #fee;
		border-color: #e74c3c;
		color: #e74c3c;
	}

	.add-attribute-btn {
		padding: 0.5rem;
		border: 1px dashed #ccc;
		border-radius: 3px;
		background: white;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.8rem;
		color: #666;
		text-align: center;
	}

	.add-attribute-btn:hover {
		background: #f9f9f9;
		border-color: var(--accent);
		color: var(--accent);
	}

	.ai-image-generation {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	/* Preview cards in center column */
	.preview-cards {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		align-items: center;
		width: 100%;
		padding: 1rem 0;
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

		.editor-content {
			grid-template-columns: 1fr;
		}

		.preview-section {
			display: none;
		}
	}

	@media (max-width: 768px) {
		.edit-layout {
			grid-template-columns: 1fr;
		}

		.card-sidebar {
			display: none;
		}

		.editor-content {
			padding: 1rem;
		}
	}
</style>
