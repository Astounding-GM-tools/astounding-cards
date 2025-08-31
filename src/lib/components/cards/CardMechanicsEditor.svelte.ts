/**
 * Pure logic functions for CardMechanicsEditor component
 * Handles mechanic creation, management, validation, and utility functions
 */

import type { Card, CardMechanic, MechanicType } from '../../types';
import { MechanicType as MechanicTypes } from '../../types';
import { generateKey } from '$lib/next/utils/idUtils.js';

/**
 * Create a new mechanic with default values
 * @returns A new CardMechanic object with default values
 */
export function createNewMechanic(): CardMechanic {
  return {
    id: generateKey(),
    name: 'New Mechanic',
    value: 0,
    description: '',
    tracked: false,
    type: MechanicTypes.ATTACK
  };
}

/**
 * Add a new mechanic to the mechanics array
 * @param mechanics - Current array of mechanics
 * @returns New array with added mechanic
 */
export function addMechanic(mechanics: CardMechanic[]): CardMechanic[] {
  return [...mechanics, createNewMechanic()];
}

/**
 * Remove a mechanic from the array by index
 * @param mechanics - Current array of mechanics
 * @param index - Index of mechanic to remove
 * @returns New array with mechanic removed
 */
export function removeMechanic(mechanics: CardMechanic[], index: number): CardMechanic[] {
  return mechanics.filter((_, i) => i !== index);
}

/**
 * Check if a mechanic can be moved in a given direction
 * @param index - Current index of the mechanic
 * @param direction - Direction to move ('up' or 'down')
 * @param totalCount - Total number of mechanics
 * @returns True if the move is valid
 */
export function canMoveMechanic(index: number, direction: 'up' | 'down', totalCount: number): boolean {
  // Can't move if array is empty or has only one element
  if (totalCount <= 1) {
    return false;
  }
  
  if (direction === 'up' && index === 0) {
    return false;
  }
  if (direction === 'down' && index === totalCount - 1) {
    return false;
  }
  return true;
}

/**
 * Move a mechanic up or down in the array
 * @param mechanics - Current array of mechanics
 * @param index - Index of mechanic to move
 * @param direction - Direction to move ('up' or 'down')
 * @returns New array with mechanic moved, or original array if move is invalid
 */
export function moveMechanic(mechanics: CardMechanic[], index: number, direction: 'up' | 'down'): CardMechanic[] {
  if (!canMoveMechanic(index, direction, mechanics.length)) {
    return mechanics;
  }
  
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  const newMechanics = [...mechanics];
  [newMechanics[index], newMechanics[newIndex]] = [newMechanics[newIndex], newMechanics[index]];
  return newMechanics;
}

/**
 * Create an updated card with new mechanics
 * @param card - Original card
 * @param mechanics - New mechanics array
 * @returns Updated card object
 */
export function createUpdatedCard(card: Card, mechanics: CardMechanic[]): Card {
  return {
    ...card,
    mechanics: mechanics.length > 0 ? mechanics : undefined
  };
}

/**
 * Get the emoji icon for a given mechanic type
 * @param type - The mechanic type enum value
 * @returns The corresponding emoji icon
 */
export function getTypeIcon(type: MechanicType): string {
  switch (type) {
    case MechanicTypes.DEFENSE: return '🛡️';
    case MechanicTypes.INITIATIVE: return '⚡';
    case MechanicTypes.MOVEMENT: return '👟';
    case MechanicTypes.ATTACK: return '⚔️';
    case MechanicTypes.HEALTH: return '❤️';
    case MechanicTypes.RESOURCE: return '📦';
    default: return '📋';
  }
}

/**
 * Get the display name for a mechanic type
 * @param type - The mechanic type enum value
 * @returns Capitalized display name
 */
export function getTypeName(type: MechanicType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Check if a value is numeric (number or numeric string)
 * @param value - The value to check
 * @returns True if the value is numeric
 */
export function isNumeric(value: string | number): boolean {
  if (typeof value === 'number') {
    return true;
  }
  // Handle empty string and whitespace-only strings as non-numeric
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }
  return !isNaN(Number(value));
}

/**
 * Check if mechanics array has any changes compared to original
 * @param originalMechanics - Original mechanics array (may be undefined)
 * @param currentMechanics - Current mechanics array
 * @returns True if there are changes
 */
export function hasChanges(originalMechanics: CardMechanic[] | undefined, currentMechanics: CardMechanic[]): boolean {
  const original = originalMechanics || [];
  return JSON.stringify(currentMechanics) !== JSON.stringify(original);
}

/**
 * Check if tracking warning should be shown for a mechanic
 * @param mechanic - The mechanic to check
 * @param threshold - The tracking threshold (default 30)
 * @returns True if warning should be shown
 */
export function shouldShowTrackingWarning(mechanic: CardMechanic, threshold: number = 30): boolean {
  return mechanic.tracked && isNumeric(mechanic.value) && Number(mechanic.value) > threshold;
}
