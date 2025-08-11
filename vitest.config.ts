import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['e2e/**/*'],
		environment: 'jsdom',
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'e2e/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/*.svelte' // We test .svelte.ts logic files, not .svelte components
			],
			thresholds: {
				global: {
					branches: 90,
					functions: 90,
					lines: 90,
					statements: 90
				}
			}
		},
		globals: true,
		setupFiles: ['./src/test-setup.ts']
	}
});
