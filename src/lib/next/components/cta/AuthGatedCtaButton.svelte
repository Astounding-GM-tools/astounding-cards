<script lang="ts">
	import { isAuthenticated } from '$lib/next/stores/auth';
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte';
	import AuthGateDialog from '$lib/next/components/dialogs/AuthGateDialog.svelte';
	import type { CtaConfig } from '$lib/config/cta-configs';

	type Props = {
		/** CTA configuration (text, auth gate settings) */
		config: CtaConfig;
		/** Handler called when authenticated user clicks button */
		onAuthenticatedClick: () => void;
		/** Override auth state for Storybook testing */
		isAuthenticatedOverride?: boolean;
	};

	let { config, onAuthenticatedClick, isAuthenticatedOverride }: Props = $props();

	const isAuth = $derived(isAuthenticatedOverride ?? $isAuthenticated);
	const buttonText = $derived(isAuth ? config.authenticated : config.unauthenticated);

	function handleClick() {
		if (!isAuth) {
			// Show auth gate dialog with config from CTA
			dialogStore.setContent(AuthGateDialog, {
				feature: config.unauthenticated.authGate.featureName,
				description: config.unauthenticated.authGate.description
			});
		} else {
			// Execute authenticated action
			onAuthenticatedClick();
		}
	}
</script>

<button onclick={handleClick} class="cta-btn" type="button">
	<span class="btn-icon">✨</span>
	<span class="btn-text">
		<strong>{buttonText.title}</strong>
		<small>{buttonText.subtitle}</small>
	</span>
</button>

<style>
	.cta-btn {
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

	.cta-btn:hover {
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
