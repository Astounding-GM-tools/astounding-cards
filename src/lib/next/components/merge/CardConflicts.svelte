<script lang="ts">
	import type { CardConflict } from '$lib/next/utils/deckMerging.js';
	import { CARD_RESOLUTION, CARD_CONFLICT_TYPE } from '$lib/next/utils/mergeConstants.js';
	import { formatTime } from '$lib/next/utils/dateUtils.js';

	interface Props {
		cardConflicts: CardConflict[];
		onUpdate: (cardConflicts: CardConflict[]) => void;
	}

	const { cardConflicts, onUpdate }: Props = $props();

	let expandedCards = $state<Set<string>>(new Set());

	function toggleCardExpanded(cardId: string) {
		const newExpanded = new Set(expandedCards);
		if (newExpanded.has(cardId)) {
			newExpanded.delete(cardId);
		} else {
			newExpanded.add(cardId);
		}
		expandedCards = newExpanded;
	}

	function updateCardConflict(cardIndex: number, resolution: CardConflict['resolution']) {
		const updated = [...cardConflicts];
		updated[cardIndex] = {
			...updated[cardIndex],
			resolution
		};
		onUpdate(updated);
	}

	function updateFieldConflict(cardIndex: number, fieldIndex: number, resolution: any) {
		const updated = [...cardConflicts];
		const card = updated[cardIndex];

		if (card.type === 'modified' && card.fieldConflicts) {
			card.fieldConflicts[fieldIndex] = {
				...card.fieldConflicts[fieldIndex],
				resolution
			};
			onUpdate(updated);
		}
	}

	function getCardDisplayName(conflict: CardConflict): string {
		if (conflict.type === 'modified' && conflict.existingCard) {
			return conflict.existingCard.title || conflict.existingCard.id || 'Unnamed Card';
		} else if (conflict.type === 'added' && conflict.importedCard) {
			return conflict.importedCard.title || conflict.importedCard.id || 'Unnamed Card';
		} else if (conflict.type === 'removed' && conflict.existingCard) {
			return conflict.existingCard.title || conflict.existingCard.id || 'Unnamed Card';
		}
		return 'Unknown Card';
	}

	function getFieldDisplayName(field: string): string {
		const fieldNames: Record<string, string> = {
			name: 'Card Name',
			description: 'Description',
			prompt: 'Prompt',
			tags: 'Tags',
			imageUrl: 'Image URL',
			isPublic: 'Public Sharing',
			lastEdited: 'Last Edited'
		};
		return fieldNames[field] || field.charAt(0).toUpperCase() + field.slice(1);
	}

	function formatFieldValue(field: string, value: any): string {
		if (value === null || value === undefined) return '(empty)';
		if (field === 'lastEdited' && typeof value === 'number') {
			return formatTime(value);
		}
		if (field === 'isPublic' && typeof value === 'boolean') {
			return value ? 'Public' : 'Private';
		}
		if (Array.isArray(value)) {
			// Handle arrays of objects (like stats and traits)
			if (value.length === 0) return '(empty list)';

			// If array contains objects, format them nicely
			if (typeof value[0] === 'object' && value[0] !== null) {
				if (field === 'stats') {
					// Format stats concisely: "Name: Value | Public | Tracked | Description"
					return value
						.map((stat) => {
							const props = [];
							props.push(
								`${stat.title || 'Unknown'}: ${stat.value !== undefined ? stat.value : 'N/A'}`
							);
							if (stat.isPublic) props.push('Public');
							if (stat.tracked) props.push('Tracked');
							if (stat.description) props.push(`Description: ${stat.description}`);
							return props.join(' | ');
						})
						.join('\n');
				} else if (field === 'traits') {
					// Format traits concisely: "Name: Description | Public"
					return value
						.map((trait) => {
							const props = [];
							props.push(`${trait.title || 'Unknown'}: ${trait.description || 'No description'}`);
							if (trait.isPublic) props.push('Public');
							return props.join(' | ');
						})
						.join('\n');
				} else {
					// Generic object array formatting
					return value
						.map((item) => {
							if (typeof item === 'string') return item;
							if (item.name) return item.name;
							if (item.label) return item.label;
							if (item.title) return item.title;
							return JSON.stringify(item);
						})
						.join(', ');
				}
			} else {
				// Simple array (strings, numbers, etc.)
				return value.join(', ');
			}
		}
		if (typeof value === 'object' && value !== null) {
			// Handle single objects
			if (value.name) return value.name;
			if (value.label) return value.label;
			if (value.title) return value.title;
			if (value.description) return value.description;
			return JSON.stringify(value);
		}
		if (typeof value === 'string' && value.length > 100) {
			return value.substring(0, 100) + '...';
		}
		return String(value);
	}

	// Group conflicts by type for better organization
	let conflictsByType = $state({ added: [], modified: [], removed: [] });

	// Update conflictsByType when cardConflicts changes
	$effect(() => {
		if (!cardConflicts || !Array.isArray(cardConflicts)) {
			conflictsByType = { added: [], modified: [], removed: [] };
			return;
		}
		const added = cardConflicts.filter((c) => c.type === CARD_CONFLICT_TYPE.ADDED);
		const modified = cardConflicts.filter((c) => c.type === CARD_CONFLICT_TYPE.MODIFIED);
		const removed = cardConflicts.filter((c) => c.type === CARD_CONFLICT_TYPE.REMOVED);
		conflictsByType = { added, modified, removed };
	});
