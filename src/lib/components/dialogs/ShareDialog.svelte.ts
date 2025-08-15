// Logic for ShareDialog component
import type { Card, Deck } from '$lib/types';
import { deckToUrl } from '$lib/stores/deck';
import { toasts } from '$lib/stores/toast';

export interface ShareDialogState {
  activeTab: 'share' | 'backup';
  showMigration: boolean;
  urlSize: number;
  blobCount: number;
  missingImageCount: number;
  migrationNeeded: boolean;
}

export interface BrowserSupport {
  browser: string;
  supported: boolean;
}

// Browser URL length limits (in bytes)
export const BROWSER_LIMITS = {
  'Chrome/Edge': 32_768,
  'Firefox': 65_536,
  'Safari': 80_000,
  'Opera': 32_768,
  'Mobile Safari': 64_000,
  'Mobile Chrome': 32_768
} as const;

/**
 * Initialize share dialog state with default values
 */
export function initializeShareDialogState(): ShareDialogState {
  return {
    activeTab: 'share',
    showMigration: false,
    urlSize: 0,
    blobCount: 0,
    missingImageCount: 0,
    migrationNeeded: false
  };
}

/**
 * Calculate URL size and image statistics for a deck
 */
export function calculateDeckStats(deck: Deck): Pick<ShareDialogState, 'urlSize' | 'blobCount' | 'missingImageCount' | 'migrationNeeded'> {
  const urlSize = new TextEncoder().encode(deckToUrl(deck)).length;
  
  // Count cards with no images
  const missingImageCount = deck.cards.filter((card: Card) => !card.image).length;
  
  // Count images that need URL migration (local files or blob:local)
  const blobCount = deck.cards.filter((card: Card) => {
    if (!card.image) return false; // Don't count missing images here
    return card.image === 'blob:local' || (!card.image.includes(':') && !card.image.startsWith('http'));
  }).length;
  
  const migrationNeeded = blobCount > 0;
  
  return {
    urlSize,
    blobCount,
    missingImageCount,
    migrationNeeded
  };
}

/**
 * Get browser support status for a given URL size
 */
export function getBrowserSupport(size: number): BrowserSupport[] {
  return Object.entries(BROWSER_LIMITS).map(([browser, limit]) => ({
    browser,
    supported: size <= limit
  }));
}

/**
 * Get URL size status indicator
 */
export function getUrlSizeStatus(size: number): 'success' | 'warning' | 'error' {
  const minBrowserLimit = Math.min(...Object.values(BROWSER_LIMITS));
  if (size > 30000) return 'error';
  if (size > 25000) return 'warning';
  if (size > minBrowserLimit) return 'warning';
  return 'success';
}

/**
 * Handle sharing as URL
 */
export async function shareAsUrl(deck: Deck): Promise<void> {
  try {
    const shareUrl = deckToUrl(deck);
    await navigator.clipboard.writeText(shareUrl);
    toasts.success('Share URL copied! Send this URL to share your deck.');
  } catch (err) {
    toasts.error('Failed to copy URL to clipboard');
  }
}

/**
 * Handle sharing as JSON download
 */
export async function shareAsJson(deck: Deck): Promise<void> {
  try {
    const json = JSON.stringify(deck, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `${deck.meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    // Set property; set attribute only if available (for simple mocks)
    (a as HTMLAnchorElement).download = filename;
    if (typeof (a as any).setAttribute === 'function') {
      a.setAttribute('download', filename);
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toasts.success('JSON file downloaded successfully');
  } catch (err) {
    toasts.error('Failed to download JSON file');
  }
}

/**
 * Handle share action with migration check
 */
export async function handleShare(deck: Deck, format: 'url' | 'json', migrationNeeded: boolean): Promise<void> {
  if (migrationNeeded) {
    toasts.warning('Please migrate blob-based images to URLs first');
    return;
  }

  if (format === 'url') {
    await shareAsUrl(deck);
  } else {
    await shareAsJson(deck);
  }
}
