#!/bin/bash

# Test script for payment endpoints
# Run with: bash test-endpoints.sh

BASE_URL="http://localhost:5173"

echo "🧪 Testing Payment Endpoints"
echo "================================"

# Test 1: Purchase endpoint without auth (should return 401)
echo ""
echo "📝 Test 1: Purchase endpoint (no auth - should fail)"
curl -X POST "${BASE_URL}/api/tokens/purchase" \
  -H "Content-Type: application/json" \
  -d '{"packs": 1}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

# Test 2: Purchase endpoint with invalid pack count
echo ""
echo "📝 Test 2: Purchase endpoint (invalid pack count - should fail)"
curl -X POST "${BASE_URL}/api/tokens/purchase" \
  -H "Content-Type: application/json" \
  -d '{"packs": 2}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

# Test 3: Transactions endpoint without auth (should return 401)
echo ""
echo "📝 Test 3: Transactions endpoint (no auth - should fail)"
curl -X GET "${BASE_URL}/api/tokens/transactions" \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

# Test 4: Webhook endpoint without signature (should return 401)
echo ""
echo "📝 Test 4: Webhook endpoint (no signature - should fail)"
curl -X POST "${BASE_URL}/api/tokens/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

echo ""
echo "================================"
echo "✅ Basic connectivity tests complete!"
echo ""
echo "Note: All tests should fail with proper error codes (401, 400, etc)"
echo "This confirms endpoints are accessible and handle errors correctly."
echo ""
echo "To test authenticated requests:"
echo "1. Sign in at http://localhost:5173"
echo "2. Open browser DevTools → Network tab"
echo "3. Copy the 'Cookie' header from any request"
echo "4. Use it in curl like:"
echo "   curl -X POST http://localhost:5173/api/tokens/purchase \\"
echo "     -H 'Cookie: your-cookie-here' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"packs\": 1}'"
