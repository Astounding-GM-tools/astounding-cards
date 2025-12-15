<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		boardToken: string;
		basePath: string;
		theme?: 'light' | 'dark' | 'auto';
		ssoToken?: string | null;
	};

	let { boardToken, basePath, theme = 'light', ssoToken = null }: Props = $props();

	let sdkReady = false;
	let renderRequested = false;

	function ensureSdkLoaded(): Promise<void> {
		if (typeof window === 'undefined') return Promise.resolve();

		// If already loaded, we're done.
		if (typeof window.Canny === 'function' && !window.Canny.q) {
			sdkReady = true;
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			// Install the queueing shim if needed.
			if (typeof window.Canny !== 'function') {
				const c: any = function (...args: any[]) {
					c.q.push(args);
				};
				c.q = [];
				window.Canny = c;
			}

			const existing = document.getElementById('canny-jssdk') as HTMLScriptElement | null;
			if (existing) {
				// Script tag exists; wait for it to finish loading.
				if ((existing as any)._cannyLoaded) {
					sdkReady = true;
					resolve();
					return;
				}

				existing.addEventListener('load', () => {
					(existing as any)._cannyLoaded = true;
					sdkReady = true;
					resolve();
				});
				existing.addEventListener('error', () => reject(new Error('Failed to load Canny SDK')));
				return;
			}

			const e = document.createElement('script');
			e.id = 'canny-jssdk';
			e.type = 'text/javascript';
			e.async = true;
			e.src = 'https://canny.io/sdk.js';
			e.addEventListener('load', () => {
				(e as any)._cannyLoaded = true;
				sdkReady = true;
				resolve();
			});
			e.addEventListener('error', () => reject(new Error('Failed to load Canny SDK')));

			const firstScript = document.getElementsByTagName('script')[0];
			firstScript?.parentNode?.insertBefore(e, firstScript);
		});
	}

	function renderBoard() {
		if (typeof window === 'undefined') return;
		if (typeof window.Canny !== 'function') return;

		window.Canny('render', {
			boardToken,
			basePath,
			ssoToken,
			theme
		});
	}

	onMount(async () => {
		await ensureSdkLoaded();
		renderBoard();
	});

	// If props change during client-side navigation, re-render.
	$effect(() => {
		if (typeof window === 'undefined') return;
		if (!boardToken || !basePath) return;

		if (!sdkReady) {
			renderRequested = true;
			return;
		}

		renderBoard();
	});

	$effect(() => {
		if (!sdkReady) return;
		if (!renderRequested) return;
		renderRequested = false;
		renderBoard();
	});
</script>

<div data-canny></div>
