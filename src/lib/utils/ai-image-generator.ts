/**
 * AI Image Generator
 * Uses Google AI Studio Gemini 2.5 Flash for image generation based on card content and themes
 */

import { GoogleGenAI } from '@google/genai';
import type { Card } from '$lib/next/types/card.js';
import { AI_CONFIGS } from '$lib/ai/config/models.js';
import { IMAGE_GENERATION_CONTEXT, PROMPT_OPTIMIZATION_CONTEXT, ART_STYLES, createPromptOptimizationRequest } from '$lib/ai/prompts/image-generation.js';
import { createCardLayoutReference, getUserCardImage } from '$lib/utils/canvas-capture.js';

export interface AiImageResult {
    success: boolean;
    imageBlob?: Blob;
    sourceUrl?: string;
    filename?: string;
    originalPrompt?: string; // The original card-based prompt
    optimizedPrompt?: string; // The AI-optimized visual prompt
    error?: string;
}

export class AiImageGenerator {
    // Use the centralized config instead of hardcoded model
    
    /**
     * Generate an AI image for a card using two-step optimization + generation process
     */
    async generateCardImage(card: Card, deckTheme: string, apiKey: string): Promise<AiImageResult> {
        try {
            console.log(`🎨 Starting two-step image generation for: ${card.title}`);
            
            // Initialize Gemini AI
            const ai = new GoogleGenAI({ apiKey });
            
            // Step 1: Optimize the card content into a visual prompt
            const originalPrompt = createPromptOptimizationRequest(
                card.title || 'Untitled',
                card.subtitle || '',
                card.description || '',
                deckTheme,
                card.traits || [],
                card.stats || []
            );
            
            console.log(`📝 Step 1: Optimizing prompt...`);
            const optimizationResponse = await ai.models.generateContent({
                model: AI_CONFIGS.TEXT_GENERATION.model,
                contents: originalPrompt,
                config: {
                    systemInstruction: PROMPT_OPTIMIZATION_CONTEXT,
                    temperature: AI_CONFIGS.TEXT_GENERATION.temperature
                }
            });
            
            const optimizedPrompt = optimizationResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (!optimizedPrompt) {
                throw new Error('Failed to optimize prompt - no response from Gemini');
            }
            
            console.log(`✅ Optimized prompt: "${optimizedPrompt.substring(0, 100)}..."`);
            
            // Step 2: Generate the image with multi-part request
            console.log(`🎨 Step 2: Generating image with visual context...`);
            
            // Prepare multi-part content with explicit art style instructions
            // Select art style based on theme, defaulting to classic
            const selectedArtStyle = ART_STYLES[deckTheme as keyof typeof ART_STYLES] || ART_STYLES.classic;
            
            const artStyleInstructions = `${IMAGE_GENERATION_CONTEXT}

Art style: ${selectedArtStyle}

Visual prompt: ${optimizedPrompt}`;
            
            const contentParts: any[] = [
                { text: artStyleInstructions }
            ];
            
            // Add user's existing card image if available (for style reference)
            const userImage = await getUserCardImage(card);
            if (userImage) {
                console.log(`📷 Adding user's existing image for style reference`);
                contentParts.push({
                    inlineData: {
                        mimeType: userImage.mimeType,
                        data: userImage.base64Data
                    }
                });
            }
            
            // Add card layout reference (always included)
            const layoutReference = createCardLayoutReference();
            const layoutBase64 = layoutReference.split(',')[1]; // Remove data:image/png;base64, prefix
            contentParts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: layoutBase64
                }
            });
            
            console.log(`📐 Added layout reference for composition guidance`);
            
            // Generate the image with multi-part context
            const imageResponse = await ai.models.generateContent({
                model: AI_CONFIGS.IMAGE_GENERATION.model,
                contents: contentParts,
                config: {
                    temperature: AI_CONFIGS.IMAGE_GENERATION.temperature
                }
            });
            
            // Extract image data from response
            const imageData = imageResponse.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (!imageData?.inlineData?.data) {
                console.warn('No image data in response. Received:', imageResponse);
                throw new Error('No image data received from Gemini - generation failed');
            }
            
            // Convert base64 data to blob
            const base64Data = imageData.inlineData.data;
            const mimeType = imageData.inlineData.mimeType || 'image/png';
            
            // Decode base64 to binary
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const imageBlob = new Blob([bytes], { type: mimeType });
            const filename = `ai-generated-${card.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'untitled'}.png`;
            
            console.log(`✅ Image generated successfully (${imageBlob.size} bytes)`);
            
            // Create a temporary URL for the generated image
            const sourceUrl = URL.createObjectURL(imageBlob);
            
            // Automatically download the full-resolution image to the downloads folder
            this.downloadImage(imageBlob, filename);
            
            return {
                success: true,
                imageBlob,
                sourceUrl,
                filename,
                originalPrompt,
                optimizedPrompt
            };
            
        } catch (error) {
            console.error('Gemini image generation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    
    /**
     * Download image blob to the browser's downloads folder
     */
    private downloadImage(imageBlob: Blob, filename: string): void {
        try {
            // Create a temporary URL for the blob
            const url = URL.createObjectURL(imageBlob);
            
            // Create a temporary download link
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            // Append to document, click, and clean up
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up the object URL after a short delay
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            console.log(`📥 Image downloaded: ${filename}`);
        } catch (error) {
            console.warn('Failed to download image:', error);
            // Don't throw - this is a nice-to-have feature, not critical
        }
    }
    
}
