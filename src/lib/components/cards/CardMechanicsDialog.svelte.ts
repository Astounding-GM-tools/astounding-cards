// Logic for CardMechanicsDialog component
import { canonUpdateCard } from '../../stores/canonUpdate';
import type { Card } from '../../types';

export interface MechanicsDialogState {
	hasChanges: boolean;
	editedCard: Card | null;
}

export interface MechanicsDialogCallbacks {
	onClose?: () => void;
}

/**
 * Initialize mechanics dialog state
 */
export function initializeMechanicsDialogState(): MechanicsDialogState {
	return {
		hasChanges: false,
		editedCard: null
	};
}

/**
 * Handle save and close action
 */
export async function handleSaveAndClose(
	card: Card,
	state: MechanicsDialogState,
	isMechanicsUpdating: boolean,
	onCloseCallback?: () => void
): Promise<boolean> {
	if (!state.hasChanges || !state.editedCard || isMechanicsUpdating) return false;

	const success = await canonUpdateCard(
		card.id,
		{ mechanics: state.editedCard.mechanics },
		['card-mechanics'],
		'Updating mechanics...',
		'Mechanics updated successfully'
	);

	if (success && onCloseCallback) {
		onCloseCallback();
	}

	return success;
}

/**
 * Handle close action
 */
export function handleClose(
	dialogElement: HTMLDialogElement | null,
	isMechanicsUpdating: boolean,
	onCloseCallback?: () => void
): void {
	if (isMechanicsUpdating) return;

	dialogElement?.close();
	onCloseCallback?.();
}
