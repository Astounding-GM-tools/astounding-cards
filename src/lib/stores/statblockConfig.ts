// Svelte store for statblock configuration management
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { StatblockConfig } from '../types';
import {
	getAllStatblockConfigs,
	getStatblockConfig,
	putStatblockConfig,
	deleteStatblockConfig
} from '../db';
import { officialConfigs, getDefaultConfig } from '../statblockConfigs';

// Store for all statblock configurations
export const statblockConfigs = writable<StatblockConfig[]>([]);

// Loading state
export const configsLoading = writable(false);

// Error state
export const configsError = writable<string | null>(null);

// Derived stores for filtered configs
export const officialStatblockConfigs = derived(statblockConfigs, ($configs) =>
	$configs.filter((config) => config.isOfficial)
);

export const customStatblockConfigs = derived(statblockConfigs, ($configs) =>
	$configs.filter((config) => !config.isOfficial)
);

// Actions for statblock config management
export const configActions = {
	// Load all configurations from database
	async load(): Promise<void> {
		if (!browser) return;

		configsLoading.set(true);
		configsError.set(null);

		try {
			// Initialize official configs first (if not already done)
			await this.initializeOfficialConfigs();

			const configs = await getAllStatblockConfigs();
			statblockConfigs.set(configs);
		} catch (error) {
			// Failed to load statblock configs
			configsError.set(error instanceof Error ? error.message : 'Unknown error');
			statblockConfigs.set([]);
		} finally {
			configsLoading.set(false);
		}
	},

	// Initialize official configurations in the database
	async initializeOfficialConfigs(): Promise<void> {
		try {
			const existing = await getAllStatblockConfigs();
			const existingIds = existing.map((config) => config.id);

			// Only add configs that don't already exist
			for (const config of officialConfigs) {
				if (!existingIds.includes(config.id)) {
					await putStatblockConfig(config);
				}
			}
		} catch (error) {
			// Failed to initialize official configs
			throw error;
		}
	},

	// Save a configuration (create or update)
	async save(config: StatblockConfig): Promise<void> {
		if (!browser) return;

		try {
			// Update timestamps
			const updatedConfig = {
				...config,
				updated: new Date()
			};

			await putStatblockConfig(updatedConfig);

			// Update store
			statblockConfigs.update((configs) => {
				const index = configs.findIndex((c) => c.id === config.id);
				if (index >= 0) {
					configs[index] = updatedConfig;
				} else {
					configs.push(updatedConfig);
				}
				return [...configs];
			});
		} catch (error) {
			// Failed to save statblock config
			throw error;
		}
	},

	// Delete a configuration
	async delete(id: string): Promise<void> {
		if (!browser) return;

		try {
			await deleteStatblockConfig(id);

			// Update store
			statblockConfigs.update((configs) => configs.filter((c) => c.id !== id));
		} catch (error) {
			// Failed to delete statblock config
			throw error;
		}
	},

	// Get configuration by ID
	async getById(id: string): Promise<StatblockConfig | undefined> {
		// First try to get from store
		const configs = await new Promise<StatblockConfig[]>((resolve) => {
			const unsubscribe = statblockConfigs.subscribe((value) => {
				resolve(value);
				setTimeout(() => unsubscribe(), 0); // Fix: Defer unsubscribe
			});
		});

		let config = configs.find((c) => c.id === id);

		// If not in store, try database
		if (!config) {
			const dbConfig = await getStatblockConfig(id);
			if (dbConfig) {
				config = dbConfig;
				// Add to store
				statblockConfigs.update((configs) => [...configs, dbConfig]);
			}
		}

		return config;
	},

	// Get configuration by ID or return default
	async getByIdOrDefault(id?: string): Promise<StatblockConfig> {
		if (!id) {
			return getDefaultConfig();
		}

		const config = await this.getById(id);
		return config || getDefaultConfig();
	},

	// Create a new custom configuration
	createNew(name: string, description?: string, basedOn?: StatblockConfig): StatblockConfig {
		const base = basedOn || getDefaultConfig();

		return {
			id: crypto.randomUUID(),
			name,
			description,
			vocabulary: { ...base.vocabulary }, // Deep copy vocabulary
			isOfficial: false,
			created: new Date(),
			updated: new Date()
		};
	},

	// Duplicate an existing configuration
	async duplicate(sourceId: string, newName: string): Promise<StatblockConfig | null> {
		const source = await this.getById(sourceId);
		if (!source) return null;

		const duplicated: StatblockConfig = {
			...source,
			id: crypto.randomUUID(),
			name: newName,
			isOfficial: false,
			created: new Date(),
			updated: new Date()
		};

		await this.save(duplicated);
		return duplicated;
	},

	// Reset to default configuration (useful for development/testing)
	async resetToDefaults(): Promise<void> {
		try {
			// Clear all existing configs
			const existing = await getAllStatblockConfigs();
			for (const config of existing) {
				await deleteStatblockConfig(config.id);
			}

			// Re-initialize official configs
			await this.initializeOfficialConfigs();

			// Reload
			await this.load();
		} catch (error) {
			// Failed to reset to defaults
			throw error;
		}
	}
};

// Auto-load configurations when store is created
if (browser) {
	configActions.load();
}
