/**
 * AI Image Generator
 * Uses Google AI Studio Gemini 2.5 Flash for image generation based on card content and themes
 */

import { GoogleGenAI } from '@google/genai';
import type { Card } from '$lib/next/types/card.js';

export interface AiImageResult {
    success: boolean;
    imageBlob?: Blob;
    sourceUrl?: string;
    filename?: string;
    prompt?: string; // The prompt used for generation
    error?: string;
}

export class AiImageGenerator {
    private readonly IMAGE_MODEL = 'models/gemini-2.5-flash-image-preview';
    
    /**
     * Generate an AI image for a card based on its content and theme
     */
    async generateCardImage(card: Card, deckTheme: string, apiKey: string): Promise<AiImageResult> {
        try {
            // Create a prompt based on the card content and theme
            const prompt = this.createPrompt(card, deckTheme);
            
            console.log(`🎨 Generating image with Gemini: "${prompt.substring(0, 100)}..."`);
            
            // Initialize Gemini AI
            const ai = new GoogleGenAI({ apiKey });
            
            // Call Gemini 2.5 Flash Image Generation
            const response = await ai.models.generateContent({
                model: this.IMAGE_MODEL,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                config: {
                    temperature: 0.7, // Slightly higher for creative image generation
                    candidateCount: 1
                }
            });
            
            // Extract image data from response
            // For image generation models, the response should contain the generated image
            const imageData = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (!imageData?.inlineData?.data) {
                throw new Error('No image data received from Gemini - response may be text only');
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
            const filename = `ai-generated-${card.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
            
            console.log(`✅ Image generated successfully (${imageBlob.size} bytes)`);
            
            // Create a temporary URL for the generated image
            const sourceUrl = URL.createObjectURL(imageBlob);
            
            return {
                success: true,
                imageBlob,
                sourceUrl,
                filename,
                prompt
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
     * Create a detailed prompt for Gemini image generation based on card content and theme
     */
    private createPrompt(card: Card, deckTheme: string): string {
        const parts: string[] = [];
        
        // Base instruction
        parts.push('Create a detailed, atmospheric artwork for a tabletop RPG character card.');
        
        // Theme-specific styling
        const themeDescriptions = {
            'classic': 'medieval fantasy style with rich colors and traditional RPG aesthetics',
            'modern': 'contemporary urban fantasy style with clean lines and modern elements',
            'cyberpunk': 'futuristic cyberpunk style with neon colors and high-tech elements',
            'steampunk': 'Victorian steampunk style with brass, gears, and steam-powered machinery',
            'horror': 'dark horror style with ominous shadows and eerie atmosphere',
            'space': 'science fiction style with cosmic themes and space elements'
        };
        
        const themeDesc = themeDescriptions[deckTheme as keyof typeof themeDescriptions] || themeDescriptions.classic;
        parts.push(`Art style: ${themeDesc}.`);
        
        // Character/item name and subtitle
        if (card.title) {
            parts.push(`Subject: ${card.title}.`);
        }
        
        if (card.subtitle) {
            parts.push(`Type: ${card.subtitle}.`);
        }
        
        // Description
        if (card.description) {
            parts.push(`Description: ${card.description}.`);
        }
        
        // Stats for visual elements
        if (card.stats && card.stats.length > 0) {
            const publicStats = card.stats.filter(stat => stat.isPublic);
            if (publicStats.length > 0) {
                const statDescriptions = publicStats
                    .map(stat => `${stat.title}: ${stat.value}`)
                    .join(', ');
                parts.push(`Key attributes: ${statDescriptions}.`);
            }
        }
        
        // Traits for character details
        if (card.traits && card.traits.length > 0) {
            const publicTraits = card.traits.filter(trait => trait.isPublic);
            if (publicTraits.length > 0) {
                const traitDescriptions = publicTraits
                    .map(trait => `${trait.title}: ${trait.description}`)
                    .slice(0, 3) // Limit to avoid overly long prompts
                    .join('; ');
                parts.push(`Notable traits: ${traitDescriptions}.`);
            }
        }
        
        // Technical requirements for card images
        parts.push('Format: Portrait orientation suitable for a character card.');
        parts.push('Composition: Focus on the main subject with clear details and good contrast.');
        parts.push('Quality: High detail, professional artwork quality.');
        
        return parts.join(' ');
    }
}
