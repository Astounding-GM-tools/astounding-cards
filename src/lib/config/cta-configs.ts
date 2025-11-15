/**
 * CTA Button Configurations
 * 
 * Defines different call-to-action scenarios for auth-gated features.
 * Each config specifies the button text and behavior for both authenticated and unauthenticated states.
 */

export type CtaConfig = {
	/** Unique identifier for this CTA scenario */
	id: string;
	
	/** Configuration for unauthenticated users */
	unauthenticated: {
		/** Primary button text (bold) */
		title: string;
		/** Subtitle text (smaller, lighter) */
		subtitle: string;
		/** Auth gate dialog config */
		authGate: {
			/** Feature name shown in dialog title */
			featureName: string;
			/** Description text in dialog */
			description: string;
		};
	};
	
	/** Configuration for authenticated users */
	authenticated: {
		/** Primary button text (bold) */
		title: string;
		/** Subtitle text (smaller, lighter) */
		subtitle: string;
	};
};

/**
 * Image generation CTA - for card editor image section
 */
export const IMAGE_GENERATION_CTA: CtaConfig = {
	id: 'image-generation',
	unauthenticated: {
		title: 'Generate or Select Image',
		subtitle: 'Free account unlocks AI & library',
		authGate: {
			featureName: 'AI Image Generation',
			description: 'Generate stunning card artwork with AI or browse our premium image library. Create a free account to unlock these exclusive features!'
		}
	},
	authenticated: {
		title: 'Generate or Select Image',
		subtitle: 'AI generation & premium library'
	}
};

/**
 * Deck generation CTA - for deck creation/editing
 */
export const DECK_GENERATION_CTA: CtaConfig = {
	id: 'deck-generation',
	unauthenticated: {
		title: 'Generate Deck with AI',
		subtitle: 'Free account unlocks AI deck creation',
		authGate: {
			featureName: 'AI Deck Generation',
			description: 'Create complete themed decks in seconds with AI. Define your theme and let AI generate unique cards with artwork, stats, and mechanics. Free to start!'
		}
	},
	authenticated: {
		title: 'Generate Deck with AI',
		subtitle: 'Create themed deck in seconds'
	}
};

/**
 * Cloud sync CTA - for saving/syncing decks
 */
export const CLOUD_SYNC_CTA: CtaConfig = {
	id: 'cloud-sync',
	unauthenticated: {
		title: 'Save to Cloud',
		subtitle: 'Free account enables cloud sync',
		authGate: {
			featureName: 'Cloud Sync',
			description: 'Sync your decks across devices and never lose your work. Access your collection from anywhere with a free account.'
		}
	},
	authenticated: {
		title: 'Save to Cloud',
		subtitle: 'Sync across all your devices'
	}
};

/**
 * Sharing CTA - for sharing decks with community
 */
export const SHARING_CTA: CtaConfig = {
	id: 'sharing',
	unauthenticated: {
		title: 'Share Your Deck',
		subtitle: 'Free account unlocks sharing',
		authGate: {
			featureName: 'Deck Sharing',
			description: 'Share your custom decks with the community or collaborate with friends. Get feedback and discover amazing creations from other creators.'
		}
	},
	authenticated: {
		title: 'Share Your Deck',
		subtitle: 'Share with community or friends'
	}
};

/**
 * All available CTA configs
 */
export const CTA_CONFIGS = {
	IMAGE_GENERATION: IMAGE_GENERATION_CTA,
	DECK_GENERATION: DECK_GENERATION_CTA,
	CLOUD_SYNC: CLOUD_SYNC_CTA,
	SHARING: SHARING_CTA
} as const;

export type CtaConfigType = keyof typeof CTA_CONFIGS;
