<!--
    Card Edit Dialog - The Revolutionary Editing Experience!
    
    This replaces all contentEditable interactions with a clean,
    focused editing interface that updates cards via the Canon Update Pattern.
    
    Features:
    - Live preview of changes
    - Organized sections for different card properties
    - Save/Cancel workflow
    - No more contentEditable complexity!
-->
<script lang="ts">
	import type { Card } from '$lib/next/types/card.js';
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { dialogStore } from '../dialog/dialogStore.svelte.js';

	// Import actual card components
	import CardComponent from '../card/Card.svelte';
	import CardFrontContent from '../card/CardFrontContent.svelte';
	import CardBackContent from '../card/CardBackContent.svelte';
	import InlineImageSelector from '../image/InlineImageSelector.svelte';
	import BinaryToggle from '../ui/BinaryToggle.svelte';
	import AuthGatedCtaButton from '../cta/AuthGatedCtaButton.svelte';
	import AiImageGenerationDialog from './AiImageGenerationDialog.svelte';
	import { IMAGE_GENERATION_CTA } from '$lib/config/cta-configs.js';
	import { toasts } from '$lib/stores/toast.js';

	import type { Trait, Stat } from '$lib/next/types/card.js';
	import { ImageUrlManager } from '$lib/utils/image-handler.js';
	import { safeDeepClone } from '$lib/utils/clone-utils.js';
	import {
		createDragState,
		createDragHandlers,
		DRAG_CLASSES
	} from '$lib/utils/drag-drop.svelte.js';

	// Props passed when dialog opens
	const { cardId }: { cardId: string } = $props();

	// Get the card from store
	let card = $derived(nextDeckStore.getCard(cardId));

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

	// Check if card has image for dialog display
	let hasImage = $derived(!!(formData.imageBlob || formData.imageUrl));

	// Create preview card with live form data
	let previewCard = $derived(
		card
			? {
					...card,
					title: formData.title,
					subtitle: formData.subtitle,
					description: formData.description,
					stats: formData.stats,
					traits: formData.traits,
					imageBlob: formData.imageBlob,
					image: formData.imageUrl
				}
			: null
	);

	// Update form when card changes
	$effect(() => {
		if (card) {
			formData.title = card.title;
			formData.subtitle = card.subtitle;
			formData.description = card.description;
			// Create deep copies to isolate form state from deck state
			formData.stats = safeDeepClone(card.stats || []);
			formData.traits = safeDeepClone(card.traits || []);
			formData.imageBlob = card.imageBlob || null; // Blob is immutable, safe to share reference
			formData.imageUrl = card.image || null;
			formData.imageMetadata = card.imageMetadata ? safeDeepClone(card.imageMetadata) : null;

			// Update image manager
			imageUrlManager.updateBlob(card.imageBlob);

			// Mark form as initialized after a microtask to ensure all updates are applied
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

		// Update metadata when new image is added
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

		// Update image manager
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
			hasChanges =
				formData.title !== card.title ||
				formData.subtitle !== card.subtitle ||
				formData.description !== card.description ||
				JSON.stringify(formData.stats) !== JSON.stringify(card.stats) ||
				JSON.stringify(formData.traits) !== JSON.stringify(card.traits) ||
				formData.imageBlob !== (card.imageBlob || null) ||
				formData.imageUrl !== (card.image || null) ||
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

		if (success) {
			dialogStore.close();
		}
		isSaving = false;
	}

	function cancelChanges() {
		dialogStore.close();
	}

	async function deleteCard() {
		if (!card) return;

		const cardTitle = card.title; // Save title before deletion
		const cardId = card.id; // Save ID before closing dialog

		const confirmed = confirm(
			`Delete card "${cardTitle}"?\n\nThis action cannot be undone.`
		);

		if (!confirmed) return;

		// Close dialog FIRST to prevent "card not found" error
		dialogStore.close();

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
			// Reset with deep copies to maintain isolation
			formData.stats = safeDeepClone(card.stats || []);
			formData.traits = safeDeepClone(card.traits || []);
			formData.imageBlob = card.imageBlob || null; // Blob is immutable, safe to share reference
			formData.imageUrl = card.image || null;
			formData.imageMetadata = card.imageMetadata ? safeDeepClone(card.imageMetadata) : null;

			// Update image manager
			imageUrlManager.updateBlob(card.imageBlob);
		}
	}

	// Helper functions for image info
	function getImageDisplayInfo() {
		// Check both saved card data and current form changes
		const hasCardImageData = !!(card?.imageBlob || card?.image);
		const hasFormImageData = !!(formData.imageBlob || formData.imageUrl);

		// More robust change detection - handle null vs undefined properly
		const cardImageBlob = card?.imageBlob || null;
		const cardImageUrl = card?.image || null;
		const cardImageMetadata = card?.imageMetadata || null;

		// Don't show changes until form is fully initialized
		const hasImageChanges =
			isFormInitialized &&
			(formData.imageBlob !== cardImageBlob ||
				formData.imageUrl !== cardImageUrl ||
				JSON.stringify(formData.imageMetadata) !== JSON.stringify(cardImageMetadata));

		// No image case
		if (!hasCardImageData && !hasFormImageData) {
			return {
				filename: 'No image added',
				source: '',
				timestamp: null,
				status: 'add-image',
				message: 'Add an image to enhance your card! 📸'
			};
		}

		// Has image - determine status based on whether changes are saved
		let filename = '';
		let source = '';
		let timestamp = null;
		let status = hasImageChanges ? 'ready-to-save' : 'ok';

		// Use form data if we have changes, otherwise use card data
		const imageMetadata = hasImageChanges ? formData.imageMetadata : card?.imageMetadata;
		const imageUrl = hasImageChanges ? formData.imageUrl : card?.image;
		const imageBlob = hasImageChanges ? formData.imageBlob : card?.imageBlob;

		// Use metadata if available (new images with proper metadata)
		if (imageMetadata?.originalName) {
			filename = imageMetadata.originalName;
			source = imageMetadata.source === 'url' ? 'downloaded' : 'uploaded';
			timestamp = new Date(imageMetadata.addedAt!);
		}
		// URL reference available (downloaded images)
		else if (imageUrl) {
			const urlFilename = getFilenameFromUrl(imageUrl);
			filename = urlFilename || imageUrl.substring(0, 40) + '...';
			source = `Using: ${imageUrl}`;
			timestamp = null;
		}
		// Local blob only (uploaded images without metadata)
		else if (imageBlob) {
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
			// Force Svelte to recognize this as a new array reference
			formData.stats = [...newStats];
		},
		() => formData.stats
	);

	// Drag and drop for traits
	const traitsDrag = createDragState<Trait>();
	const traitsHandlers = createDragHandlers(
		traitsDrag,
		(newTraits) => {
			// Force Svelte to recognize this as a new array reference
			formData.traits = [...newTraits];
		},
		() => formData.traits
	);

	// Open AI Image Generation Dialog
	function openImageGenerationDialog() {
		if (!card) return;

		// Get the deck's image style
		const deckImageStyle = nextDeckStore.deck?.meta?.imageStyle || 'classic';

		// Create a card with current form data for generation
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
</script>

{#if card}
	<div class="card-edit-dialog">
		<div class="dialog-content">
			<!-- Edit Form Section -->
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

				<!-- Stats Section -->
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
								<!-- Drag handle -->
								<div class={DRAG_CLASSES.handle} title="Drag to reorder">⋮⋮</div>

								<div class="attribute-content">
									<!-- Single compact row: Public + Title + Value + Tracked + Delete -->
									<div class="stat-compact-row">
										<BinaryToggle
											checked={stat.isPublic}
											onToggle={(isPublic) => {
												stat.isPublic = isPublic;
												// If making public, disable tracking (public stats aren't tracked)
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

									<!-- Description row (only for private stats) -->
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

						<!-- Drop zone for end of list -->
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

				<!-- Traits Section -->
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
								<!-- Drag handle -->
								<div class={DRAG_CLASSES.handle} title="Drag to reorder">⋮⋮</div>

								<div class="attribute-content">
									<!-- Line 1: Public checkbox + title + delete button -->
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

									<!-- Line 2: Full-width description -->
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

						<!-- Drop zone for end of list -->
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
						<!-- Front Card Preview -->
						<div class="card-preview">
							<CardComponent preview>
								<CardFrontContent card={previewCard} />
							</CardComponent>
						</div>

						<!-- Back Card Preview -->
						<div class="card-preview">
							<CardComponent preview>
								<CardBackContent card={previewCard} />
							</CardComponent>
						</div>
					</div>
				{/if}
			</section>
		</div>

		<footer class="dialog-footer">
			<div class="dialog-status">
				{#if isSaving}
					<span class="saving">💾 Saving...</span>
				{:else if hasChanges}
					<span class="changes">✏️ Unsaved changes</span>
				{:else}
					<span class="saved">✅ All changes saved</span>
				{/if}
			</div>

			<div class="dialog-actions">
				<button class="danger" onclick={deleteCard} disabled={isSaving}> Delete Card </button>
				<div class="spacer"></div>
				<button onclick={resetForm} disabled={!hasChanges || isSaving}> Reset </button>
				<button onclick={cancelChanges} disabled={isSaving}> Cancel </button>
				<button class="primary" onclick={saveChanges} disabled={!hasChanges || isSaving}>
					{isSaving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</footer>
	</div>
{:else}
	<div class="card-edit-dialog">
		<div class="error">
			<h2>Card Not Found</h2>
			<p>The card you're trying to edit could not be found.</p>
			<button onclick={cancelChanges}>Close</button>
		</div>
	</div>
{/if}

<style>
	.card-edit-dialog {
		display: flex;
		flex-direction: column;
		height: 90vh;
		width: 100%;
		max-width: 1000px;
		font-family: var(--font-body);
	}

	.dialog-content {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
		flex: 1;
		overflow: hidden;
		padding: 0.75rem;
	}

	.edit-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	/* Fieldset Form Styles */
	.form-fieldset {
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 0.75rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	/* AI Image Generation Styles */
	.ai-image-generation {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.api-key-input-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 4px;
	}

	.api-key-input {
		padding: 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 3px;
		font-family: var(--font-body);
		font-size: 0.85rem;
	}

	.api-key-input:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1);
	}

	.api-key-actions {
		display: flex;
		justify-content: flex-end;
	}

	.cancel-btn {
		padding: 0.25rem 0.5rem;
		border: 1px solid #6c757d;
		border-radius: 3px;
		background: white;
		color: #6c757d;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.cancel-btn:hover {
		background: #f8f9fa;
	}

	.ai-image-generate-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid #22c55e;
		border-radius: 3px;
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.8rem;
		color: #059669;
		text-align: center;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	.ai-image-generate-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
		border-color: #16a34a;
		color: #047857;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
	}

	.ai-image-generate-btn:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.ai-image-generate-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.ai-image-generate-btn.generating {
		background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
		border-color: #ffc107;
		color: #ff8f00;
	}

	/* Inline Attribute Editor Styles */
	.inline-attribute-editor {
		border: 1px solid #eee;
		border-radius: 4px;
		padding: 0.375rem; /* Reduced from 0.5rem for more compact stats */
		background: #fafafa;
		margin-bottom: 0.375rem; /* Reduced from 0.5rem */
		display: flex;
		gap: 0.375rem; /* Reduced from 0.5rem */
		align-items: flex-start;
		transition: all 0.2s ease;
		position: relative;
	}

	.inline-attribute-editor:hover {
		border-color: #ddd;
		background: #f5f5f5;
	}

	/* Drop indicator */
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

	/* Drop zone at end of list - minimal line */
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

	/* Drag and drop styles */
	.draggable-item {
		cursor: grab;
	}

	.draggable-item:active {
		cursor: grabbing;
	}

	.draggable-item.dragging {
		opacity: 0.6;
		transform: rotate(2deg);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
		gap: 0.15rem; /* Even more compact for tight stats/traits */
	}

	.attribute-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.15rem; /* Even more compact */
	}

	.attribute-row:last-child {
		margin-bottom: 0;
	}

	/* Compact single-row layout for stats */
	.stat-compact-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.15rem;
	}

	.stat-compact-row .title-input {
		flex: 1; /* Take up remaining space */
		min-width: 120px; /* Minimum readable width */
	}

	/* Compact single-row layout for traits */
	.trait-compact-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.15rem;
	}

	.trait-compact-row .title-input {
		flex: 1; /* Take up remaining space */
		min-width: 120px; /* Minimum readable width */
	}

	/* Full-width description row */
	.description-row {
		width: 100%;
		margin-bottom: 0.15rem;
	}

	.description-row .description-input {
		width: 100%; /* Full width */
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

	/* Specific styling for stat descriptions - fixed height and tighter padding */
	.description-input.stat-description {
		height: 2.7em;
		padding: 2px 4px;
		resize: none; /* Disable resize for fixed-height stat descriptions */
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8rem;
		color: #666;
		cursor: pointer;
		white-space: nowrap;
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

	.title-input:focus,
	.value-input:focus,
	.description-input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.1);
	}

	/* Preview Section - Simplified and Clean */
	.preview-section {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
		min-height: fit-content;
		padding-bottom: 1rem;

		container-type: inline-size;
		container-name: preview-section;
	}

	.preview-cards {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		padding: 0.5rem 1rem; /* Add side margins */
	}

	@container preview-section (width < 400px) {
		.preview-cards {
			flex-direction: column;
			align-items: center;
		}
	}

	.card-preview {
		position: relative;
		width: 100%;
		/* Let the card component handle its own aspect ratio */
	}

	/* Remove all the complex transforms and scaling - let cards be natural size but smaller */
	.card-preview :global(.card) {
		width: 100%;
		max-width: 220px; /* Reduced from 280px */
		margin: 0 auto;
		border: 1px solid #ddd;
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Footer Styles - More Compact */
	.dialog-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		border-top: 1px solid #eee;
		background: white;
		flex-shrink: 0;
		position: sticky;
		bottom: 0;
		z-index: 10;
	}

	.dialog-status {
		font-size: 0.8rem;
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

	.dialog-actions {
		display: flex;
		gap: 0.375rem;
	}

	.dialog-actions button {
		padding: 0.375rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		background: white;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.85rem;
	}

	.dialog-actions button:hover:not(:disabled) {
		background: #f5f5f5;
	}

	.dialog-actions button.primary {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	.dialog-actions button.primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.dialog-actions button.danger {
		background: #dc2626;
		color: white;
		border-color: #dc2626;
	}

	.dialog-actions button.danger:hover:not(:disabled) {
		background: #b91c1c;
	}

	.dialog-actions .spacer {
		flex: 1;
	}

	.dialog-actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Error State */
	.error {
		text-align: center;
		padding: 2rem;
	}

	.error h2 {
		color: #e74c3c;
		margin-bottom: 1rem;
	}

	.error button {
		background: var(--accent);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.card-content-front {
		display: flex;
		flex-direction: column;
		margin: auto 0.2em 0.2em 0.2em;
		background: white;
		border-radius: 0.2em;
		box-shadow: 0 0 0.6em 0 rgba(0, 0, 0, 0.1);
		z-index: 10;
	} /* Unused image and modal styles removed for clean build */

	/* Responsive */
	@media (max-width: 768px) {
		.dialog-content {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.card-edit-dialog {
			height: 95vh;
		}

		.preview-section {
			order: -1; /* Show preview first on mobile */
		}

		.preview-wrapper {
			height: 200px;
		}
	}
</style>
