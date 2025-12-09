<script lang="ts">
	import type { Card } from '$lib/next/types/card.js';
	import type { Stat, Trait } from '$lib/next/types/card.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	// Import actual card components
	import CardComponent from '$lib/next/components/card/Card.svelte';
	import CardFrontContent from '$lib/next/components/card/CardFrontContent.svelte';
	import CardBackContent from '$lib/next/components/card/CardBackContent.svelte';
	import InlineImageSelector from '$lib/next/components/image/InlineImageSelector.svelte';
	import BinaryToggle from '$lib/next/components/ui/BinaryToggle.svelte';
	import AuthGatedCtaButton from '$lib/next/components/cta/AuthGatedCtaButton.svelte';
	import AiImageGenerationDialog from '$lib/next/components/dialogs/AiImageGenerationDialog.svelte';
	import { IMAGE_GENERATION_CTA } from '$lib/config/cta-configs.js';
	import { toasts } from '$lib/stores/toast.js';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte.js';

	import { ImageUrlManager } from '$lib/utils/image-handler.js';
	import { safeDeepClone } from '$lib/utils/clone-utils.js';
	import {
		createDragState,
		createDragHandlers,
		DRAG_CLASSES
	} from '$lib/utils/drag-drop.svelte.js';

	import { ArrowLeft, X } from 'lucide-svelte';

	// Get params from URL
	let deckId = $derived($page.params.slug);
	let cardId = $derived($page.params.cardId);

	// Get the card and deck from store
	let card = $derived(nextDeckStore.getCard(cardId));
	let currentDeck = $derived(nextDeckStore.deck);

	// Get all cards for sidebar navigation
	let allCards = $derived(currentDeck?.cards || []);
	let currentCardIndex = $derived(allCards.findIndex((c) => c.id === cardId));

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

	// Check for changes
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
		}
	});

	async function saveChanges() {
		if (!card || !hasChanges) return;

		isSaving = true;
		const success = await nextDeckStore.updateCard(
			card.id,
			{
				title: formData.title,
				subtitle: formData.subtitle,
				description: formData.description,
				stats: formData.stats,
				traits: formData.traits,
				image: formData.imageUrl,
				imageBlob: formData.imageBlob,
				imageMetadata: formData.imageMetadata
			},
			'Saving card changes...'
		);

		isSaving = false;
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
		const success = await nextDeckStore.removeCard(cardId);

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
		let status = hasImageChanges ? 'ready-to-save' : 'ok';

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
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Edit {card?.title || 'Card'} - {currentDeck?.meta?.title || 'Deck'} - Astounding Cards</title>
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
							<div class="thumbnail-number">{index + 1}</div>
							<div class="thumbnail-title">{sidebarCard.title || 'Untitled'}</div>
						</button>
					{/each}
				</div>
			</aside>

			<!-- Main Editor Area -->
			<main class="editor-main">
				<div class="editor-content">
					<!-- Edit Form Section (same as dialog) -->
					<section class="edit-section">
						<fieldset class="form-fieldset">
							<legend>Basic Info</legend>
							<input type="text" bind:value={formData.title} placeholder="Card title" maxlength="100" />
							<input
								type="text"
								bind:value={formData.subtitle}
								placeholder="Subtitle (e.g., Character, Item)"
								maxlength="50"
							/>
							<textarea
								bind:value={formData.description}
								placeholder="Description"
								rows="2"
								maxlength="500"
							></textarea>
						</fieldset>

						<!-- Image Section -->
						<fieldset class="form-fieldset">
							<legend>Image</legend>
							<InlineImageSelector
								cardSize="tarot"
								card={previewCard}
								currentStyle={currentDeck?.meta.imageStyle}
								hasExistingImage={hasImage}
								existingImageInfo={(() => {
									const info = getImageDisplayInfo();
									return {
										filename: info.filename,
										source: info.source,
										timestamp: info.timestamp,
										status: info.status,
										message: info.message
									};
								})()}
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

						<!-- Stats Section (same as dialog) -->
						<fieldset class="form-fieldset" aria-labelledby="stats-legend">
							<legend id="stats-legend">Stats</legend>
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

						<!-- Traits Section (same as dialog) -->
						<fieldset class="form-fieldset" aria-labelledby="traits-legend">
							<legend id="traits-legend">Traits</legend>
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
					</section>

					<!-- Live Preview Section -->
					<section class="preview-section">
						{#if previewCard}
							<div class="preview-cards">
								<div class="card-preview">
									<CardComponent preview>
										<CardFrontContent card={previewCard} />
									</CardComponent>
								</div>

								<div class="card-preview">
									<CardComponent preview>
										<CardBackContent card={previewCard} />
									</CardComponent>
								</div>
							</div>
						{/if}
					</section>
				</div>

				<!-- Footer Actions -->
				<footer class="editor-footer">
					<div class="footer-status">
						{#if isSaving}
							<span class="saving">💾 Saving...</span>
						{:else if hasChanges}
							<span class="changes">✏️ Unsaved changes</span>
						{:else}
							<span class="saved">✅ All changes saved</span>
						{/if}
					</div>

					<div class="footer-actions">
						<button class="danger" onclick={deleteCard} disabled={isSaving}>
							Delete Card
						</button>
						<div class="spacer"></div>
						<button onclick={resetForm} disabled={!hasChanges || isSaving}>
							Reset
						</button>
						<button class="primary" onclick={saveChanges} disabled={!hasChanges || isSaving}>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</footer>
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
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		border: 2px solid var(--ui-border, #e2e8f0);
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
		font-family: var(--font-body);
	}

	.card-thumbnail:hover {
		background: var(--ui-bg-secondary, #f8fafc);
		border-color: var(--ui-text, #1e293b);
	}

	.card-thumbnail.active {
		border-color: var(--primary, #3b82f6);
		background: var(--primary-light, #eff6ff);
		box-shadow: 0 0 0 1px var(--primary, #3b82f6);
	}

	.thumbnail-number {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--ui-muted, #64748b);
	}

	.thumbnail-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--ui-text, #1e293b);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-thumbnail.active .thumbnail-title {
		color: var(--primary, #3b82f6);
	}

	/* Main Editor */
	.editor-main {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.editor-content {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
		flex: 1;
		overflow: hidden;
		padding: 1.5rem;
	}

	.edit-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.5rem;
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

	/* Preview Section */
	.preview-section {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.preview-cards {
		display: flex;
		flex-direction: row;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.card-preview {
		flex: 1;
		min-width: 0;
	}

	.card-preview :global(.card) {
		width: 100%;
		max-width: 240px;
		margin: 0 auto;
		border: 1px solid #ddd;
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Footer */
	.editor-footer {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
		background: white;
		z-index: 10;
	}

	.footer-status {
		font-size: 0.875rem;
	}

	.saving {
		color: #ff6b00;
	}

	.changes {
		color: #e67e22;
	}

	.saved {
		color: #27ae60;
	}

	.footer-actions {
		display: flex;
		gap: 0.5rem;
	}

	.footer-actions button {
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

	.footer-actions button:hover:not(:disabled) {
		background: var(--ui-bg-secondary, #f8fafc);
	}

	.footer-actions button.primary {
		background: var(--primary, #3b82f6);
		color: white;
		border-color: var(--primary, #3b82f6);
	}

	.footer-actions button.primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.footer-actions button.danger {
		background: #dc2626;
		color: white;
		border-color: #dc2626;
	}

	.footer-actions button.danger:hover:not(:disabled) {
		background: #b91c1c;
	}

	.footer-actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
