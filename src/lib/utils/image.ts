import type { CardSize } from '$lib/types';

// Target dimensions in pixels (5:7 aspect ratio)
// Optimized for common AI image generation sizes and web usage
// 1024×1434 maintains our aspect ratio while fitting within common AI output sizes
// This gives roughly 290 DPI at 90mm width, which is still very good quality
const CARD_PIXELS = {
  tarot: {
    width: 1024,   // Common AI output width
    height: 1434   // Maintains 5:7 ratio (1024 * 7/5)
  },
  poker: {
    width: 1024,   // Same as tarot - will be scaled down automatically
    height: 1434   // by printer/browser as needed
  }
} as const;

// Target quality for WebP conversion
const WEBP_QUALITY = 0.85; // Good balance of quality vs size

interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  format: string;
}

export async function processImage(file: File, cardSize: CardSize = 'tarot'): Promise<ProcessedImage> {
  // Create a bitmap for processing
  const imageBitmap = await createImageBitmap(file);
  
  // Get target dimensions
  const targetDims = CARD_PIXELS[cardSize];
  
  // Create a canvas for processing
  const canvas = document.createElement('canvas');
  canvas.width = targetDims.width;
  canvas.height = targetDims.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw image maintaining aspect ratio with smart cropping
  const scale = Math.max(
    targetDims.width / imageBitmap.width,
    targetDims.height / imageBitmap.height
  );
  
  const scaledWidth = imageBitmap.width * scale;
  const scaledHeight = imageBitmap.height * scale;
  
  // Center crop
  const x = (targetDims.width - scaledWidth) / 2;
  const y = (targetDims.height - scaledHeight) / 2;
  
  // Use better quality settings
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw image
  ctx.drawImage(
    imageBitmap,
    x, y,
    scaledWidth,
    scaledHeight
  );

  // Convert to WebP if supported
  const format = 'image/webp';
  const quality = WEBP_QUALITY; // Good balance of quality vs size
  
  // Get as blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      format,
      quality
    );
  });

  return {
    blob,
    width: targetDims.width,
    height: targetDims.height,
    format
  };
}

// Imgur upload function - we'll add the client ID when you have it
export async function uploadToImgur(imageBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('image', imageBlob);
  
  // We'll add the Client-ID header here when you have it
  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      // 'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
    },
    body: formData
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Upload rate limit reached. Please try again later.');
    }
    throw new Error('Image upload failed');
  }

  const result = await response.json();
  return result.data.link;
}

// Batch upload for sharing decks
export async function uploadDeckImages(
  images: { id: string; blob: Blob }[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  // Process in batches of 5 to avoid overwhelming
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    
    // Upload batch in parallel
    const uploads = await Promise.allSettled(
      batch.map(async ({ id, blob }) => {
        const url = await uploadToImgur(blob);
        return { id, url };
      })
    );
    
    // Process results
    uploads.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.set(result.value.id, result.value.url);
      }
      // Failed uploads will stay as blobs - user can retry
    });
  }
  
  return results;
} 