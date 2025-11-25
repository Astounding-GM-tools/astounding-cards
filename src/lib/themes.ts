export type ThemeColors = {
	primary: string;
	secondary: string;
	accent: string;
	text: string;
	background: string;
};

export type ThemeTypography = {
	titleFont: string;
	bodyFont: string;
};

export type ThemeDecoration = {
	borderStyle: string;
	patternUrl?: string;
};

export type CardTheme = {
	id: string;
	name: string;
	description: string;
	colors: ThemeColors;
	typography: ThemeTypography;
	decoration: ThemeDecoration;
	css?: string; // Additional custom CSS
	preview?: {
		title: string;
		role: string;
		traits: string[];
		portrait?: string; // Portrait file name for preview
	};
};

// Base themes
export const baseThemes: Record<string, CardTheme> = {
	classic: {
		id: 'classic',
		name: 'Classic',
		description: 'Clean, minimalist design focused on readability',
		colors: {
			primary: '#000000',
			secondary: '#333333',
			accent: '#666666',
			text: '#000000',
			background: '#ffffff'
		},
		typography: {
			titleFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
			bodyFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
		},
		decoration: {
			borderStyle: 'solid',
			patternUrl: '/flourishes/classic.svg'
		},
		preview: {
			title: 'Classic',
			role: 'Nothing fancy',
			traits: ['Clean: Non-distracting', 'Readable: System fonts', 'Genre: 20th century'],
			portrait: 'classic.png'
		}
	},

	scriptorum: {
		id: 'scriptorum',
		name: 'Scriptorum',
		description: 'Rich textures and illuminated manuscript style',
		colors: {
			primary: '#8B0000',
			secondary: '#2F4F4F',
			accent: '#DAA520',
			text: '#2C1810',
			background: '#F4E4BC'
		},
		typography: {
			titleFont: 'UnifrakturMaguntia, cursive',
			bodyFont: 'Eagle Lake, cursive'
		},
		decoration: {
			borderStyle: 'double',
			patternUrl: '/flourishes/manuscript.svg'
		},
		preview: {
			title: 'Scriptorum',
			role: 'Medieval manuscript æsthetic',
			traits: ['Feel: Gothic', 'Genre: Fantasy'],
			portrait: 'scriptorum_cropped.png'
		}
	},

	cordial: {
		id: 'cordial',
		name: 'Cordial',
		description: 'Elegant aesthetics with flowing organic elements',
		colors: {
			primary: '#7D98A1', // Silvery blue-grey
			secondary: '#2F4F4F', // Deep forest grey
			accent: '#C0D8D8', // Pale silver-blue
			text: '#2C3E50', // Deep blue-grey
			background: '#F5F9F9' // Very pale silver
		},
		typography: {
			titleFont: 'Ballet, cursive',
			bodyFont: 'Tangerine, cursive'
		},
		decoration: {
			borderStyle: 'organic',
			patternUrl: '/flourishes/cordial.svg'
		},
		preview: {
			title: 'Cordial',
			role: 'Art Nouveau',
			traits: ['Elegant: Gracefully swirly', 'Dress code: Black tie and tails'],
			portrait: 'cordial.png'
		}
	},

	cyberdeck: {
		id: 'cyberdeck',
		name: 'Cyberdeck',
		description: 'High-tech aesthetic with digital elements',
		colors: {
			primary: '#00b341', // Darker matrix green
			secondary: '#1a1a1a', // Dark gray
			accent: '#0098b8', // Darker neon blue
			text: '#1a1a1a', // Dark gray text
			background: 'white' // White background
		},
		typography: {
			titleFont: 'Orbitron, sans-serif',
			bodyFont: 'Share Tech Mono, monospace'
		},
		decoration: {
			borderStyle: 'solid',
			patternUrl: '/flourishes/tech.svg'
		},
		preview: {
			title: 'Cyberdeck',
			role: 'Dark future',
			traits: ['Hi-Tech: Clean and modern', 'Vibe: Dark and moody', 'Genre: Cyberpunk, Sci-Fi'],
			portrait: 'cyberdeck_2.png'
		}
	}
};

// Function to create a custom theme based on a base theme
export function createCustomTheme(
	baseThemeId: string,
	customizations: Partial<CardTheme>
): CardTheme {
	const baseTheme = baseThemes[baseThemeId];
	if (!baseTheme) throw new Error(`Theme ${baseThemeId} not found`);

	return {
		...baseTheme,
		...customizations,
		colors: { ...baseTheme.colors, ...customizations.colors },
		typography: { ...baseTheme.typography, ...customizations.typography },
		decoration: { ...baseTheme.decoration, ...customizations.decoration }
	};
}

// Function to validate a custom theme
export function validateTheme(theme: unknown): theme is CardTheme {
	if (!theme || typeof theme !== 'object') return false;
	const t = theme as CardTheme;

	return !!(
		t.id &&
		t.name &&
		t.colors?.primary &&
		t.colors?.text &&
		t.typography?.titleFont &&
		t.typography?.bodyFont &&
		t.decoration?.borderStyle
	);
}
