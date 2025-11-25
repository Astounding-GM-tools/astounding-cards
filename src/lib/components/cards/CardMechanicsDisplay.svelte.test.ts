import { describe, it, expect } from 'vitest';
import { MechanicType } from '../../types';
import type { CardMechanic } from '../../types';
import {
	getTypeIcon,
	isNumeric,
	shouldShowTrackingBoxes,
	renderTrackingBoxes,
	getAddStatsAction
} from './CardMechanicsDisplay.svelte.js';

describe('CardMechanicsDisplay Logic', () => {
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
			expect(isNumeric('  10  ')).toBe(true); // whitespace around numbers
		});

		it('should return false for non-numeric strings', () => {
			expect(isNumeric('hello')).toBe(false);
			expect(isNumeric('abc123')).toBe(false);
			expect(isNumeric('12x')).toBe(false);
			expect(isNumeric('')).toBe(false);
			expect(isNumeric('   ')).toBe(false); // whitespace-only
		});

		it('should return false for special values', () => {
			expect(isNumeric('NaN')).toBe(false);
			expect(isNumeric('Infinity')).toBe(true); // Infinity is technically numeric
			expect(isNumeric('-Infinity')).toBe(true);
		});
	});

	describe('shouldShowTrackingBoxes', () => {
		const createMechanic = (overrides: Partial<CardMechanic> = {}): CardMechanic => ({
			id: 'test-id',
			type: MechanicType.HEALTH,
			name: 'Test Mechanic',
			value: 10,
			tracked: true,
			description: 'Test description',
			...overrides
		});

		it('should return true when mechanic is tracked, numeric, and <= 30', () => {
			const mechanic = createMechanic({ tracked: true, value: 10 });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(true);
		});

		it('should return true for edge case value of 30', () => {
			const mechanic = createMechanic({ tracked: true, value: 30 });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(true);
		});

		it('should return true for numeric string values <= 30', () => {
			const mechanic = createMechanic({ tracked: true, value: '25' });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(true);
		});

		it('should return false when not tracked', () => {
			const mechanic = createMechanic({ tracked: false, value: 10 });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(false);
		});

		it('should return false when value > 30', () => {
			const mechanic = createMechanic({ tracked: true, value: 31 });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(false);
		});

		it('should return false when value > 30 as string', () => {
			const mechanic = createMechanic({ tracked: true, value: '50' });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(false);
		});

		it('should return false when value is not numeric', () => {
			const mechanic = createMechanic({ tracked: true, value: 'high' });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(false);
		});

		it('should return false when all conditions fail', () => {
			const mechanic = createMechanic({ tracked: false, value: 'non-numeric' });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(false);
		});

		it('should return false for zero value (edge case)', () => {
			const mechanic = createMechanic({ tracked: true, value: 0 });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(true); // 0 is valid
		});

		it('should return false for negative values', () => {
			const mechanic = createMechanic({ tracked: true, value: -5 });
			expect(shouldShowTrackingBoxes(mechanic)).toBe(true); // negative numbers are still <= 30
		});
	});

	describe('renderTrackingBoxes', () => {
		it('should generate correct array for normal count', () => {
			const result = renderTrackingBoxes(5);
			expect(result).toEqual([0, 1, 2, 3, 4]);
		});

		it('should handle zero count', () => {
			const result = renderTrackingBoxes(0);
			expect(result).toEqual([]);
		});

		it('should limit to maximum of 30', () => {
			const result = renderTrackingBoxes(50);
			expect(result.length).toBe(30);
			expect(result[0]).toBe(0);
			expect(result[29]).toBe(29);
		});

		it('should handle exactly 30 count', () => {
			const result = renderTrackingBoxes(30);
			expect(result.length).toBe(30);
			expect(result).toEqual(Array.from({ length: 30 }, (_, i) => i));
		});

		it('should handle negative count by returning empty array', () => {
			const result = renderTrackingBoxes(-5);
			expect(result).toEqual([]);
		});

		it('should handle edge case of 1', () => {
			const result = renderTrackingBoxes(1);
			expect(result).toEqual([0]);
		});

		it('should handle decimal values by truncating', () => {
			const result = renderTrackingBoxes(5.7);
			expect(result).toEqual([0, 1, 2, 3, 4]);
		});
	});

	describe('getAddStatsAction', () => {
		it('should return editor action when card has mechanics', () => {
			const action = getAddStatsAction(true);
			expect(action.shouldShowTemplate).toBe(false);
			expect(action.shouldOpenEditor).toBe(true);
		});

		it('should return template action when card has no mechanics', () => {
			const action = getAddStatsAction(false);
			expect(action.shouldShowTemplate).toBe(true);
			expect(action.shouldOpenEditor).toBe(false);
		});

		it('should return consistent results for same input', () => {
			// Test pure function behavior - same input should always produce same output
			const action1 = getAddStatsAction(true);
			const action2 = getAddStatsAction(true);
			expect(action1).toEqual(action2);

			const action3 = getAddStatsAction(false);
			const action4 = getAddStatsAction(false);
			expect(action3).toEqual(action4);
		});

		it('should have mutually exclusive actions', () => {
			const actionWithMechanics = getAddStatsAction(true);
			expect(actionWithMechanics.shouldShowTemplate).not.toBe(actionWithMechanics.shouldOpenEditor);

			const actionWithoutMechanics = getAddStatsAction(false);
			expect(actionWithoutMechanics.shouldShowTemplate).not.toBe(
				actionWithoutMechanics.shouldOpenEditor
			);
		});
	});
});
