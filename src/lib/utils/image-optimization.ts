/**
 * Image Optimization Utility
 * 
 * Helper functions for generating Cloudflare Image Resizing URLs.
 * Documentation: https://developers.cloudflare.com/images/image-resizing/url-format/
 */

interface ImageOptimizationOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'auto' | 'webp' | 'avif' | 'json';
	fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
	background?: string;
}

/**
 * Generates a Cloudflare Image Resizing URL
 * 
 * @param url - The original image URL
 * @param options - Resizing options (width, height, quality, format, etc.)
 * @returns The optimized URL
 */
import { PUBLIC_R2_PUBLIC_URL } from '$env/static/public';

/**
 * Generates a Cloudflare Image Resizing URL
 * 
 * @param url - The original image URL
 * @param options - Resizing options (width, height, quality, format, etc.)
 * @returns The optimized URL
 */
export function getOptimizedImageUrl(url: string, options: ImageOptimizationOptions = {}): string {
	if (!url) return '';

	// Skip optimization for blob URLs, data URLs, or if explicitly disabled
	if (url.startsWith('blob:') || url.startsWith('data:')) {
		return url;
	}

	// Default options
	const defaultOptions: ImageOptimizationOptions = {
		format: 'auto',
		quality: 80,
		fit: 'scale-down'
	};

	const settings = { ...defaultOptions, ...options };

	// Construct the options string
	const optionsParts: string[] = [];

	if (settings.width) optionsParts.push(`width=${settings.width}`);
	if (settings.height) optionsParts.push(`height=${settings.height}`);
	if (settings.quality) optionsParts.push(`quality=${settings.quality}`);
	if (settings.format) optionsParts.push(`format=${settings.format}`);
	if (settings.fit) optionsParts.push(`fit=${settings.fit}`);
	if (settings.background) optionsParts.push(`background=${settings.background}`);

	const optionsString = optionsParts.join(',');

	// If the URL is already a full URL, we need to inject /cdn-cgi/image/
	// We assume the domain supports it (custom domain or proxied)

	try {
		const urlObj = new URL(url);

		// If it's already a Cloudflare resized URL, avoid double nesting (basic check)
		if (urlObj.pathname.includes('/cdn-cgi/image/')) {
			return url;
		}

		// Use the configured public URL as the base if available
		// This ensures we use the custom domain (which supports resizing) even if the stored URL is the old R2 domain
		const baseUrl = PUBLIC_R2_PUBLIC_URL || urlObj.origin;

		// Construct the new path: /cdn-cgi/image/<options>/<original_path>
		return `${baseUrl}/cdn-cgi/image/${optionsString}${urlObj.pathname}${urlObj.search}`;
	} catch (e) {
		// If URL parsing fails (e.g. relative URL), try to prepend if it starts with /
		if (url.startsWith('/')) {
			const baseUrl = PUBLIC_R2_PUBLIC_URL || '';
			return `${baseUrl}/cdn-cgi/image/${optionsString}${url}`;
		}

		// Fallback: return original if we can't parse it
		return url;
	}
}

/**
 * Generates a srcset string for an image
 * 
 * @param url - The original image URL
 * @param widths - Array of widths to generate
 * @returns The srcset string
 */
export function getSrcSet(url: string, widths: number[] = [320, 640, 960, 1024]): string {
	if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
		return '';
	}

	return widths
		.map(width => {
			const optimizedUrl = getOptimizedImageUrl(url, { width });
			return `${optimizedUrl} ${width}w`;
		})
		.join(', ');
}
