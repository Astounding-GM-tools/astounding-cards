/**
 * Canvas utilities for AI image generation reference
 */

/**
 * Creates a simple 5:7 aspect ratio reference image - pure white rectangle
 * This provides aspect ratio guidance to AI without any visual content to copy
 */
export function createCardLayoutReference(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 350;
    canvas.height = 490; // 5:7 aspect ratio
    
    // Pure white rectangle - no other content
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 350, 490);
    
    return canvas.toDataURL('image/png');
}

/**
 * Helper to get user's existing card image if available
 */
export async function getUserCardImage(card: any): Promise<{ base64Data: string; mimeType: string } | null> {
    if (!card.imageBlob && !card.image) {
        return null;
    }
    
    try {
        let blob: Blob;
        
        if (card.imageBlob) {
            blob = card.imageBlob;
        } else if (card.image) {
            // Fetch the image from URL
            const response = await fetch(card.image);
            if (!response.ok) throw new Error('Failed to fetch image');
            blob = await response.blob();
        } else {
            return null;
        }
        
        // Convert blob to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64Data = result.split(',')[1];
                resolve({
                    base64Data,
                    mimeType: blob.type || 'image/png'
                });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
        
    } catch (error) {
        console.warn('Failed to get user card image:', error);
        return null;
    }
}
