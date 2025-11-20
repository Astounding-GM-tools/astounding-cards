<script context="module">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ActionBar from '$lib/next/components/actions/ActionBar.svelte';
	import ActionButton from '$lib/next/components/actions/ActionButton.svelte';
	import { actionButtonContent } from '$lib/next/components/actions/actionButtonContent';
	import { Share2, Upload, Eye, Heart, Plus, Wand2 } from 'lucide-svelte';

	const { Story } = defineMeta({
		title: 'Components/Actions/ActionBar',
		tags: ['autodocs']
	});
</script>

<!-- Gallery View (Public) -->
<Story name="Gallery View (Public)">
	<ActionBar>
		<ActionButton icon={Share2} {...actionButtonContent.share} variant="primary" />
		<ActionButton icon={Heart} {...actionButtonContent.like} variant="danger" />
	</ActionBar>
</Story>

<!-- Gallery View (Liked) -->
<Story name="Gallery View (Liked)">
	<ActionBar>
		<ActionButton icon={Share2} {...actionButtonContent.share} variant="primary" />
		<ActionButton icon={Heart} {...actionButtonContent.liked} variant="danger" filled />
	</ActionBar>
</Story>

<!-- Local View (Unpublished) -->
<Story name="Local View (Unpublished)">
	<ActionBar>
		<ActionButton icon={Share2} {...actionButtonContent.shareDisabled} variant="primary" disabled />
		<ActionButton icon={Upload} {...actionButtonContent.publish} variant="success" />
		<ActionButton icon={Plus} {...actionButtonContent.addCard} variant="primary" />
		<ActionButton icon={Wand2} {...actionButtonContent.generate} variant="success" />
	</ActionBar>
</Story>

<!-- Local View (Published & Synced) -->
<Story name="Local View (Published & Synced)">
	<ActionBar>
		<ActionButton icon={Share2} {...actionButtonContent.share} variant="primary" />
		<ActionButton icon={Eye} {...actionButtonContent.viewPublic} variant="secondary" />
		<ActionButton icon={Upload} {...actionButtonContent.published} variant="success" />
		<ActionButton icon={Plus} {...actionButtonContent.addCard} variant="primary" />
		<ActionButton icon={Wand2} {...actionButtonContent.generate} variant="success" />
	</ActionBar>
</Story>

<!-- Local View (Published & Out of Sync) -->
<Story name="Local View (Out of Sync)">
	<ActionBar>
		<ActionButton icon={Share2} {...actionButtonContent.shareOutOfSync} variant="warning" />
		<ActionButton icon={Eye} {...actionButtonContent.viewPublic} variant="secondary" />
		<ActionButton icon={Upload} {...actionButtonContent.republish} variant="warning" />
		<ActionButton icon={Plus} {...actionButtonContent.addCard} variant="primary" />
		<ActionButton icon={Wand2} {...actionButtonContent.generate} variant="success" />
	</ActionBar>
</Story>

<!-- With Add to Library -->
<Story name="With Add to Library">
	<ActionBar>
		<ActionButton icon={Share2} {...actionButtonContent.share} variant="primary" />
		<ActionButton icon={Heart} {...actionButtonContent.like} variant="danger" />
		<ActionButton icon={Heart} {...actionButtonContent.addToLibrary} variant="primary" />
	</ActionBar>
</Story>

<!-- Mobile Preview (Narrow) -->
<Story name="Mobile Preview">
	<div style="max-width: 400px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
		<ActionBar>
			<ActionButton icon={Share2} {...actionButtonContent.share} variant="primary" />
			<ActionButton icon={Eye} {...actionButtonContent.viewPublic} variant="secondary" />
			<ActionButton icon={Upload} {...actionButtonContent.published} variant="success" />
			<ActionButton icon={Plus} {...actionButtonContent.addCard} variant="primary" />
		</ActionBar>
	</div>
</Story>
