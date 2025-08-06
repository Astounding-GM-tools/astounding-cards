// Svelte store for game preset management

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { GamePreset } from '../types';
import { getAllGamePresets, putGamePreset, deleteGamePreset } from '../db';
import { initializeOfficialPresets } from '../presets';

// Store for all game presets
export const gamePresets = writable<GamePreset[]>([]);

// Loading state
export const presetsLoading = writable(false);

// Derived stores for filtered presets
export const officialPresets = derived(gamePresets, $presets =>
  $presets.filter(p => p.isOfficial)
);

export const customPresets = derived(gamePresets, $presets =>
  $presets.filter(p => !p.isOfficial)
);

// Actions for preset management
export const presetActions = {
  // Load all presets from database
  async load(): Promise<void> {
    if (!browser) return;
    
    presetsLoading.set(true);
    try {
      // Initialize official presets first (if not already done)
      await initializeOfficialPresets();
      
      const presets = await getAllGamePresets();
      gamePresets.set(presets);
    } catch (error) {
      console.error('Failed to load game presets:', error);
      gamePresets.set([]);
    } finally {
      presetsLoading.set(false);
    }
  },

  // Save a preset (create or update)
  async save(preset: GamePreset): Promise<void> {
    if (!browser) return;

    try {
      // Update timestamps
      const updatedPreset = {
        ...preset,
        updated: new Date()
      };

      await putGamePreset(updatedPreset);
      
      // Update store
      gamePresets.update(presets => {
        const index = presets.findIndex(p => p.id === preset.id);
        if (index >= 0) {
          presets[index] = updatedPreset;
        } else {
          presets.push(updatedPreset);
        }
        return [...presets];
      });
    } catch (error) {
      console.error('Failed to save preset:', error);
      throw error;
    }
  },

  // Delete a preset
  async delete(id: string): Promise<void> {
    if (!browser) return;

    try {
      await deleteGamePreset(id);
      
      // Update store
      gamePresets.update(presets => 
        presets.filter(p => p.id !== id)
      );
    } catch (error) {
      console.error('Failed to delete preset:', error);
      throw error;
    }
  },

  // Get preset by ID
  async getById(id: string): Promise<GamePreset | undefined> {
    const presets = await new Promise<GamePreset[]>(resolve => {
      const unsubscribe = gamePresets.subscribe(value => {
        resolve(value);
        unsubscribe();
      });
    });
    
    return presets.find(p => p.id === id);
  },

  // Create a new preset from template
  createNew(name: string, description?: string): Partial<GamePreset> {
    return {
      id: crypto.randomUUID(),
      name,
      description,
      version: '1.0.0',
      frontStats: [],
      backMechanics: [],
      isOfficial: false,
      tags: ['custom'],
      created: new Date(),
      updated: new Date(),
    };
  },

  // Duplicate an existing preset
  async duplicate(sourceId: string, newName: string): Promise<GamePreset | null> {
    const source = await this.getById(sourceId);
    if (!source) return null;

    const duplicated: GamePreset = {
      ...source,
      id: crypto.randomUUID(),
      name: newName,
      isOfficial: false,
      tags: source.tags.includes('custom') ? source.tags : [...source.tags, 'custom'],
      created: new Date(),
      updated: new Date(),
    };

    await this.save(duplicated);
    return duplicated;
  },

  // Apply preset to deck (sets deck meta preset reference)
  applyToCards(preset: GamePreset, cards: any[]): any[] {
    // This would apply the preset's front stats and back mechanics to cards
    // For now, we'll return the cards as-is and handle application in the UI
    return cards.map(card => ({
      ...card,
      // Reset stats and mechanics to match preset structure
      stats: preset.frontStats.map(stat => ({
        statId: stat.id,
        value: 0
      })),
      mechanics: preset.backMechanics.map(mechanic => ({
        mechanicId: mechanic.id,
        value: mechanic.defaultValue
      }))
    }));
  }
};

// Auto-load presets when store is created
if (browser) {
  presetActions.load();
}