</script>

<div class="card-conflicts">
	<div class="conflicts-header">
		<h3>🃏 Card Conflicts</h3>
		<p class="conflicts-description">
			Review and resolve conflicts between your cards and the imported cards:
		</p>
	</div>

	<!-- Added Cards -->
	{#if conflictsByType?.added?.length > 0}
		<div class="conflict-section">
			<div class="section-header">
				<h4>➕ New Cards ({conflictsByType?.added?.length || 0})</h4>
				<p>These cards will be added to your deck:</p>
			</div>

			<div class="conflicts-list">
				{#each conflictsByType.added as conflict, cardIndex}
					{@const cardIndexInFull = cardConflicts
						? cardConflicts.findIndex((c) => c === conflict)
						: -1}
					<div
						class="conflict-item added"
						class:resolved={conflict.resolution !== CARD_RESOLUTION.UNRESOLVED}
					>
						<div class="card-summary">
							<div class="card-info">
								<h5>{getCardDisplayName(conflict)}</h5>
								<div class="card-actions">
									<label class="resolution-option">
										<input
											type="radio"
											name="card-{cardIndexInFull}"
											checked={conflict.resolution === CARD_RESOLUTION.ADD}
											onchange={() => updateCardConflict(cardIndexInFull, CARD_RESOLUTION.ADD)}
										/>
										✅ Add this card
									</label>
									<label class="resolution-option">
										<input
											type="radio"
											name="card-{cardIndexInFull}"
											checked={conflict.resolution === CARD_RESOLUTION.SKIP}
											onchange={() => updateCardConflict(cardIndexInFull, CARD_RESOLUTION.SKIP)}
										/>
										❌ Skip this card
									</label>
								</div>
							</div>

							<button class="expand-button" onclick={() => toggleCardExpanded(conflict.cardId)}>
								{expandedCards.has(conflict.cardId) ? '▼' : '▶'} Details
							</button>
						</div>

						{#if expandedCards.has(conflict.cardId) && conflict.importedCard}
							<div class="card-details">
								<div class="card-preview">
									<div class="preview-field">
										<strong>Description:</strong>
										{formatFieldValue('description', conflict.importedCard.description)}
									</div>
									{#if conflict.importedCard.prompt}
										<div class="preview-field">
											<strong>Prompt:</strong>
											{formatFieldValue('prompt', conflict.importedCard.prompt)}
										</div>
									{/if}
									{#if conflict.importedCard.tags?.length > 0}
										<div class="preview-field">
											<strong>Tags:</strong>
											{formatFieldValue('tags', conflict.importedCard.tags)}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Modified Cards -->
	{#if conflictsByType?.modified?.length > 0}
		<div class="conflict-section">
			<div class="section-header">
				<h4>✏️ Modified Cards ({conflictsByType?.modified?.length || 0})</h4>
				<p>These cards exist in both versions but have different content:</p>
			</div>

			<div class="conflicts-list">
				{#each conflictsByType.modified as conflict, cardIndex}
					{@const cardIndexInFull = cardConflicts
						? cardConflicts.findIndex((c) => c === conflict)
						: -1}
					<div
						class="conflict-item modified"
						class:resolved={conflict.resolution !== CARD_RESOLUTION.UNRESOLVED}
					>
						<div class="card-summary">
							<div class="card-info">
								<h5>{getCardDisplayName(conflict)}</h5>
								<div class="card-actions">
									<label class="resolution-option">
										<input
											type="radio"
											name="card-{cardIndexInFull}"
											checked={conflict.resolution === CARD_RESOLUTION.KEEP_EXISTING}
											onchange={() =>
												updateCardConflict(cardIndexInFull, CARD_RESOLUTION.KEEP_EXISTING)}
										/>
										📁 Keep current version
									</label>
									<label class="resolution-option">
										<input
											type="radio"
											name="card-{cardIndexInFull}"
											checked={conflict.resolution === CARD_RESOLUTION.USE_IMPORTED}
											onchange={() =>
												updateCardConflict(cardIndexInFull, CARD_RESOLUTION.USE_IMPORTED)}
										/>
										📥 Use imported version
									</label>
								</div>
							</div>

							<button class="expand-button" onclick={() => toggleCardExpanded(conflict.cardId)}>
								{expandedCards.has(conflict.cardId) ? '▼' : '▶'} Compare Fields
							</button>
						</div>

						{#if expandedCards.has(conflict.cardId) && conflict.fieldConflicts}
							<div class="field-conflicts">
								<h6>Field Differences:</h6>
								{#each conflict.fieldConflicts as fieldConflict, fieldIndex}
									<div class="field-conflict">
										<div class="field-header">
											<h6>{getFieldDisplayName(fieldConflict.field)}</h6>
										</div>

										<div class="field-comparison">
											<div class="field-value existing">
												<div class="value-header">📁 Current</div>
												<div class="value-content">
													{formatFieldValue(fieldConflict.field, fieldConflict.existing)}
												</div>
											</div>

											<div class="field-value imported">
												<div class="value-header">📥 Imported</div>
												<div class="value-content">
													{formatFieldValue(fieldConflict.field, fieldConflict.imported)}
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Removed Cards -->
	{#if conflictsByType?.removed?.length > 0}
		<div class="conflict-section">
			<div class="section-header">
				<h4>🗑️ Removed Cards ({conflictsByType?.removed?.length || 0})</h4>
				<p>These cards exist in your current deck but not in the imported version:</p>
			</div>

			<div class="conflicts-list">
				{#each conflictsByType.removed as conflict, cardIndex}
					{@const cardIndexInFull = cardConflicts
						? cardConflicts.findIndex((c) => c === conflict)
						: -1}
					<div
						class="conflict-item removed"
						class:resolved={conflict.resolution !== CARD_RESOLUTION.UNRESOLVED}
					>
						<div class="card-summary">
							<div class="card-info">
								<h5>{getCardDisplayName(conflict)}</h5>
								<div class="card-actions">
									<label class="resolution-option">
										<input
											type="radio"
											name="card-{cardIndexInFull}"
											checked={conflict.resolution === CARD_RESOLUTION.KEEP_EXISTING}
											onchange={() =>
												updateCardConflict(cardIndexInFull, CARD_RESOLUTION.KEEP_EXISTING)}
										/>
										🛡️ Keep this card
									</label>
									<label class="resolution-option">
										<input
											type="radio"
											name="card-{cardIndexInFull}"
											checked={conflict.resolution === CARD_RESOLUTION.REMOVE}
											onchange={() => updateCardConflict(cardIndexInFull, CARD_RESOLUTION.REMOVE)}
										/>
										🗑️ Remove this card
									</label>
								</div>
							</div>

							<button class="expand-button" onclick={() => toggleCardExpanded(conflict.cardId)}>
								{expandedCards.has(conflict.cardId) ? '▼' : '▶'} Details
							</button>
						</div>

						{#if expandedCards.has(conflict.cardId) && conflict.existingCard}
							<div class="card-details">
								<div class="card-preview">
									<div class="preview-field">
										<strong>Description:</strong>
										{formatFieldValue('description', conflict.existingCard.description)}
									</div>
									{#if conflict.existingCard.prompt}
										<div class="preview-field">
											<strong>Prompt:</strong>
											{formatFieldValue('prompt', conflict.existingCard.prompt)}
										</div>
									{/if}
									{#if conflict.existingCard.tags?.length > 0}
										<div class="preview-field">
											<strong>Tags:</strong>
											{formatFieldValue('tags', conflict.existingCard.tags)}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if !cardConflicts || cardConflicts.length === 0}
		<div class="no-conflicts">
			<span class="icon">✅</span>
			<p>No card conflicts detected. All cards are compatible!</p>
		</div>
	{/if}
</div>

<style>
	.card-conflicts {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.conflicts-header {
		text-align: center;
		margin-bottom: 1rem;
	}

	.conflicts-header h3 {
		margin: 0 0 0.5rem 0;
		color: var(--ui-text, #1a202c);
		font-size: 1.25rem;
	}

	.conflicts-description {
		margin: 0;
		color: var(--ui-muted, #64748b);
		font-size: 0.9rem;
	}

	.conflict-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		padding-bottom: 0.75rem;
		border-bottom: 2px solid var(--ui-border, #e2e8f0);
	}

	.section-header h4 {
		margin: 0 0 0.5rem 0;
		color: var(--ui-text, #1a202c);
		font-size: 1.1rem;
	}

	.section-header p {
		margin: 0;
		color: var(--ui-muted, #64748b);
		font-size: 0.9rem;
	}

	.conflicts-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.conflict-item {
		background: var(--ui-bg, #ffffff);
		border: 2px solid;
		border-radius: 8px;
		padding: 1rem;
		transition: border-color 0.2s ease;
	}

	.conflict-item.added {
		border-color: var(--ui-success-border, #10b981);
	}

	.conflict-item.modified {
		border-color: var(--ui-warning-border, #f59e0b);
	}

	.conflict-item.removed {
		border-color: var(--ui-danger-border, #ef4444);
	}

	.conflict-item.resolved {
		opacity: 0.8;
	}

	.card-summary {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.card-info {
		flex: 1;
	}

	.card-info h5 {
		margin: 0 0 0.75rem 0;
		color: var(--ui-text, #1a202c);
		font-size: 1rem;
		font-weight: 600;
	}

	.card-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.resolution-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--ui-text, #1a202c);
		cursor: pointer;
	}

	.resolution-option input[type='radio'] {
		margin: 0;
		cursor: pointer;
	}

	.expand-button {
		padding: 0.5rem 1rem;
		background: var(--ui-hover-bg, #f8fafc);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 6px;
		cursor: pointer;
		color: var(--ui-text, #1a202c);
		font-size: 0.85rem;
		transition: background-color 0.2s ease;
		white-space: nowrap;
	}

	.expand-button:hover {
		background: var(--ui-border, #e2e8f0);
	}

	.card-details,
	.field-conflicts {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--ui-border, #e2e8f0);
	}

	.card-preview {
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 6px;
		padding: 1rem;
	}

	.preview-field {
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	.preview-field:last-child {
		margin-bottom: 0;
	}

	.preview-field strong {
		color: var(--ui-text, #1a202c);
		display: block;
		margin-bottom: 0.25rem;
	}

	.field-conflicts h6 {
		margin: 0 0 1rem 0;
		color: var(--ui-text, #1a202c);
		font-size: 1rem;
	}

	.field-conflict {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--ui-hover-bg, #f8fafc);
		border-radius: 6px;
		border-left: 3px solid var(--ui-warning-border, #f59e0b);
	}

	.field-conflict:last-child {
		margin-bottom: 0;
	}

	.field-header h6 {
		margin: 0 0 0.75rem 0;
		color: var(--ui-text, #1a202c);
		font-size: 0.95rem;
		font-weight: 600;
	}

	.field-comparison {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.field-value {
		background: var(--ui-bg, #ffffff);
		border-radius: 4px;
		padding: 0.75rem;
		border: 1px solid var(--ui-border, #e2e8f0);
	}

	.field-value.existing {
		border-left: 3px solid var(--ui-info-bg, #3b82f6);
	}

	.field-value.imported {
		border-left: 3px solid var(--ui-success-bg, #10b981);
	}

	.value-header {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ui-muted, #64748b);
		margin-bottom: 0.5rem;
	}

	.value-content {
		font-size: 0.9rem;
		color: var(--ui-text, #1a202c);
		word-break: break-word;
		font-family: var(--ui-mono-font, 'SF Mono', Monaco, 'Cascadia Code', monospace);
		white-space: pre-line; /* Preserves line breaks from \n */
	}

	.no-conflicts {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		background: var(--ui-success-bg, #d1fae5);
		border-radius: 8px;
		text-align: center;
	}

	.no-conflicts .icon {
		font-size: 2rem;
	}

	.no-conflicts p {
		margin: 0;
		color: var(--ui-success-text, #065f46);
		font-size: 1rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.card-summary {
			flex-direction: column;
			align-items: stretch;
		}

		.field-comparison {
			grid-template-columns: 1fr;
		}

		.card-actions {
			flex-direction: row;
			flex-wrap: wrap;
		}

		.expand-button {
			align-self: flex-start;
		}
	}
</style>
