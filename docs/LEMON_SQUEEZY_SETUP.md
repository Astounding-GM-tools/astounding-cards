# Lemon Squeezy Payment Integration

Complete setup guide for Lemon Squeezy token purchases with test mode support.

## Architecture Overview

The integration consists of three main components:

1. **Frontend (TokenStore.svelte)**: Displays token pack options and initiates checkout
2. **API Routes**: Handle checkout creation and webhook events
3. **Webhook Handler**: Processes purchase events and updates user credits

## Environment Variables

Add these to your `.env.local`:

```bash
# Lemon Squeezy API
LEMON_SQUEEZY_API_KEY=your_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_PRODUCT_ID=your_product_id
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret

# Test mode (set to "true" for testing, "false" for production)
LEMON_SQUEEZY_TEST_MODE=true
```

### How to Get These Values

1. **API Key** (Test Mode):
   - Go to [Lemon Squeezy Settings → API](https://app.lemonsqueezy.com/settings/api)
   - Create a new API key
   - **Important**: Switch your store to Test Mode first, then create the API key
   - Test mode API keys only work with test mode products

2. **Store ID**:
   - Go to [Lemon Squeezy Settings → Stores](https://app.lemonsqueezy.com/settings/stores)
   - Click on your store
   - The ID is in the URL: `app.lemonsqueezy.com/settings/stores/[STORE_ID]`

3. **Product ID**:
   - Create a product called "Token Packs" (or similar)
   - Add variants for different pack sizes (see below)
   - The ID is in the URL when editing the product

4. **Webhook Secret**:
   - Go to [Lemon Squeezy Settings → Webhooks](https://app.lemonsqueezy.com/settings/webhooks)
   - Create a webhook endpoint (see Webhook Setup below)
   - Copy the signing secret

## Product Setup

### Creating Token Pack Product

1. **Create Product**:
   - Go to Products → Add Product
   - Name: "Test Token Packs" (for test mode) or "Token Packs" (for production)
   - Description: Explain what tokens are used for

2. **Add Variants with Package Pricing**:
   Create 3-4 variants with different pack sizes using **Package Pricing**.

   For each variant:

   a. **Basic Info**:
      - Name: e.g., "Small", "Medium", "Mega" (can be anything!)
      - Price: e.g., $5.00, $13.00, $20.00
      - Status: Published

   b. **Enable Package Pricing**:
      - Scroll to "Advanced pricing"
      - Enable **"Package pricing"**
      - Set **"Package size"** to the number of tokens
        - Small: `5000`
        - Medium: `15000`
        - Mega: `25000`

   **Why Package Pricing?**
   - ✅ Structured, reliable data (no brittle description parsing)
   - ✅ API returns exact token count in `price_model.package_size`
   - ✅ Built-in support for usage-based billing
   - ✅ If users want to buy multiple packages, LS handles the calculation

   **Example variants**:

   | Name   | Price  | Package Size | Status    |
   |--------|--------|--------------|-----------|
   | Small  | $5.00  | 5000         | Published |
   | Medium | $13.00 | 15000        | Published |
   | Mega   | $20.00 | 25000        | Published |

3. **Variant Order**:
   - Drag and drop variants in your preferred order in the Lemon Squeezy UI
   - The `sort` field preserves this order
   - No naming convention required - use any names you like!

## Webhook Setup

### Local Development

See [WEBHOOK_TESTING.md](./WEBHOOK_TESTING.md) for detailed ngrok setup.

Quick start:
```bash
# Install ngrok
brew install ngrok

# Start dev server
npm run dev

# In another terminal, start ngrok
ngrok http 5173

# Add webhook in Lemon Squeezy with ngrok URL:
# https://abc123.ngrok.io/api/tokens/webhook
```

### Production

1. **Create Webhook**:
   - Go to [Lemon Squeezy Webhooks](https://app.lemonsqueezy.com/settings/webhooks)
   - Add endpoint: `https://cards.astounding.games/api/tokens/webhook`
   - Select events:
     - ✅ `order_created`
     - ✅ `order_refunded`
   - Copy the signing secret to `LEMON_SQUEEZY_WEBHOOK_SECRET`

2. **Security**:
   - All webhooks are verified with HMAC SHA-256 signatures
   - Only events from Lemon Squeezy will be processed
   - Idempotency prevents duplicate processing

## Test Mode vs Production

### Test Mode

When `LEMON_SQUEEZY_TEST_MODE=true`:
- Checkouts are created with `test_mode: true`
- Use test cards (4242 4242 4242 4242)
- No real charges
- Separate product required (test mode products can't be used in live mode)
- Test mode API key required

### Production Mode

When `LEMON_SQUEEZY_TEST_MODE=false`:
- Real charges with real cards
- Use production API key
- Use production product with production variants
- Same webhook endpoint can handle both (if configured correctly)

### Switching Between Modes

1. **Create separate products**:
   - Test product: "Test Token Packs" (test mode)
   - Production product: "Token Packs" (live mode)

2. **Update environment variables**:
   ```bash
   # Test
   LEMON_SQUEEZY_TEST_MODE=true
   LEMON_SQUEEZY_API_KEY=test_mode_key
   LEMON_SQUEEZY_PRODUCT_ID=test_product_id

   # Production
   LEMON_SQUEEZY_TEST_MODE=false
   LEMON_SQUEEZY_API_KEY=live_mode_key
   LEMON_SQUEEZY_PRODUCT_ID=live_product_id
   ```

3. **Store ID stays the same** - it's the same store in both modes

## API Endpoints

### GET /api/tokens/tiers

Fetches available token pack options from Lemon Squeezy.

**Response**:
```json
{
  "success": true,
  "tiers": [
    {
      "name": "Small",
      "packs": 1,
      "tokens": 5000,
      "price": 5.00,
      "discount": 0
    },
    {
      "name": "Medium",
      "packs": 3,
      "tokens": 15000,
      "price": 13.00,
      "discount": 0.08
    }
  ]
}
```

### POST /api/tokens/purchase

Creates a Lemon Squeezy checkout session.

**Request**:
```json
{
  "packs": 3
}
```

**Response**:
```json
{
  "success": true,
  "checkoutUrl": "https://astounding.lemonsqueezy.com/checkout/..."
}
```

### POST /api/tokens/webhook

Receives webhook events from Lemon Squeezy.

**Headers**:
- `X-Signature`: HMAC SHA-256 signature

**Events**:
- `order_created`: Add tokens to user account
- `order_refunded`: Deduct tokens from user account

## Testing Checklist

- [ ] Install ngrok: `brew install ngrok`
- [ ] Start dev server: `npm run dev`
- [ ] Start ngrok tunnel: `ngrok http 5173`
- [ ] Configure webhook in Lemon Squeezy with ngrok URL
- [ ] Add webhook secret to `.env.local`
- [ ] Test purchase with test card (4242 4242 4242 4242)
- [ ] Verify webhook received in ngrok UI (http://127.0.0.1:4040)
- [ ] Check server logs for webhook processing
- [ ] Verify tokens added to user account in Supabase
- [ ] Run webhook test: `npm run test:webhook`
- [ ] Test refund flow

## Common Issues

### "Your card was declined. Your request was in live mode, but used a known test card."

**Solution**: Set `LEMON_SQUEEZY_TEST_MODE=true` and ensure you're using a test mode API key and product.

### Variants not loading

**Solution**: Check that:
1. `LEMON_SQUEEZY_PRODUCT_ID` is set correctly
2. Variants have `status: "published"`
3. **Package pricing is enabled** for each variant
4. **Package size is set** to the token count (e.g., 5000, 15000, 25000)

To verify package pricing is configured correctly:
```bash
npx tsx scripts/inspect-package-pricing.ts
```

This will show which variants have package pricing enabled and their package sizes.

### Webhook signature verification fails

**Solution**:
1. Verify `LEMON_SQUEEZY_WEBHOOK_SECRET` matches the webhook in LS dashboard
2. Check that you're sending the raw request body (not parsed JSON)
3. Ensure test mode webhook secret for test mode, live secret for live mode

### Tokens not added after purchase

**Solution**: Check:
1. Webhook is configured correctly in Lemon Squeezy
2. Webhook secret is correct
3. User ID is valid
4. Server logs for specific errors
5. Transactions table in Supabase

## Deployment

### Vercel Configuration

Environment variables in Vercel dashboard:
```
LEMON_SQUEEZY_API_KEY=live_mode_key
LEMON_SQUEEZY_STORE_ID=123456
LEMON_SQUEEZY_PRODUCT_ID=789012
LEMON_SQUEEZY_WEBHOOK_SECRET=whsec_xxx
LEMON_SQUEEZY_TEST_MODE=false
```

### Preview Deployments

For testing webhooks in preview branches, see [WEBHOOK_TESTING.md](./WEBHOOK_TESTING.md#preview-deployments-vercel).

## Scripts

```bash
# Inspect product and variants
npx tsx scripts/inspect-lemon-squeezy.ts

# Inspect package pricing configuration
npx tsx scripts/inspect-package-pricing.ts

# Test webhook locally
npm run test:webhook

# Test with specific params
npx tsx scripts/test-webhook.ts order_created user-123 3
```

## Further Reading

- [Lemon Squeezy Documentation](https://docs.lemonsqueezy.com/)
- [Webhook Testing Guide](./WEBHOOK_TESTING.md)
- [API Reference](https://docs.lemonsqueezy.com/api)
