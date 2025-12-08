/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

import { vi } from 'vitest';

vi.stubGlobal('indexedDB', {
	open: () => ({
		onupgradeneeded: () => {},
		onsuccess: () => {},
		transaction: () => ({
			objectStore: () => ({
				get: () => ({}),
				add: () => ({})
			})
		})
	})
});
