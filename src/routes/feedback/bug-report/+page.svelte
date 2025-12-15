<script lang="ts">
	import CannyBoard from '$lib/components/feedback/CannyBoard.svelte';
	import { CANNY_BOARDS } from '$lib/config/cannyBoards';
</script>

<CannyBoard boardToken={CANNY_BOARDS['bug-report'].token} basePath={CANNY_BOARDS['bug-report'].path} theme="light" />
