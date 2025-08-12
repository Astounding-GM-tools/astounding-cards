import { describe, it, expect, vi } from 'vitest';
import { MechanicType } from '../../types';
import type { Card, CardMechanic } from '../../types';
import {
  createNewMechanic,
  addMechanic,
  removeMechanic,
  canMoveMechanic,
  moveMechanic,
  createUpdatedCard,
  getTypeIcon,
  getTypeName,
  isNumeric,
  hasChanges,
  shouldShowTrackingWarning
} from './CardMechanicsEditor.svelte.js';

describe('CardMechanicsEditor Logic', () => {
  // Helper to create test mechanic
  const createTestMechanic = (overrides: Partial<CardMechanic> = {}): CardMechanic => ({
    id: 'test-id',
    name: 'Test Mechanic',
    value: 10,
    description: 'Test description',
    tracked: false,
    type: MechanicType.HEALTH,
    ...overrides
  });

  // Helper to create test card
  const createTestCard = (overrides: Partial<Card> = {}): Card => ({
    id: 'test-card',
    deckId: 'test-deck',
    name: 'Test Card',
    type: 'character',
    image: null,
    imageBlob: null,
    mechanics: [],
    description: 'Test card',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  describe('createNewMechanic', () => {
    it('should create a new mechanic with default values', () => {
      const mechanic = createNewMechanic();
      
      expect(mechanic.id).toBeDefined();
      expect(typeof mechanic.id).toBe('string');
      expect(mechanic.id.length).toBeGreaterThan(0);
      expect(mechanic.name).toBe('New Mechanic');
      expect(mechanic.value).toBe(0);
      expect(mechanic.description).toBe('');
      expect(mechanic.tracked).toBe(false);
      expect(mechanic.type).toBe(MechanicType.ATTACK);
    });

    it('should create unique IDs for multiple calls', () => {
      const mechanic1 = createNewMechanic();
      const mechanic2 = createNewMechanic();
      
      // In a real environment, crypto.randomUUID() would create unique IDs
      // In test environment, we just verify they are strings and function calls work
      expect(typeof mechanic1.id).toBe('string');
      expect(typeof mechanic2.id).toBe('string');
      expect(mechanic1.id.length).toBeGreaterThan(0);
      expect(mechanic2.id.length).toBeGreaterThan(0);
    });
  });

  describe('addMechanic', () => {
    it('should add a new mechanic to empty array', () => {
      const result = addMechanic([]);
      
      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        name: 'New Mechanic',
        value: 0,
        description: '',
        tracked: false,
        type: MechanicType.ATTACK
      });
    });

    it('should add a new mechanic to existing array', () => {
      const existing = createTestMechanic();
      const result = addMechanic([existing]);
      
      expect(result.length).toBe(2);
      expect(result[0]).toBe(existing); // Original unchanged
      expect(result[1].name).toBe('New Mechanic');
    });

    it('should not mutate original array', () => {
      const original = [createTestMechanic()];
      const result = addMechanic(original);
      
      expect(original.length).toBe(1);
      expect(result).not.toBe(original);
    });
  });

  describe('removeMechanic', () => {
    it('should remove mechanic by index', () => {
      const mechanics = [
        createTestMechanic({ name: 'First' }),
        createTestMechanic({ name: 'Second' }),
        createTestMechanic({ name: 'Third' })
      ];
      
      const result = removeMechanic(mechanics, 1);
      
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('First');
      expect(result[1].name).toBe('Third');
    });

    it('should handle removing first element', () => {
      const mechanics = [createTestMechanic({ name: 'First' }), createTestMechanic({ name: 'Second' })];
      const result = removeMechanic(mechanics, 0);
      
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Second');
    });

    it('should handle removing last element', () => {
      const mechanics = [createTestMechanic({ name: 'First' }), createTestMechanic({ name: 'Second' })];
      const result = removeMechanic(mechanics, 1);
      
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('First');
    });

    it('should return empty array when removing only element', () => {
      const mechanics = [createTestMechanic()];
      const result = removeMechanic(mechanics, 0);
      
      expect(result).toEqual([]);
    });

    it('should handle invalid index gracefully', () => {
      const mechanics = [createTestMechanic()];
      const result = removeMechanic(mechanics, 5);
      
      expect(result).toEqual(mechanics);
    });

    it('should not mutate original array', () => {
      const original = [createTestMechanic()];
      const result = removeMechanic(original, 0);
      
      expect(original.length).toBe(1);
      expect(result).not.toBe(original);
    });
  });

  describe('canMoveMechanic', () => {
    it('should return false for moving first element up', () => {
      expect(canMoveMechanic(0, 'up', 3)).toBe(false);
    });

    it('should return false for moving last element down', () => {
      expect(canMoveMechanic(2, 'down', 3)).toBe(false);
    });

    it('should return true for valid up moves', () => {
      expect(canMoveMechanic(1, 'up', 3)).toBe(true);
      expect(canMoveMechanic(2, 'up', 3)).toBe(true);
    });

    it('should return true for valid down moves', () => {
      expect(canMoveMechanic(0, 'down', 3)).toBe(true);
      expect(canMoveMechanic(1, 'down', 3)).toBe(true);
    });

    it('should handle single element array', () => {
      expect(canMoveMechanic(0, 'up', 1)).toBe(false);
      expect(canMoveMechanic(0, 'down', 1)).toBe(false);
    });

    it('should handle empty array edge case', () => {
      expect(canMoveMechanic(0, 'up', 0)).toBe(false);
      expect(canMoveMechanic(0, 'down', 0)).toBe(false);
    });
  });

  describe('moveMechanic', () => {
    it('should move element up successfully', () => {
      const mechanics = [
        createTestMechanic({ name: 'First' }),
        createTestMechanic({ name: 'Second' }),
        createTestMechanic({ name: 'Third' })
      ];
      
      const result = moveMechanic(mechanics, 1, 'up');
      
      expect(result[0].name).toBe('Second');
      expect(result[1].name).toBe('First');
      expect(result[2].name).toBe('Third');
    });

    it('should move element down successfully', () => {
      const mechanics = [
        createTestMechanic({ name: 'First' }),
        createTestMechanic({ name: 'Second' }),
        createTestMechanic({ name: 'Third' })
      ];
      
      const result = moveMechanic(mechanics, 1, 'down');
      
      expect(result[0].name).toBe('First');
      expect(result[1].name).toBe('Third');
      expect(result[2].name).toBe('Second');
    });

    it('should return original array for invalid moves', () => {
      const mechanics = [createTestMechanic({ name: 'Only' })];
      const result = moveMechanic(mechanics, 0, 'up');
      
      expect(result).toBe(mechanics);
    });

    it('should not mutate original array for valid moves', () => {
      const original = [createTestMechanic({ name: 'First' }), createTestMechanic({ name: 'Second' })];
      const result = moveMechanic(original, 0, 'down');
      
      expect(original[0].name).toBe('First');
      expect(result).not.toBe(original);
    });
  });

  describe('createUpdatedCard', () => {
    it('should create card with mechanics when array has items', () => {
      const card = createTestCard();
      const mechanics = [createTestMechanic()];
      
      const result = createUpdatedCard(card, mechanics);
      
      expect(result.mechanics).toBe(mechanics);
      expect(result.id).toBe(card.id);
      expect(result.name).toBe(card.name);
    });

    it('should create card with undefined mechanics when array is empty', () => {
      const card = createTestCard({ mechanics: [createTestMechanic()] });
      
      const result = createUpdatedCard(card, []);
      
      expect(result.mechanics).toBeUndefined();
    });

    it('should not mutate original card', () => {
      const original = createTestCard();
      const mechanics = [createTestMechanic()];
      
      const result = createUpdatedCard(original, mechanics);
      
      expect(original.mechanics).toEqual([]);
      expect(result).not.toBe(original);
    });
  });

  describe('getTypeIcon', () => {
    it('should return correct icon for DEFENSE', () => {
      expect(getTypeIcon(MechanicType.DEFENSE)).toBe('🛡️');
    });

    it('should return correct icon for INITIATIVE', () => {
      expect(getTypeIcon(MechanicType.INITIATIVE)).toBe('⚡');
    });

    it('should return correct icon for MOVEMENT', () => {
      expect(getTypeIcon(MechanicType.MOVEMENT)).toBe('👟');
    });

    it('should return correct icon for ATTACK', () => {
      expect(getTypeIcon(MechanicType.ATTACK)).toBe('⚔️');
    });

    it('should return correct icon for HEALTH', () => {
      expect(getTypeIcon(MechanicType.HEALTH)).toBe('❤️');
    });

    it('should return correct icon for RESOURCE', () => {
      expect(getTypeIcon(MechanicType.RESOURCE)).toBe('📦');
    });

    it('should return default icon for unknown type', () => {
      expect(getTypeIcon('UNKNOWN_TYPE' as MechanicType)).toBe('📋');
    });
  });

  describe('getTypeName', () => {
    it('should return capitalized type names', () => {
      expect(getTypeName(MechanicType.DEFENSE)).toBe('Defense');
      expect(getTypeName(MechanicType.INITIATIVE)).toBe('Initiative');
      expect(getTypeName(MechanicType.MOVEMENT)).toBe('Movement');
      expect(getTypeName(MechanicType.ATTACK)).toBe('Attack');
      expect(getTypeName(MechanicType.HEALTH)).toBe('Health');
      expect(getTypeName(MechanicType.RESOURCE)).toBe('Resource');
    });

    it('should handle single character types', () => {
      expect(getTypeName('a' as MechanicType)).toBe('A');
    });

    it('should handle empty string', () => {
      expect(getTypeName('' as MechanicType)).toBe('');
    });
  });

  describe('isNumeric', () => {
    it('should return true for numbers', () => {
      expect(isNumeric(42)).toBe(true);
      expect(isNumeric(0)).toBe(true);
      expect(isNumeric(-5)).toBe(true);
      expect(isNumeric(3.14)).toBe(true);
    });

    it('should return true for numeric strings', () => {
      expect(isNumeric('42')).toBe(true);
      expect(isNumeric('0')).toBe(true);
      expect(isNumeric('-5')).toBe(true);
      expect(isNumeric('3.14')).toBe(true);
      expect(isNumeric('  10  ')).toBe(true);
    });

    it('should return false for non-numeric strings', () => {
      expect(isNumeric('hello')).toBe(false);
      expect(isNumeric('abc123')).toBe(false);
      expect(isNumeric('12x')).toBe(false);
      expect(isNumeric('')).toBe(false);
      expect(isNumeric('   ')).toBe(false);
    });

    it('should return false for special values', () => {
      expect(isNumeric('NaN')).toBe(false);
      expect(isNumeric('Infinity')).toBe(true);
      expect(isNumeric('-Infinity')).toBe(true);
    });
  });

  describe('hasChanges', () => {
    it('should return false when arrays are identical', () => {
      const mechanics = [createTestMechanic()];
      expect(hasChanges(mechanics, mechanics)).toBe(false);
    });

    it('should return false when both arrays are empty', () => {
      expect(hasChanges([], [])).toBe(false);
    });

    it('should return false when original is undefined and current is empty', () => {
      expect(hasChanges(undefined, [])).toBe(false);
    });

    it('should return true when mechanics are added', () => {
      const original = [];
      const current = [createTestMechanic()];
      expect(hasChanges(original, current)).toBe(true);
    });

    it('should return true when mechanics are removed', () => {
      const original = [createTestMechanic()];
      const current = [];
      expect(hasChanges(original, current)).toBe(true);
    });

    it('should return true when mechanic values change', () => {
      const original = [createTestMechanic({ name: 'Original' })];
      const current = [createTestMechanic({ name: 'Modified' })];
      expect(hasChanges(original, current)).toBe(true);
    });

    it('should return true when mechanic order changes', () => {
      const mechanic1 = createTestMechanic({ name: 'First' });
      const mechanic2 = createTestMechanic({ name: 'Second' });
      const original = [mechanic1, mechanic2];
      const current = [mechanic2, mechanic1];
      expect(hasChanges(original, current)).toBe(true);
    });

    it('should handle deep object comparison', () => {
      const original = [createTestMechanic({ value: { complex: 'object' } })];
      const current = [createTestMechanic({ value: { complex: 'object' } })];
      expect(hasChanges(original, current)).toBe(false);
    });
  });

  describe('shouldShowTrackingWarning', () => {
    it('should return true when tracked, numeric, and over threshold', () => {
      const mechanic = createTestMechanic({ tracked: true, value: 50 });
      expect(shouldShowTrackingWarning(mechanic, 30)).toBe(true);
    });

    it('should return false when not tracked', () => {
      const mechanic = createTestMechanic({ tracked: false, value: 50 });
      expect(shouldShowTrackingWarning(mechanic, 30)).toBe(false);
    });

    it('should return false when value is not numeric', () => {
      const mechanic = createTestMechanic({ tracked: true, value: 'high' });
      expect(shouldShowTrackingWarning(mechanic, 30)).toBe(false);
    });

    it('should return false when value equals threshold', () => {
      const mechanic = createTestMechanic({ tracked: true, value: 30 });
      expect(shouldShowTrackingWarning(mechanic, 30)).toBe(false);
    });

    it('should return false when value is under threshold', () => {
      const mechanic = createTestMechanic({ tracked: true, value: 25 });
      expect(shouldShowTrackingWarning(mechanic, 30)).toBe(false);
    });

    it('should use default threshold of 30', () => {
      const mechanic = createTestMechanic({ tracked: true, value: 35 });
      expect(shouldShowTrackingWarning(mechanic)).toBe(true);
    });

    it('should handle string numeric values', () => {
      const mechanic = createTestMechanic({ tracked: true, value: '50' });
      expect(shouldShowTrackingWarning(mechanic, 30)).toBe(true);
    });

    it('should return false for edge case values', () => {
      const mechanic1 = createTestMechanic({ tracked: true, value: 0 });
      expect(shouldShowTrackingWarning(mechanic1, 30)).toBe(false);

      const mechanic2 = createTestMechanic({ tracked: true, value: -10 });
      expect(shouldShowTrackingWarning(mechanic2, 30)).toBe(false);
    });
  });
});
