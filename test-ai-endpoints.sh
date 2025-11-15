#!/bin/bash

# Test AI Generation Endpoints
# Quick validation script for server-side AI generation

echo "Testing AI Generation Endpoints..."
echo ""

# Test 1: Deck Generation
echo "1. Testing /api/ai/generate-deck..."
DECK_RESULT=$(curl -s -X POST http://localhost:5173/api/ai/generate-deck \
  -H "Content-Type: application/json" \
  -d '{"theme": "Space Pirates", "cardCount": 3}' | jq -r 'if .success then "✅ SUCCESS: Generated \(.deck.deck.cards | length) cards" else "❌ FAILED: \(.message // .error)" end')
echo "$DECK_RESULT"
echo ""

# Test 2: Image Generation
echo "2. Testing /api/ai/generate-image..."
IMAGE_RESULT=$(curl -s -X POST http://localhost:5173/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "card": {
      "title": "Space Captain",
      "subtitle": "Heroic Leader",
      "description": "A brave leader with piercing blue eyes",
      "traits": [{"title": "Brave", "description": "Never backs down", "isPublic": true}],
      "stats": [{"title": "Leadership", "value": 10, "isPublic": true}]
    },
    "deckTheme": "sci-fi"
  }' | jq -r 'if .success then "✅ SUCCESS: Generated image (\(.mimeType), \(.imageData | length / 1000 | floor)KB base64)" else "❌ FAILED: \(.message // .error)" end')
echo "$IMAGE_RESULT"
echo ""

echo "All endpoint tests complete!"
