<script lang="ts">
	import { isAuthenticated } from '$lib/next/stores/auth';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte';
	import AuthGateDialog from '$lib/next/components/dialogs/AuthGateDialog.svelte';
	import AiImageGenerationDialog from '$lib/next/components/dialogs/AiImageGenerationDialog.svelte';
	import type { Card } from '$lib/types';
	import type { ImageStyle } from '$lib/config/image-styles';

	type Props = {
		card: Card;
		imageStyle: ImageStyle;
		isAuthenticatedOverride?: boolean; // For Storybook testing
		onImageGenerated?: (imageData: string) => void;
	};

	let { card, imageStyle, isAuthenticatedOverride, onImageGenerated }: Props = $props();

	const isAuth = $derived(isAuthenticatedOverride ?? $isAuthenticated);

	function handleClick() {
		if (!isAuth) {
			// Show auth gate dialog
			dialogStore.setContent(AuthGateDialog, {
				feature: 'AI Image Generation',
				description:
					'Generate stunning card artwork with AI or browse our premium image library. Create a free account to unlock these exclusive features!'
			});
		} else {
			// Show AI generation dialog (future: tabs for Generate/Library)
			dialogStore.setContent(AiImageGenerationDialog, {
				card,
				imageStyle,
				onImageGenerated
			});
		}
	}
</script>

<button onclick={handleClick} class="generate-select-btn" type="button">
	<span class="btn-icon">✨</span>
	<span class="btn-text">
		<strong>Generate or Select Image</strong>
		<small>AI generation & premium library</small>
	</span>
</button>

<style>
	.generate-select-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 20px;
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%);
		border: 2px solid rgba(34, 197, 94, 0.25);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		color: inherit;
		font: inherit;
	}

	.generate-select-btn:hover {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%);
		border-color: rgba(34, 197, 94, 0.5);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
	}

	.btn-icon {
		font-size: 24px;
		line-height: 1;
	}

	.btn-text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		text-align: left;
		flex: 1;
	}

	.btn-text strong {
		font-size: 14px;
		font-weight: 600;
		display: block;
	}

	.btn-text small {
		font-size: 11px;
		opacity: 0.7;
		display: block;
	}
</style>
