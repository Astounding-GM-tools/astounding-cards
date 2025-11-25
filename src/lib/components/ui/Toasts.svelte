<script lang="ts">
	import { toasts, type Toast } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';
	import InfoBox from '$lib/next/components/ui/InfoBox.svelte';
	import { TOAST_ANIMATION } from './Toasts.svelte.ts';
	import { CheckCircle, Info, AlertTriangle, XCircle, Loader2 } from 'lucide-svelte';

	// Map toast types to InfoBox variants
	function getToastVariant(type: Toast['type']): 'success' | 'info' | 'warning' | 'danger' {
		if (type === 'loading') return 'info';
		if (type === 'error') return 'danger';
		return type as 'success' | 'info' | 'warning';
	}

	function handleDismiss(id: string) {
		toasts.remove(id);
	}
</script>

<div class="toast-container" role="status" aria-live="polite">
	{#each $toasts as toast (toast.id)}
		<div class="toast-wrapper" transition:fly={TOAST_ANIMATION}>
			<InfoBox
				variant={getToastVariant(toast.type)}
				dismissible={toast.dismissible !== false}
				onDismiss={() => handleDismiss(toast.id)}
				class="toast-infobox {toast.type === 'loading' ? 'loading' : ''}"
			>
				{#snippet icon()}
					{#if toast.type === 'success'}
						<CheckCircle size={18} />
					{:else if toast.type === 'info'}
						<Info size={18} />
					{:else if toast.type === 'warning'}
						<AlertTriangle size={18} />
					{:else if toast.type === 'error'}
						<XCircle size={18} />
					{:else if toast.type === 'loading'}
						<Loader2 size={18} />
					{/if}
				{/snippet}
				{toast.message}
			</InfoBox>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		z-index: 1000;
		pointer-events: none;
		max-width: 400px;
	}

	.toast-wrapper {
		pointer-events: auto;
		background: white;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transition: all 0.2s ease;
	}

	.toast-wrapper:hover {
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
		transform: translateY(-1px);
	}

	/* Override InfoBox for toasts */
	:global(.toast-infobox) {
		box-shadow: none; /* Remove shadow, wrapper has it */
	}

	/* Loading spinner animation */
	:global(.toast-infobox.loading .info-box-icon svg) {
		animation: toast-spinner-spin 1s linear infinite;
	}

	@keyframes toast-spinner-spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media print {
		.toast-container {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.toast-container {
			left: 1rem;
			right: 1rem;
			max-width: none;
		}
	}
</style>
