<script lang="ts">
	import { CANNY_BOARDS, type CannyBoardKind } from '$lib/config/cannyBoards';

	const kinds: CannyBoardKind[] = ['feedback', 'bug-report', 'feature-request'];
</script>

<svelte:head>
	<title>Feedback</title>
</svelte:head>

<div style="padding: 16px; max-width: 720px; margin: 0 auto;">
	<h1>Feedback</h1>
	<p>Pick where you want to leave feedback.</p>

	<ul>
		{#each kinds as kind}
			<li>
				<a href={CANNY_BOARDS[kind].path}>{CANNY_BOARDS[kind].label}</a>
			</li>
		{/each}
	</ul>
</div>
