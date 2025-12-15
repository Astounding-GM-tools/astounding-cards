<script lang="ts">
	type Props = {
		href?: string;
		feedbackHref?: string;
	};

	let { href = '/beta', feedbackHref = '/feedback' }: Props = $props();
</script>

<aside class="beta" aria-label="Public beta notice" data-testid="beta-ribbon">
	<div class="beta__inner">
		<a class="beta__tag" href={href}>BETA</a>
		<span class="beta__text">Expect rough edges. Help us improve:</span>
		<a class="beta__link" href={feedbackHref}>Feedback</a>
	</div>
</aside>

<style>
	.beta {
		--beta-bg: var(--brand, #d0021b);
		--beta-fg: #fff;

		width: 100%;
		background: var(--beta-bg);
		color: var(--beta-fg);
		font: 600 13px/1.2 var(--ui-font-family, system-ui);
		letter-spacing: 0.2px;
		z-index: 60;
	}

	.beta__inner {
		display: flex;
		gap: 10px;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
	}

	.beta__tag {
		color: var(--beta-fg);
		text-decoration: none;
		padding: 2px 8px;
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: 999px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		font-size: 11px;
	}

	.beta__text {
		opacity: 0.95;
		font-weight: 600;
	}

	.beta__link {
		color: var(--beta-fg);
		text-decoration: underline;
		text-underline-offset: 2px;
		font-weight: 800;
	}

	/* Small/medium: horizontal ribbon in normal flow */
	@media (max-width: 899px) {
		.beta {
			position: static;
		}
	}

	/* Large: corner ribbon */
	@media (min-width: 900px) {
		.beta {
			position: fixed;
			top: 40px;
			left: -50px;
			width: 220px;
			transform: rotate(-45deg);
			box-shadow: 0 10px 25px rgba(0, 0, 0, 0.22);
			border-radius: 0;
		}

		.beta__inner {
			justify-content: center;
			padding: 10px 10px;
		}

		.beta__text {
			display: none;
		}

		.beta__link {
			text-decoration: none;
			padding: 2px 6px;
			border: 1px solid rgba(255, 255, 255, 0.45);
			border-radius: 999px;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.beta {
			transition: filter 120ms ease;
		}
		.beta:hover {
			filter: brightness(1.03);
		}
	}
</style>
