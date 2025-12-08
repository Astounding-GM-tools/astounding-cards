<script lang="ts">
	import { dialogStore } from '../dialog/dialogStore.svelte.js';
	import { toasts } from '$lib/stores/toast.js';
	import { authenticatedFetch } from '$lib/utils/authenticated-fetch.js';
	import type { Deck } from '../../types/deck.js';

	interface Props {
		deck: Deck;
		publishedDeckId?: string; // If already published
		onPublished?: () => void;
	}

	let { deck, publishedDeckId, onPublished }: Props = $props();

	// Form state
	let title = $state(deck.meta.title || '');
	let description = $state(deck.meta.description || '');
	let tags = $state<string[]>([]);
	let tagInput = $state('');
	let visibility = $state<'public' | 'unlisted'>('public');
	let isPublishing = $state(false);

	const isUpdate = !!publishedDeckId;
	const cardCount = deck.cards.length;

	function addTag() {
		const tag = tagInput.trim().toLowerCase();
		if (tag && !tags.includes(tag)) {
			tags = [...tags, tag];
			tagInput = '';
		}
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	async function handlePublish() {
		// Validation
		if (!title.trim()) {
			toasts.error('Title is required');
			return;
		}

		if (cardCount === 0) {
			toasts.error('Deck must have at least one card');
			return;
		}

		isPublishing = true;

		try {
			const response = await authenticatedFetch('/api/decks/publish', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders()
				},
				body: JSON.stringify({
					deckId: publishedDeckId,
					title: title.trim(),
					description: description.trim() || undefined,
					tags,
					visibility,
					cards: deck.cards,
					theme: deck.meta.theme
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to publish deck');
			}

			const result = await response.json();

			toasts.success(
				isUpdate
					? `✅ Deck updated successfully!`
					: `✅ Deck published successfully! View it in the gallery.`
			);

			onPublished?.();
			dialogStore.close();
		} catch (error) {
			console.error('Publish error:', error);
			toasts.error(error instanceof Error ? error.message : 'Failed to publish deck');
		} finally {
			isPublishing = false;
		}
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		}
	}
</script>

<div class="publish-deck-dialog">
	<div class="header">
		<h2>{isUpdate ? '📝 Update Published Deck' : '🌍 Publish Deck to Gallery'}</h2>
		<button class="close-button" onclick={() => dialogStore.close()}>×</button>
	</div>

	<div class="content">
		<!-- Deck Preview -->
		<div class="deck-preview">
			<div class="preview-label">Your Deck</div>
			<div class="preview-stats">
				<span><strong>{deck.meta.title || 'Untitled Deck'}</strong></span>
				<span>•</span>
				<span>{cardCount} {cardCount === 1 ? 'card' : 'cards'}</span>
				<span>•</span>
				<span class="theme-badge">{deck.meta.theme}</span>
			</div>
		</div>

		<!-- Form Fields -->
		<div class="form-group">
			<label for="title">
				Title <span class="required">*</span>
			</label>
			<input
				id="title"
				type="text"
				bind:value={title}
				placeholder="Enter a catchy title..."
				maxlength="100"
				disabled={isPublishing}
			/>
		</div>

		<div class="form-group">
			<label for="description">Description</label>
			<textarea
				id="description"
				bind:value={description}
				placeholder="Describe your deck... What makes it special?"
				rows="4"
				maxlength="500"
				disabled={isPublishing}
			></textarea>
			<p class="help-text">{description.length}/500 characters</p>
		</div>

		<div class="form-group">
			<label for="tags">Tags</label>
			<div class="tags-input-wrapper">
				<input
					id="tags"
					type="text"
					bind:value={tagInput}
					onkeydown={handleTagKeydown}
					placeholder="Add tags (press Enter)..."
					disabled={isPublishing}
				/>
				<button class="add-tag-button" onclick={addTag} disabled={!tagInput.trim() || isPublishing}>
					Add
				</button>
			</div>
			{#if tags.length > 0}
				<div class="tags-list">
					{#each tags as tag}
						<span class="tag">
							{tag}
							<button class="remove-tag" onclick={() => removeTag(tag)} disabled={isPublishing}>
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}
			<p class="help-text">Help users discover your deck (e.g., "fantasy", "combat", "villains")</p>
		</div>

		<fieldset class="form-group">
			<legend>Visibility</legend>
			<div class="visibility-options">
				<label class="radio-option">
					<input
						type="radio"
						name="visibility"
						value="public"
						bind:group={visibility}
						disabled={isPublishing}
					/>
					<div class="radio-content">
						<strong>🌍 Public</strong>
						<p>Anyone can find and import your deck</p>
					</div>
				</label>
				<label class="radio-option">
					<input
						type="radio"
						name="visibility"
						value="unlisted"
						bind:group={visibility}
						disabled={isPublishing}
					/>
					<div class="radio-content">
						<strong>🔗 Unlisted</strong>
						<p>Only people with the link can access</p>
					</div>
				</label>
			</div>
		</fieldset>
	</div>

	<div class="footer">
		<button class="secondary-button" onclick={() => dialogStore.close()} disabled={isPublishing}>
			Cancel
		</button>
		<button class="primary-button" onclick={handlePublish} disabled={isPublishing}>
			{#if isPublishing}
				{isUpdate ? 'Updating...' : 'Publishing...'}
			{:else}
				{isUpdate ? '✅ Update Deck' : '🚀 Publish Deck'}
			{/if}
		</button>
	</div>
</div>

<style>
	.publish-deck-dialog {
		display: flex;
		flex-direction: column;
		width: 500px;
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
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.deck-preview {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 16px;
	}

	.preview-label {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.6;
		margin-bottom: 8px;
	}

	.preview-stats {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.theme-badge {
		background: rgba(255, 255, 255, 0.1);
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 13px;
		text-transform: capitalize;
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

	.required {
		color: #ff6b6b;
	}

	input[type='text'],
	textarea {
		padding: 10px 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.05);
		font-size: 14px;
		font-family: inherit;
		color: inherit;
		transition: border-color 0.2s;
	}

	input[type='text']:focus,
	textarea:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.4);
	}

	input[type='text']:disabled,
	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.help-text {
		font-size: 12px;
		opacity: 0.7;
		margin: 0;
	}

	.tags-input-wrapper {
		display: flex;
		gap: 8px;
	}

	.tags-input-wrapper input {
		flex: 1;
	}

	.add-tag-button {
		padding: 10px 16px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 14px;
	}

	.add-tag-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.add-tag-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(100, 200, 255, 0.2);
		color: #64c8ff;
		padding: 4px 10px;
		border-radius: 16px;
		font-size: 13px;
	}

	.remove-tag {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 16px;
		padding: 0;
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.remove-tag:hover:not(:disabled) {
		opacity: 1;
	}

	.visibility-options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.radio-option {
		display: flex;
		gap: 12px;
		padding: 12px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.radio-option:hover {
		border-color: rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.05);
	}

	.radio-option input[type='radio'] {
		margin-top: 2px;
		cursor: pointer;
	}

	.radio-option input[type='radio']:checked {
		accent-color: #64c8ff;
	}

	.radio-content {
		flex: 1;
	}

	.radio-content strong {
		display: block;
		margin-bottom: 4px;
	}

	.radio-content p {
		margin: 0;
		font-size: 13px;
		opacity: 0.7;
	}

	.footer {
		display: flex;
		gap: 12px;
		padding: 16px 24px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.secondary-button,
	.primary-button {
		flex: 1;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.secondary-button {
		background: rgba(255, 255, 255, 0.1);
		color: inherit;
	}

	.secondary-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.primary-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.primary-button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.primary-button:disabled,
	.secondary-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
</style>
