<script lang="ts">
	import MainHeader from '$lib/next/components/nav/MainHeader.svelte';
</script>

<svelte:head>
	<title>Public Beta - Astounding Cards</title>
	<meta name="description" content="Astounding Cards is in public beta. Learn what to expect and where to leave feedback." />
</svelte:head>

<MainHeader title="Public Beta" />

<div class="legal-page">
	<div class="content">
		<h1>Public Beta</h1>
		<p class="lede">
			Astounding Cards is currently in public beta. That means things may be janky: bugs, missing
			features, and occasional weirdness are all possible.
		</p>

		<section>
			<h2>How you can help</h2>
			<p>
				If you run into something broken or confusing, please tell us. Clear reports (what you did,
				what you expected, what happened) help us fix things fast.
			</p>
			<ul>
				<li><a href="/feedback/bug-report">Report a bug</a></li>
				<li><a href="/feedback/feature-request">Request a feature</a></li>
				<li><a href="/feedback/general">General feedback</a></li>
			</ul>
		</section>

		<div class="back-link">
			<a href="/">← Back to Astounding Cards</a>
		</div>
	</div>
</div>

<style>
	.legal-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
		line-height: 1.6;
	}

	.content {
		background: var(--ui-bg, #ffffff);
		border: 1px solid var(--ui-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 2rem;
	}

	.lede {
		margin-top: 0.5rem;
		color: var(--text-secondary, #374151);
	}

	h1 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: var(--text-primary, #111827);
	}

	h2 {
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: var(--text-primary, #111827);
		border-bottom: 1px solid var(--ui-border, #e2e8f0);
		padding-bottom: 0.5rem;
	}

	.back-link {
		margin-top: 2rem;
	}
</style>
