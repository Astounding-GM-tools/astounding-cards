<script lang="ts">
	import { nextDeckStore } from '$lib/next/stores/deckStore.svelte.js';
	import { nextDevStore } from '$lib/next/stores/devStore.svelte.js';
	import { onMount } from 'svelte';

	let info = $state({ deckCount: 0, totalCards: 0 });
	let testResults = $state<string[]>([]);

	function addResult(message: string) {
		testResults = [...testResults, `${new Date().toLocaleTimeString()}: ${message}`];
	}

	async function testDatabaseOperations() {
		try {
			addResult('Starting database tests...');

			// Test 1: Clear database
			await nextDevStore.clearDatabase();
			addResult('✅ Database cleared');

			// Test 2: Create deck
			const success = await nextDeckStore.createDeck('Test Deck');
			if (success) {
				addResult('✅ Deck created successfully');
			} else {
				addResult('❌ Failed to create deck');
				return;
			}

			// Test 3: Add card
			const newCard = await nextDeckStore.addCard({
				title: 'Test Card',
				subtitle: 'Test Character',
				description: 'This is a test card'
			});

			if (newCard) {
				addResult('✅ Card added successfully');
			} else {
				addResult('❌ Failed to add card');
			}

			// Test 4: Update card
			if (newCard) {
				const updateSuccess = await nextDeckStore.updateCard(newCard.id, {
					title: 'Updated Test Card'
				});
				if (updateSuccess) {
					addResult('✅ Card updated successfully');
				} else {
					addResult('❌ Failed to update card');
				}
			}

			// Test 5: Update database info
			await updateInfo();
			addResult('✅ All tests completed');
		} catch (error) {
			addResult(`❌ Error: ${error}`);
		}
	}

	async function setupSampleData() {
		const success = await nextDevStore.setupTestEnvironment();
		if (success) {
			addResult('✅ Sample data setup completed');
			await updateInfo();
		} else {
			addResult('❌ Failed to setup sample data');
		}
	}

	async function updateInfo() {
		info = await nextDevStore.getDatabaseInfo();
	}

	onMount(() => {
		updateInfo();
		addResult('Database test page loaded');
	});
</script>

<div class="test-page">
	<h1>Next System Database Test</h1>

	<section class="info-section">
		<h2>Database Info</h2>
		<p><strong>Decks:</strong> {info.deckCount}</p>
		<p><strong>Total Cards:</strong> {info.totalCards}</p>
		<button onclick={updateInfo}>Refresh Info</button>
	</section>

	<section class="current-deck">
		<h2>Current Deck</h2>
		{#if nextDeckStore.deck}
			<div class="deck-info">
				<p><strong>Title:</strong> {nextDeckStore.deck.meta.title}</p>
				<p><strong>Theme:</strong> {nextDeckStore.deck.meta.theme}</p>
				<p><strong>Cards:</strong> {nextDeckStore.deck.cards.length}</p>

				{#if nextDeckStore.deck.cards.length > 0}
					<h3>Cards:</h3>
					<ul>
						{#each nextDeckStore.deck.cards as card}
							<li>
								<strong>{card.title}</strong> - {card.subtitle}
								<br /><small>{card.description}</small>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else}
			<p>No deck loaded</p>
		{/if}

		{#if nextDeckStore.isLoading}
			<p class="loading">⏳ {nextDeckStore.loadingMessage}</p>
		{/if}

		{#if nextDeckStore.error}
			<p class="error">❌ {nextDeckStore.error}</p>
		{/if}
	</section>

	<section class="actions">
		<h2>Test Actions</h2>
		<button onclick={testDatabaseOperations}>Run Database Tests</button>
		<button onclick={setupSampleData}>Setup Sample Data</button>
		<button onclick={() => nextDevStore.clearDatabase()}>Clear Database</button>
	</section>

	<section class="console">
		<h2>Console Access</h2>
		<p>Open browser console and try:</p>
		<ul>
			<li><code>nextDevTools.setupTestEnvironment()</code></li>
			<li><code>nextDevTools.getDatabaseInfo()</code></li>
			<li><code>nextDevTools.store.deck</code></li>
			<li><code>nextDevTools.exportDeck()</code></li>
		</ul>
	</section>

	<section class="results">
		<h2>Test Results</h2>
		<div class="log">
			{#each testResults as result}
				<div class="log-entry">{result}</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.test-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
	}

	section {
		margin-bottom: 2rem;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	h1 {
		color: #333;
		text-align: center;
	}

	h2 {
		color: #555;
		margin-top: 0;
	}

	button {
		background: #007acc;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		margin-right: 0.5rem;
		margin-bottom: 0.5rem;
	}

	button:hover {
		background: #005a9e;
	}

	.deck-info {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
	}

	.loading {
		color: #ff6b00;
		font-weight: bold;
	}

	.error {
		color: #d63031;
		font-weight: bold;
	}

	.log {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 4px;
		font-family: monospace;
		max-height: 300px;
		overflow-y: auto;
	}

	.log-entry {
		margin-bottom: 0.25rem;
		padding: 0.25rem;
		border-left: 3px solid transparent;
	}

	.log-entry:nth-child(odd) {
		background: rgba(0, 0, 0, 0.02);
	}

	code {
		background: #e9ecef;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		font-family: monospace;
	}

	ul li {
		margin-bottom: 0.5rem;
	}
</style>
