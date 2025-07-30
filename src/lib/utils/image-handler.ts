// src/lib/utils/image-handler.ts

/**
 * Creates a blob URL from a Blob object
 * @param blob The blob to create a URL for
 * @returns The object URL
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revokes a blob URL to free up memory
 * @param url The object URL to revoke
 */
export function revokeBlobUrl(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * A simple utility to manage blob URLs for Svelte components.
 * It automatically creates and revokes URLs as needed, preventing memory leaks.
 */
export class ImageUrlManager {
  private currentUrl: string | null = null;

  constructor(private imageBlob?: Blob | null) {}

  public get url(): string | null {
    if (this.imageBlob && !this.currentUrl) {
      this.currentUrl = createBlobUrl(this.imageBlob);
    }
    return this.currentUrl;
  }

  public updateBlob(newBlob?: Blob | null): void {
    this.destroy();
    this.imageBlob = newBlob;
    // Force URL creation for new blob
    if (this.imageBlob) {
      this.currentUrl = createBlobUrl(this.imageBlob);
    }
  }

  public destroy(): void {
    if (this.currentUrl) {
      revokeBlobUrl(this.currentUrl);
      this.currentUrl = null;
    }
  }
}

