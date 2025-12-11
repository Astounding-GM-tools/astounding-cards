<script lang="ts">
	import type { Trait } from '$lib/next/types/card.js';
	import BinaryToggle from '$lib/next/components/ui/BinaryToggle.svelte';
	import {
		createDragState,
		createDragHandlers,
		DRAG_CLASSES
	} from '$lib/utils/drag-drop.svelte.js';

	interface Props {
		traits: Trait[];
		onUpdate: (newTraits: Trait[]) => void;
	}

	const { traits, onUpdate }: Props = $props();

	// Drag and drop for traits
	const traitsDrag = createDragState<Trait>();
	const traitsHandlers = createDragHandlers(
		traitsDrag,
		(newTraits) => {
			onUpdate(newTraits);
		},
		() => traits
	);

	function addTrait() {
		onUpdate([...traits, { title: '', isPublic: true, description: '' }]);
	}

	function deleteTrait(index: number) {
		const newTraits = [...traits];
		newTraits.splice(index, 1);
		onUpdate(newTraits);
	}

	function updateTrait(index: number, updates: Partial<Trait>) {
		const newTraits = [...traits];
		newTraits[index] = { ...newTraits[index], ...updates };
		onUpdate(newTraits);
	}
</script>

<fieldset class="form-fieldset" aria-labelledby="traits-legend">
	<legend id="traits-legend">Traits</legend>
	<div role="list" aria-label="Reorderable list of traits">
		{#each traits as trait, index}
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
								updateTrait(index, { isPublic });
							}}
							trueLabel="◉ Front"
							falseLabel="○ Back"
							size="sm"
							name={`trait-public-${index}`}
						/>
						<input
							type="text"
							value={trait.title}
							oninput={(e) => updateTrait(index, { title: e.currentTarget.value })}
							placeholder="Trait title"
							class="title-input"
						/>
						<button class="delete-btn" onclick={() => deleteTrait(index)}> 🗑️ </button>
					</div>

					<div class="description-row">
						<textarea
							value={trait.description}
							oninput={(e) => updateTrait(index, { description: e.currentTarget.value })}
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
			ondrop={(e) => traitsHandlers.handleDrop(e, traits.length)}
		></div>
	</div>

	<button class="add-attribute-btn" onclick={addTrait}> + Add Trait </button>
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

	.trait-compact-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.15rem;
	}

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

	.description-input {
		padding: 0.375rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-family: var(--font-body);
		font-size: 0.85rem;
		resize: vertical;
		min-height: 32px;
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
