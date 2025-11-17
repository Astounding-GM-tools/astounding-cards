<script lang="ts">
	import MainHeader from './MainHeader.svelte';
	import DeckMetadata from './DeckMetadata.svelte';
	import DeckActions from './DeckActions.svelte';

	let cardBacksVisible = $state(true);
	let imageStyle = $state<'classic' | 'ink' | 'watercolor' | 'sketch'>('classic');
</script>

<MainHeader 
	title="Epic Fantasy Characters"
	onTitleEdit={() => console.log('Edit title')}
	mockIsAuthenticated={true}
	mockUserEmail="dungeonmaster@example.com"
	mockDeckCount={8}
>
	{#snippet metadata()}
		<DeckMetadata 
			cardCount={24}
			{imageStyle}
			{cardBacksVisible}
			published={true}
			imageCount={18}
			genre="Fantasy"
			shareCount={42}
			onImageStyleChange={(style) => { imageStyle = style; console.log('Style:', style); }}
			onCardBacksChange={(visible) => { cardBacksVisible = visible; console.log('Card backs:', visible); }}
		/>
	{/snippet}

	{#snippet actions()}
		<DeckActions
			onAddCard={() => console.log('Add card')}
			onShare={() => console.log('Share URL')}
			onExportJson={() => console.log('Export JSON')}
			onPublish={() => console.log('Publish')}
			onGenerateDeck={() => console.log('Generate deck')}
			onGenerateImages={() => console.log('Generate images')}
			onImportCards={() => console.log('Import cards')}
			onDuplicateDeck={() => console.log('Duplicate')}
			onDeleteDeck={() => console.log('Delete')}
			isAuthenticated={true}
		/>
	{/snippet}
</MainHeader>
