-- Test Data for Development
-- Insert a sample curated deck for testing

INSERT INTO published_decks (
  user_id,
  slug,
  title,
  description,
  theme,
  cards,
  tags,
  is_curated,
  is_featured,
  visibility
) VALUES (
  NULL, -- NULL for admin-curated deck
  'test-heroes',
  'Test Heroes Deck',
  'A sample deck of fantasy heroes for testing the gallery system',
  'Fantasy',
  '[
    {
      "id": "hero-1",
      "title": "Brave Knight",
      "subtitle": "Defender of the Realm",
      "description": "A valiant warrior sworn to protect the innocent",
      "traits": [
        {"title": "Courageous", "description": "Never backs down from danger", "isPublic": true},
        {"title": "Honorable", "description": "Always keeps their word", "isPublic": true}
      ],
      "stats": [
        {"name": "Strength", "value": "8"},
        {"name": "Defense", "value": "7"},
        {"name": "Speed", "value": "5"}
      ],
      "image": null,
      "imageBlob": null,
      "imageMetadata": null
    },
    {
      "id": "hero-2",
      "title": "Wise Mage",
      "subtitle": "Master of the Arcane",
      "description": "An elderly wizard with vast knowledge of magic",
      "traits": [
        {"title": "Intelligent", "description": "Knows ancient spells", "isPublic": true},
        {"title": "Patient", "description": "Takes time to plan", "isPublic": true}
      ],
      "stats": [
        {"name": "Magic", "value": "9"},
        {"name": "Defense", "value": "4"},
        {"name": "Speed", "value": "3"}
      ],
      "image": null,
      "imageBlob": null,
      "imageMetadata": null
    }
  ]'::jsonb,
  ARRAY['fantasy', 'heroes', 'test'],
  true, -- is_curated
  true, -- is_featured
  'public'
) ON CONFLICT (slug) DO NOTHING;

-- Verify the insert
SELECT 
  id, 
  slug, 
  title, 
  jsonb_array_length(cards) as card_count,
  created_at
FROM published_decks 
WHERE slug = 'test-heroes';
