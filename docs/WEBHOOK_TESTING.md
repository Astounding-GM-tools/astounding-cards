# Webhook Testing Guide

This guide explains how to test Lemon Squeezy webhooks locally and in preview deployments.

## Overview

Lemon Squeezy sends webhook events when purchases are completed, refunded, etc. Our webhook handler is at:
- **Endpoint**: `/api/tokens/webhook`
- **Method**: POST
- **Authentication**: HMAC SHA-256 signature verification

## Local Development with ngrok

### 1. Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start your dev server

```bash
npm run dev
```

Your app will be running on `http://localhost:5173`

### 3. Create ngrok tunnel

In a separate terminal:

```bash
ngrok http 5173
```

You'll see output like:

```
Forwarding   https://abc123.ngrok.io -> http://localhost:5173
```

**Copy the `https://` URL** - this is your public webhook URL.

### 4. Configure Lemon Squeezy webhook

1. Go to [Lemon Squeezy Webhooks](https://app.lemonsqueezy.com/settings/webhooks)
2. Click "Add endpoint"
3. Enter your ngrok URL + `/api/tokens/webhook`:
   ```
   https://abc123.ngrok.io/api/tokens/webhook
   ```
4. Select events:
   - ✅ `order_created`
   - ✅ `order_refunded`
5. Copy the **Signing secret**
6. Add to your `.env.local`:
   ```bash
   LEMON_SQUEEZY_WEBHOOK_SECRET=whsec_...
   ```

### 5. Test a purchase

1. Go to your app's token purchase page
2. Complete a test purchase using a test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVV: Any 3 digits
3. Watch the terminal for webhook logs:
   ```
   [Webhook] Event: order_created, Order: 123456
   [Webhook] Success! Added 5000 tokens to user abc-123
   ```

### 6. Inspect webhook payload

You can also use ngrok's web interface to inspect requests:

```bash
open http://127.0.0.1:4040
```

This shows all HTTP requests, including the webhook POST with full headers and body.

## Preview Deployments (Vercel)

For testing webhooks in preview branches:

### Option 1: Separate webhook endpoint (Recommended)

Create a separate webhook endpoint in Lemon Squeezy for preview deployments:

1. Deploy your preview branch to Vercel
2. Copy the preview URL (e.g., `https://astounding-cards-git-feature-xyz.vercel.app`)
3. Add a new webhook in Lemon Squeezy:
   ```
   https://astounding-cards-git-feature-xyz.vercel.app/api/tokens/webhook
   ```
4. Use the same webhook secret
5. Mark it as "Test" webhook
6. Disable it after testing

### Option 2: Use webhook event replay

Lemon Squeezy allows replaying webhook events:

1. Complete a test purchase on production
2. Go to Webhooks → Recent deliveries
3. Find your test event
4. Click "Resend"
5. Change the URL to your preview deployment

## Automated Testing

### Unit Tests

Test webhook handler logic without actual HTTP requests:

```bash
npm run test:unit -- webhook
```

Key test cases:
- ✅ Signature verification (valid/invalid)
- ✅ Order created event handling
- ✅ Order refunded event handling
- ✅ Idempotency (duplicate events)
- ✅ Error handling

### Integration Tests

Test the full webhook flow:

```bash
npm run test:webhook
```

This script:
1. Generates a valid webhook payload
2. Signs it with your webhook secret
3. Sends POST to your local/preview endpoint
4. Verifies the response and database changes

## Webhook Event Samples

### order_created

```json
{
  "meta": {
    "event_name": "order_created",
    "custom_data": {
      "user_id": "abc-123",
      "packs": "3",
      "tier": "Popular"
    }
  },
  "data": {
    "id": "123456",
    "type": "orders",
    "attributes": {
      "order_number": 1001,
      "status": "paid",
      "total": 1434,
      "first_order_item": {
        "variant_id": "1146782",
        "variant_name": "Medium"
      }
    }
  }
}
```

### order_refunded

Similar to `order_created` but with:
- `event_name: "order_refunded"`
- `status: "refunded"`

## Troubleshooting

### Webhook not received

1. **Check ngrok is running**: Visit the ngrok web interface at http://127.0.0.1:4040
2. **Check URL**: Ensure webhook URL in Lemon Squeezy matches your ngrok URL
3. **Check signature**: Verify `LEMON_SQUEEZY_WEBHOOK_SECRET` in `.env.local`
4. **Check logs**: Look for errors in your dev server terminal

### Invalid signature error

1. **Check secret**: Ensure you copied the correct signing secret
2. **Check environment**: Make sure `.env.local` is loaded
3. **Check test mode**: Test mode and live mode have different secrets

### Tokens not added

1. **Check user ID**: Verify the user exists in Supabase
2. **Check database**: Query the `transactions` table to see if it was created
3. **Check logs**: Look for specific error messages in the webhook handler

## Deployment Checklist

Before deploying to production:

- [ ] Test webhook locally with ngrok
- [ ] Run unit tests: `npm run test:unit -- webhook`
- [ ] Run integration tests: `npm run test:webhook`
- [ ] Test on preview deployment
- [ ] Verify signature validation works
- [ ] Verify idempotency (replay same event)
- [ ] Test both order_created and order_refunded
- [ ] Update webhook URL in Lemon Squeezy to production URL
- [ ] Switch to production mode in Lemon Squeezy
- [ ] Update `LEMON_SQUEEZY_TEST_MODE=false` in production env vars

## Security Notes

- ✅ Always verify webhook signatures
- ✅ Use HTTPS (ngrok provides this automatically)
- ✅ Keep webhook secret secure (never commit to git)
- ✅ Implement idempotency (handle duplicate events)
- ✅ Log all webhook events for audit trail
- ✅ Return 200 OK even on errors (prevents retries for invalid data)

## Useful Commands

```bash
# Start dev server
npm run dev

# Start ngrok tunnel
ngrok http 5173

# Run webhook unit tests
npm run test:unit -- webhook

# Run webhook integration test
npm run test:webhook

# Inspect webhook payloads (ngrok web interface)
open http://127.0.0.1:4040

# View recent transactions in Supabase
# (Use Supabase dashboard)
```

## Further Reading

- [Lemon Squeezy Webhooks Documentation](https://docs.lemonsqueezy.com/help/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
- [HMAC Signature Verification](https://docs.lemonsqueezy.com/help/webhooks#signing-requests)
