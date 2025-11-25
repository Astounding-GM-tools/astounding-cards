<script lang="ts">
	import MainHeader from './MainHeader.svelte';
	import DeckMetadata from './DeckMetadata.svelte';
	import DeckActions from './DeckActions.svelte';

	let importing = $state(false);

	function handleImport() {
		importing = true;
		setTimeout(() => {
			alert('Deck imported to your collection!');
			importing = false;
		}, 1500);
	}

	function handleShare() {
		alert('Share URL copied to clipboard!');
	}

	function handleExport() {
		alert('Deck exported as JSON');
	}
</script>

<MainHeader
	title="Fantasy Heroes Deck"
	mockIsAuthenticated={true}
	mockUserEmail="user@example.com"
	mockDeckCount={5}
	mockTokenBalance={800}
>
	{#snippet metadata()}
		<DeckMetadata
			cardCount={24}
			imageCount={18}
			published={true}
			genre="Fantasy RPG"
			shareCount={142}
		/>
	{/snippet}

	{#snippet actions()}
		<DeckActions
			onShare={handleShare}
			onExportJson={handleExport}
			onImport={handleImport}
			isAuthenticated={true}
			importing={importing}
			isLiked={false}
			likeCount={42}
		/>
	{/snippet}
</MainHeader>
