<script lang="ts">
	import type { Stat } from '$lib/next/types/card.js';
	import BinaryToggle from '$lib/next/components/ui/BinaryToggle.svelte';
	import {
		createDragState,
		createDragHandlers,
		DRAG_CLASSES
	} from '$lib/utils/drag-drop.svelte.js';

	interface Props {
		stats: Stat[];
		onUpdate: (newStats: Stat[]) => void;
	}

	const { stats, onUpdate }: Props = $props();

	// Drag and drop for stats
	const statsDrag = createDragState<Stat>();
	const statsHandlers = createDragHandlers(
		statsDrag,
		(newStats) => {
			onUpdate(newStats);
		},
		() => stats
	);

	function addStat() {
		onUpdate([...stats, { title: '', isPublic: true, value: 0, tracked: false, description: '' }]);
	}

	function deleteStat(index: number) {
		const newStats = [...stats];
		newStats.splice(index, 1);
		onUpdate(newStats);
	}

	function updateStat(index: number, updates: Partial<Stat>) {
		const newStats = [...stats];
		newStats[index] = { ...newStats[index], ...updates };
		onUpdate(newStats);
	}
</script>

<fieldset class="form-fieldset" aria-labelledby="stats-legend">
	<legend id="stats-legend">Stats</legend>
	<div role="list" aria-label="Reorderable list of stats">
		{#each stats as stat, index}
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
								// When switching to public, disable tracking
								if (isPublic) {
									updateStat(index, { isPublic, tracked: false });
								} else {
									updateStat(index, { isPublic });
								}
							}}
							trueLabel="◉ Front"
							falseLabel="○ Back"
							size="sm"
							name={`stat-public-${index}`}
						/>
						<input
							type="text"
							value={stat.title}
							oninput={(e) => updateStat(index, { title: e.currentTarget.value })}
							placeholder="Stat title"
							class="title-input"
						/>
						<input
							type="number"
							value={stat.value}
							oninput={(e: Event) => {
								const num = parseInt((e.target as HTMLInputElement).value) || 0;
								updateStat(index, { value: Math.max(0, Math.min(999, num)) });
							}}
							placeholder="Value"
							class="value-input"
							min="0"
							max="999"
						/>
						<BinaryToggle
							checked={stat.tracked}
							onToggle={(tracked) => {
								updateStat(index, { tracked });
							}}
							trueLabel="■ Track"
							falseLabel="□ Track"
							size="sm"
							name={`stat-track-${index}`}
							disabled={stat.isPublic}
						/>
						<button class="delete-btn" onclick={() => deleteStat(index)}> 🗑️ </button>
					</div>

					{#if !stat.isPublic}
						<div class="description-row">
							<textarea
								value={stat.description}
								oninput={(e) => updateStat(index, { description: e.currentTarget.value })}
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
			ondrop={(e) => statsHandlers.handleDrop(e, stats.length)}
		></div>
	</div>

	<button class="add-attribute-btn" onclick={addStat}> + Add Stat </button>
</fieldset>

<style>
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

	.attribute-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stat-compact-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.15rem;
	}

	.stat-compact-row .title-input {
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
</style>
