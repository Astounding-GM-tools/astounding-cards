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
  nameSize: string;
  roleSize: string;
  bodySize: string;
};

export type ThemeDecoration = {
  borderStyle: string;
  cornerStyle: string;
  frameStyle: string;
  patternUrl?: string;
  iconSet?: string;
};

export type CardTheme = {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  decoration: ThemeDecoration;
  css?: string; // Additional custom CSS
};

// Base themes
export const baseThemes: Record<string, CardTheme> = {
  artNouveau: {
    id: 'artNouveau',
    name: 'Art Nouveau',
    description: 'Elegant, organic flowing lines with natural motifs',
    colors: {
      primary: '#2C5530',
      secondary: '#A87B00',
      accent: '#D4AF37',
      text: '#2C2C2C',
      background: '#F8F4E9'
    },
    typography: {
      titleFont: 'Rozha One, serif',
      bodyFont: 'Cormorant Garamond, serif',
      nameSize: '1.8rem',
      roleSize: '1.2rem',
      bodySize: '1rem'
    },
    decoration: {
      borderStyle: 'flowing-organic',
      cornerStyle: 'floral',
      frameStyle: 'nouveau-frame',
      patternUrl: '/themes/artnouveau/pattern.svg'
    }
  },

  bauhaus: {
    id: 'bauhaus',
    name: 'Bauhaus',
    description: 'Geometric, modern, with bold primary colors',
    colors: {
      primary: '#D53D27',
      secondary: '#1E56B8',
      accent: '#F2C94C',
      text: '#000000',
      background: '#FFFFFF'
    },
    typography: {
      titleFont: 'Futura, sans-serif',
      bodyFont: 'Helvetica Neue, sans-serif',
      nameSize: '1.6rem',
      roleSize: '1.1rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'geometric',
      cornerStyle: 'square',
      frameStyle: 'bauhaus-grid',
      patternUrl: '/themes/bauhaus/pattern.svg'
    }
  },

  medieval: {
    id: 'medieval',
    name: 'Medieval',
    description: 'Rich textures and illuminated manuscript style',
    colors: {
      primary: '#8B0000',
      secondary: '#2F4F4F',
      accent: '#DAA520',
      text: '#2C1810',
      background: '#F4E4BC'
    },
    typography: {
      titleFont: 'UnifrakturMaguntia, serif',
      bodyFont: 'Crimson Text, serif',
      nameSize: '1.7rem',
      roleSize: '1.2rem',
      bodySize: '1rem'
    },
    decoration: {
      borderStyle: 'illuminated',
      cornerStyle: 'celtic',
      frameStyle: 'manuscript',
      patternUrl: '/themes/medieval/pattern.svg'
    }
  },

  elfin: {
    id: 'elfin',
    name: 'Elfin',
    description: 'Ethereal and naturalistic with delicate details',
    colors: {
      primary: '#4B6B55',
      secondary: '#A3B5C0',
      accent: '#E5C39C',
      text: '#2C3E50',
      background: '#F5F9F2'
    },
    typography: {
      titleFont: 'Cinzel, serif',
      bodyFont: 'Lato, sans-serif',
      nameSize: '1.6rem',
      roleSize: '1.1rem',
      bodySize: '0.95rem'
    },
    decoration: {
      borderStyle: 'leafy',
      cornerStyle: 'branch',
      frameStyle: 'nature-frame',
      patternUrl: '/themes/elfin/pattern.svg'
    }
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'High-tech, neon aesthetics with digital glitch effects',
    colors: {
      primary: '#FF0055',
      secondary: '#00FFF5',
      accent: '#FFE600',
      text: '#FFFFFF',
      background: '#0D0221'
    },
    typography: {
      titleFont: 'Orbitron, sans-serif',
      bodyFont: 'Share Tech Mono, monospace',
      nameSize: '1.5rem',
      roleSize: '1rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'circuit',
      cornerStyle: 'tech',
      frameStyle: 'digital',
      patternUrl: '/themes/cyberpunk/pattern.svg'
    }
  },

  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Clean, professional design with business card aesthetics',
    colors: {
      primary: '#1A237E',
      secondary: '#424242',
      accent: '#B71C1C',
      text: '#212121',
      background: '#FFFFFF'
    },
    typography: {
      titleFont: 'Montserrat, sans-serif',
      bodyFont: 'Open Sans, sans-serif',
      nameSize: '1.4rem',
      roleSize: '1rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'minimal',
      cornerStyle: 'sharp',
      frameStyle: 'business',
      patternUrl: '/themes/corporate/pattern.svg'
    }
  },

  tradingCard: {
    id: 'tradingCard',
    name: 'Trading Card',
    description: 'Classic collectible card game style',
    colors: {
      primary: '#1B5E20',
      secondary: '#BF360C',
      accent: '#FFC107',
      text: '#212121',
      background: '#F5F5F5'
    },
    typography: {
      titleFont: 'Beleren, serif',
      bodyFont: 'Matrix II, serif',
      nameSize: '1.5rem',
      roleSize: '1.1rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'beveled',
      cornerStyle: 'rounded',
      frameStyle: 'classic-frame',
      patternUrl: '/themes/trading/pattern.svg'
    }
  },

  vintage: {
    id: 'vintage',
    name: 'Vintage Sports',
    description: '70s style sports card aesthetic',
    colors: {
      primary: '#F57C00',
      secondary: '#795548',
      accent: '#FDD835',
      text: '#212121',
      background: '#FFFDE7'
    },
    typography: {
      titleFont: 'Graduate, serif',
      bodyFont: 'Roboto Condensed, sans-serif',
      nameSize: '1.6rem',
      roleSize: '1.2rem',
      bodySize: '0.9rem'
    },
    decoration: {
      borderStyle: 'retro',
      cornerStyle: 'worn',
      frameStyle: 'sports-classic',
      patternUrl: '/themes/vintage/pattern.svg'
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