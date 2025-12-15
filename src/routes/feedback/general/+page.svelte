<script lang="ts">
	import CannyBoard from '$lib/components/feedback/CannyBoard.svelte';
	import { CANNY_BOARDS } from '$lib/config/cannyBoards';
</script>

<CannyBoard boardToken={CANNY_BOARDS.feedback.token} basePath={CANNY_BOARDS.feedback.path} theme="light" />
