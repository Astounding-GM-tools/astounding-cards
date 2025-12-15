<script lang="ts">
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
	import { IS_BETA, FEEDBACK_INTRO_BETA, FEEDBACK_INTRO_STABLE } from '$lib/config/app';
</script>

<MainHeader title="Feedback" />

<div class="feedback-shell">
	<p class="feedback-intro">
		{IS_BETA ? FEEDBACK_INTRO_BETA : FEEDBACK_INTRO_STABLE}
	</p>

	<slot />
</div>

<style>
.feedback-shell {
		padding: 16px;
		max-width: 1100px;
		margin: 0 auto;
	}

	.feedback-intro {
		margin: 0 0 12px;
		max-width: 72ch;
		color: rgba(17, 24, 39, 0.85);
		line-height: 1.5;
	}
</style>
