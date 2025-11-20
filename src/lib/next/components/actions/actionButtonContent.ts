/**
 * Action Button Content
 *
 * Centralized content for all action buttons.
 * Makes it easy to update button text across the app.
 */

export const actionButtonContent = {
	// Share - one-way action (no reversal)
	share: {
		title: 'Share',
		subtitle: 'Paste on Reddit, Discord...'
	},

	shareDisabled: {
		title: 'Share',
		subtitle: 'Publish first to share'
	},

	shareOutOfSync: {
		title: 'Share',
		subtitle: '⚠️ Outdated - republish first'
	},

	// Publish - reversible to Republish (Unpublish is in Dashboard)
	publish: {
		title: 'Publish to Gallery',
		subtitle: 'Make this deck public'
	},

	republish: {
		title: 'Republish',
		subtitle: '⚠️ Local changes not published'
	},

	published: {
		title: 'Publish',
		subtitle: 'Published ✓'
	},

	// View Public - one-way action
	viewPublic: {
		title: 'View Public Version',
		subtitle: 'See it in The Gallery'
	},

	// Like - reversible toggle
	like: {
		title: 'Like',
		subtitle: 'Show appreciation'
	},

	liked: {
		title: 'You like this',
		subtitle: 'Click to unlike'
	},

	// Add to Library - reversible toggle
	addToLibrary: {
		title: 'Add to Library',
		subtitle: 'Save to collection'
	},

	removeFromLibrary: {
		title: 'In Library',
		subtitle: 'Click to remove'
	},

	// Add Card - one-way action
	addCard: {
		title: 'Add Card',
		subtitle: 'Another!'
	},

	// Generate - one-way actions
	generate: {
		title: 'Generate',
		subtitle: 'AI-assisted deck content'
	},

	generateImages: {
		title: 'Generate Images',
		subtitle: 'The Slop Express'
	},

	// Dashboard features (for later)
	exportJson: {
		title: 'Export JSON',
		subtitle: 'Download deck as file. Import it in Excel. Edit with Office Copilot. We don\'t judge.'
	},

	deleteDeck: {
		title: 'Delete Deck',
		subtitle: 'Remove from your library'
	},

	duplicateDeck: {
		title: 'Duplicate Deck',
		subtitle: 'Create a copy'
	},

	printSize: {
		title: 'Print Size',
		subtitle: 'Small (poker) or Big (tarot)'
	}
} as const;

export type ActionButtonContentKey = keyof typeof actionButtonContent;
