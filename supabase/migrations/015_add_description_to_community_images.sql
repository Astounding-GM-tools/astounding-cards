-- Add description field to community_images
-- Stores the optimized motif description used for image generation
-- Useful for:
-- - Alt text / accessibility
-- - Semantic understanding of the image
-- - Future re-embedding if needed

ALTER TABLE community_images
ADD COLUMN description TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN community_images.description IS 'Optimized motif description from Gemini used to generate this image. Not the full prompt with style instructions, just the semantic/visual description.';
