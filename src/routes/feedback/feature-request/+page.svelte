<script lang="ts">
	import CannyBoard from '$lib/components/feedback/CannyBoard.svelte';
	import { CANNY_BOARDS } from '$lib/config/cannyBoards';
</script>

<CannyBoard
	boardToken={CANNY_BOARDS['feature-request'].token}
	basePath={CANNY_BOARDS['feature-request'].path}
	theme="light"
/>
