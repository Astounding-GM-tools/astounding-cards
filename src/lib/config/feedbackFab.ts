import { IS_BETA } from '$lib/config/app';

// Quick kill-switch for the floating feedback button.
//
// During beta you probably want both enabled + pulse.
// Later you can set pulse=false, or disable entirely.
export const FEEDBACK_FAB_ENABLED = true;
export const FEEDBACK_FAB_PULSE = IS_BETA;
