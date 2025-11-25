<script lang="ts">
	import { dialogStore } from '$lib/next/components/dialog/dialogStore.svelte';

	type Props = {
		feature: string;
		description: string;
	};

	let { feature, description }: Props = $props();

	function handleSignUp() {
		// TODO: Navigate to sign up flow
		dialogStore.close();
	}

	function handleLogIn() {
		// TODO: Navigate to log in flow
		dialogStore.close();
	}
</script>

<div class="auth-gate-dialog">
	<div class="icon">✨</div>
	<h2>Unlock {feature}</h2>
	<p class="description">{description}</p>

	<div class="benefits">
		<div class="benefit">
			<span class="benefit-icon">🎨</span>
			<span>AI-powered card artwork</span>
		</div>
		<div class="benefit">
			<span class="benefit-icon">📚</span>
			<span>Premium image library</span>
		</div>
		<div class="benefit">
			<span class="benefit-icon">💾</span>
			<span>Cloud sync & sharing</span>
		</div>
	</div>

	<div class="actions">
		<button onclick={handleSignUp} class="btn-primary">Create Free Account</button>
		<button onclick={handleLogIn} class="btn-secondary">Log In</button>
	</div>

	<p class="note">No credit card required • Get 500 free tokens on signup (5 generations)</p>
</div>

<style>
	.auth-gate-dialog {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px;
		max-width: 480px;
		text-align: center;
	}

	.icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	h2 {
		font-size: 24px;
		font-weight: 600;
		margin: 0 0 12px;
	}

	.description {
		font-size: 14px;
		opacity: 0.8;
		margin: 0 0 24px;
		line-height: 1.5;
	}

	.benefits {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
		margin-bottom: 32px;
	}

	.benefit {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		text-align: left;
	}

	.benefit-icon {
		font-size: 20px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
		margin-bottom: 16px;
	}

	.btn-primary,
	.btn-secondary {
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font: inherit;
	}

	.btn-primary {
		background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.note {
		font-size: 12px;
		opacity: 0.6;
		margin: 0;
	}
</style>
