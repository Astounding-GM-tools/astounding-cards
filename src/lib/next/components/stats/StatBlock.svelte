<script lang="ts">
	import type { Stat } from '$lib/next/types/card';

	let { stats = [] } = $props<{
		stats: Stat[];
	}>();

	const createTrackBoxes = (count: number) => {
		let boxes = '';

		if (count > 12) {
			for (let i = 0; i < count; i++) {
				boxes += (i + 1) % 10 === 0 ? '▢' : '⬚';
			}
		} else {
			for (let i = 0; i < count; i++) {
				boxes += '□';
			}
		}
		return boxes;
	};
</script>

<section class="stat-block">
	{#each stats.filter((stat: Stat) => !stat.isPublic) as stat}
		<div class="stat-item">
			<header class="stat-item-header">
				<span class="stat-item-label-and-value">
					{stat.title}: {stat.value}
				</span>

				{#if stat.tracked && typeof stat.value === 'number'}
					<span class="stat-item-tracker">
						{createTrackBoxes(stat.value)}
					</span>
				{/if}
			</header>

			{#if stat.description}
				<div class="stat-item-description">{stat.description}</div>
			{/if}
		</div>
	{/each}
</section>

<style>
	.stat-block {
		font-size: var(--font-size);
		margin: auto 0.8em 0.6em 0.8em;
		z-index: 10;
	}

	.stat-item {
		margin-bottom: 0.5em;
	}

	.stat-item-header {
		overflow-wrap: break-word;
		word-break: break-word;
	}

	.stat-item-label-and-value {
		margin-right: 0.5em;
	}

	.stat-item-tracker {
		font-size: 0.86em;
		line-height: 0.8;
	}

	.stat-item-description {
		font-size: 0.8em;
		color: var(--color);
	}
</style>
