// Logic for ImageSelector component
import { processImage } from '$lib/utils/image';
import { createBlobUrl, revokeBlobUrl } from '$lib/utils/image-handler';
import type { CardSize } from '$lib/types';

export interface ImageSelectorState {
  urlValue: string;
  error: string;
  loading: boolean;
  lastProcessedBlob: Blob | undefined;
  previewUrl: string | null;
  originalFileName?: string;
  uploadTime?: Date;
  isFromUrl?: boolean;
}

interface ImageProcessingResult {
  blob: Blob | undefined;
  previewUrl: string | null;
  error: string;
}

interface ImageSelectorCallbacks {
  onSave?: (blob: Blob | null, sourceUrl?: string) => void | Promise<void>;
  onClose?: () => void;
}

/**
 * Initialize image selector state with default values
 */
export function initializeImageSelectorState(): ImageSelectorState {
  return {
    urlValue: '',
    error: '',
    loading: false,
    lastProcessedBlob: undefined,
    previewUrl: null
  };
}

/**
 * Update image selector state with new values
 */
function updateImageSelectorState(
  state: ImageSelectorState,
  updates: Partial<ImageSelectorState>
): ImageSelectorState {
  return { ...state, ...updates };
}

/**
 * Clean up preview URL if it exists
 */
export function cleanupPreviewUrl(previewUrl: string | null): void {
  if (previewUrl) {
    revokeBlobUrl(previewUrl);
  }
}

/**
 * Set loading state and clear errors
 */
function setLoadingState(state: ImageSelectorState, loading: boolean): ImageSelectorState {
  return updateImageSelectorState(state, {
    loading,
    error: loading ? '' : state.error // Clear error when starting to load
  });
}

/**
 * Set error state and clear preview/blob
 */
function setErrorState(state: ImageSelectorState, error: string): ImageSelectorState {
  cleanupPreviewUrl(state.previewUrl);
  
  return updateImageSelectorState(state, {
    error,
    loading: false,
    lastProcessedBlob: undefined,
    previewUrl: null
  });
}

/**
 * Set success state with processed image data
 */
function setSuccessState(
  state: ImageSelectorState, 
  blob: Blob, 
  previewUrl: string
): ImageSelectorState {
  // Clean up previous preview URL
  cleanupPreviewUrl(state.previewUrl);
  
  return updateImageSelectorState(state, {
    loading: false,
    error: '',
    lastProcessedBlob: blob,
    previewUrl
  });
}

/**
 * Process a file and return the result
 */
async function processFileImage(
  file: File, 
  cardSize: CardSize
): Promise<ImageProcessingResult> {
  try {
    const processed = await processImage(file, cardSize);
    const previewUrl = createBlobUrl(processed.blob);
    
    return {
      blob: processed.blob,
      previewUrl,
      error: ''
    };
  } catch (e) {
    console.error('Image processing error:', e);
    const error = e instanceof Error ? e.message : 'Failed to process image';
    
    return {
      blob: undefined,
      previewUrl: null,
      error
    };
  }
}

/**
 * Process an image from URL and return the result
 */
async function processUrlImage(
  url: string, 
  cardSize: CardSize
): Promise<ImageProcessingResult> {
  try {
    // Fetch and process the image
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const blob = await response.blob();
    const file = new File([blob], 'image', { type: blob.type });
    
    // Process the image
    const processed = await processImage(file, cardSize);
    const previewUrl = createBlobUrl(processed.blob);
    
    return {
      blob: processed.blob,
      previewUrl,
      error: ''
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Failed to load image';
    
    return {
      blob: undefined,
      previewUrl: null,
      error
    };
  }
}

/**
 * Handle file input change
 */
export async function handleFileChange(
  state: ImageSelectorState,
  file: File | undefined,
  cardSize: CardSize
): Promise<ImageSelectorState> {
  if (!file) return state;
  
  // Set loading state
  let newState = setLoadingState(state, true);
  
  // Process the image
  const result = await processFileImage(file, cardSize);
  
  // Update state based on result
  if (result.error) {
    return setErrorState(newState, result.error);
  } else if (result.blob && result.previewUrl) {
    const successState = setSuccessState(newState, result.blob, result.previewUrl);
    // Add original file information
    return updateImageSelectorState(successState, {
      originalFileName: file.name,
      uploadTime: new Date(),
      isFromUrl: false
    });
  } else {
    return setErrorState(newState, 'Failed to process image');
  }
}

/**
 * Handle URL input processing
 */
export async function handleUrlLoad(
  state: ImageSelectorState,
  cardSize: CardSize
): Promise<ImageSelectorState> {
  if (!state.urlValue) return state;
  
  // Set loading state
  let newState = setLoadingState(state, true);
  
  // Process the image from URL
  const result = await processUrlImage(state.urlValue, cardSize);
  
  // Update state based on result
  if (result.error) {
    return setErrorState(newState, result.error);
  } else if (result.blob && result.previewUrl) {
    const successState = setSuccessState(newState, result.blob, result.previewUrl);
    // Add URL metadata
    const urlParts = state.urlValue.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'image';
    return updateImageSelectorState(successState, {
      originalFileName: fileName,
      uploadTime: new Date(),
      isFromUrl: true
    });
  } else {
    return setErrorState(newState, 'Failed to process image');
  }
}

/**
 * Handle save action
 */
export async function handleSaveAction(
  state: ImageSelectorState,
  callbacks: ImageSelectorCallbacks
): Promise<ImageSelectorState> {
  if (!callbacks.onSave) return state;
  
  try {
    const newState = setLoadingState(state, true);
    
    // Pass the blob and let the parent handle URL conversion
    await callbacks.onSave(state.lastProcessedBlob || null, state.urlValue || undefined);
    
    return updateImageSelectorState(newState, { loading: false });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Failed to save image';
    return setErrorState(state, error);
  }
}

/**
 * Handle unset action
 */
export async function handleUnsetAction(
  state: ImageSelectorState,
  callbacks: ImageSelectorCallbacks
): Promise<ImageSelectorState> {
  if (!callbacks.onSave) return state;
  
  try {
    const newState = setLoadingState(state, true);
    
    await callbacks.onSave(null, undefined);
    
    return updateImageSelectorState(newState, { loading: false });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Failed to unset image';
    return setErrorState(state, error);
  }
}

/**
 * Check if save action is available
 */
export function canSave(state: ImageSelectorState): boolean {
  return !!(state.previewUrl && state.lastProcessedBlob);
}

/**
 * Check if image is in processing state
 */
export function isProcessing(state: ImageSelectorState): boolean {
  return state.loading;
}

/**
 * Check if there's an error state
 */
export function hasError(state: ImageSelectorState): boolean {
  return !!state.error;
}

/**
 * Check if there's a preview available
 */
export function hasPreview(state: ImageSelectorState): boolean {
  return !!state.previewUrl;
}

/**
 * Get appropriate button title for save button
 */
export function getSaveButtonTitle(state: ImageSelectorState): string {
  return state.previewUrl ? '' : 'No image chosen';
}

/**
 * Update URL value in state
 */
export function updateUrlValue(state: ImageSelectorState, urlValue: string): ImageSelectorState {
  return updateImageSelectorState(state, { urlValue });
}
