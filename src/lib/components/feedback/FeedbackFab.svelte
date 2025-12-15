<script lang="ts">
	import { goto } from '$app/navigation';
	import { CANNY_BOARDS, type CannyBoardKind } from '$lib/config/cannyBoards';

	type Props = {
		pulse?: boolean;
	};

	let { pulse = false }: Props = $props();

	let open = $state(false);

	const kinds: CannyBoardKind[] = ['feedback', 'bug-report', 'feature-request'];

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function navigate(kind: CannyBoardKind, e: MouseEvent) {
		e.preventDefault();
		close();
		goto(CANNY_BOARDS[kind].path);
	}

	$effect(() => {
		if (!open) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};

		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as HTMLElement | null;
			if (!target) return;
			if (target.closest('[data-feedback-fab]')) return;
			close();
		};

		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown, { capture: true });

		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown, { capture: true } as any);
		};
	});
</script>

<div class="fab" data-feedback-fab>
	<button
		type="button"
		class="fab__button"
		class:pulse={pulse}
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={toggle}
	>
		Feedback
	</button>

	{#if open}
		<div class="fab__menu" role="menu" aria-label="Feedback">
			{#each kinds as kind}
				<a class="fab__item" role="menuitem" href={CANNY_BOARDS[kind].path} onclick={(e) => navigate(kind, e)}>
					{CANNY_BOARDS[kind].label}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.fab {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 50;
		display: grid;
		gap: 8px;
		align-items: end;
		justify-items: end;
	}

	.fab__button {
		border: 1px solid rgba(0, 0, 0, 0.15);
		background: var(--brand, var(--alert-danger, #dc2626));
		color: white;
		padding: 10px 12px;
		border-radius: 999px;
		font-weight: 700;
		letter-spacing: 0.2px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.16);
		cursor: pointer;
	}

	.fab__button:hover {
		filter: brightness(1.03);
	}

	.fab__button:active {
		transform: translateY(1px);
	}

	@media (prefers-reduced-motion: no-preference) {
		.fab__button.pulse {
			animation: fabPulse 1.8s ease-in-out infinite;
		}
	}

	@keyframes fabPulse {
		0% {
			transform: translateY(0) scale(1);
			box-shadow: 0 10px 25px rgba(0, 0, 0, 0.16);
		}
		50% {
			transform: translateY(0) scale(1.035);
			box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
		}
		100% {
			transform: translateY(0) scale(1);
			box-shadow: 0 10px 25px rgba(0, 0, 0, 0.16);
		}
	}

	.fab__menu {
		border: 1px solid rgba(0, 0, 0, 0.12);
		background: white;
		border-radius: 12px;
		padding: 8px;
		min-width: 180px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
		display: grid;
		gap: 4px;
	}

	.fab__item {
		display: block;
		padding: 8px 10px;
		border-radius: 10px;
		text-decoration: none;
		color: inherit;
	}
	.fab__item:hover {
		background: rgba(0, 0, 0, 0.05);
	}
</style>
