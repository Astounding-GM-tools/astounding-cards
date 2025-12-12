# Payment System - Lemon Squeezy Integration

**Status:** In Development
**Last Updated:** 2025-12-11
**Priority:** HIGH - Revenue Generation

---

## Overview

Astounding Cards uses Lemon Squeezy for payment processing to sell token packages. This document covers the complete implementation of the payment system, from checkout to webhook handling to transaction logging.

## Architecture

```
User Flow:
1. User selects token package in TokenStore component
2. Clicks "Pay" button → POST /api/tokens/purchase
3. Backend creates Lemon Squeezy checkout session
4. User redirected to Lemon Squeezy checkout page
5. User completes payment
6. Lemon Squeezy sends webhook → POST /api/tokens/webhook
7. Backend verifies webhook, adds tokens to user account
8. User sees updated token balance
```

---

## Environment Variables

Add these to your `.env` file:

```bash
# Lemon Squeezy Credentials
LEMON_SQUEEZY_API_KEY=your_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id_here
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: Test mode
LEMON_SQUEEZY_TEST_MODE=true  # Set to false for production
```

### How to Get These Values

1. **API Key**:
   - Go to Lemon Squeezy Dashboard → Settings → API
   - Create a new API key
   - Copy the key (starts with `lmsq_`)

2. **Store ID**:
   - Go to Settings → Stores
   - Copy your store ID from the URL or settings page

3. **Webhook Secret**:
   - Go to Settings → Webhooks
   - Create a new webhook endpoint: `https://your-domain.com/api/tokens/webhook`
   - Select events: `order_created`, `order_refunded`
   - Copy the signing secret

---

## Database Schema

### New Table: `transactions`

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lemon Squeezy data
  lemon_squeezy_order_id TEXT UNIQUE NOT NULL,
  variant_id TEXT NOT NULL,
  variant_name TEXT NOT NULL,

  -- Transaction details
  amount_usd DECIMAL(10, 2) NOT NULL,
  tokens_purchased INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, refunded, failed

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- For debugging
  webhook_payload JSONB,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'refunded', 'failed'))
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_lemon_squeezy_order_id ON transactions(lemon_squeezy_order_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- RLS Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update transactions (via API)
CREATE POLICY "Service role can manage transactions"
  ON transactions
  FOR ALL
  USING (auth.role() = 'service_role');
```

### Migration File

Create: `supabase/migrations/[timestamp]_add_transactions_table.sql`

---

## Lemon Squeezy Product Setup

### Simplified 3-Tier Approach

Create these as **Variants** under a single "Token Packs" product:

| Variant Name | Packs | Tokens | Base Price | Discount | Final Price* |
|--------------|-------|--------|------------|----------|--------------|
| Starter      | 1     | 5,000  | $4.78      | 0%       | ~$5.28       |
| Popular      | 3     | 15,000 | $14.34     | 8%       | ~$13.73      |
| Power User   | 5     | 25,000 | $23.90     | 16%      | ~$20.57      |

*Final prices include Lemon Squeezy fees ($0.50 + 5%)

**Why 3 tiers?**
- Simple, clear choices for users
- Easy to set up and maintain
- Covers common use cases (casual, regular, power users)
- Can always add more tiers later if needed

### Product Configuration

1. **Go to Products** → Create Product
2. **Product Name**: "Token Packs"
3. **Description**: "Purchase tokens to use AI features on Astounding Cards"
4. **Create 3 variants**:

   **Starter (1 Pack)**
   - Name: "Starter"
   - Price: $4.78
   - Description: "5,000 tokens - Enough to generate ~50 images"

   **Popular (3 Packs)**
   - Name: "Popular"
   - Price: $13.19 (after 8% discount)
   - Description: "15,000 tokens - Enough to generate ~150 images (8% off!)"

   **Power User (5 Packs)**
   - Name: "Power User"
   - Price: $20.06 (after 16% discount)
   - Description: "25,000 tokens - Enough to generate ~250 images (16% off!)"

### Variant IDs

After creating variants, note down their IDs. Update the code:

```typescript
// src/lib/payment/lemonSqueezyVariants.ts
export const TOKEN_PACK_TIERS = {
  STARTER: {
    variantId: 'your_variant_id_here'  // Replace
  },
  POPULAR: {
    variantId: 'your_variant_id_here'  // Replace
  },
  POWER: {
    variantId: 'your_variant_id_here'  // Replace
  }
};
```

---

## API Endpoints

### 1. `POST /api/tokens/purchase`

**Purpose**: Create a Lemon Squeezy checkout session

**Request Body**:
```typescript
{
  packs: number; // 1, 3, or 5 (maps to Starter, Popular, Power User)
}
```

**Response**:
```typescript
{
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}
```

**Implementation Steps**:
1. Verify user is authenticated
2. Validate `packs` parameter (must be 1, 3, or 5)
3. Get variant ID for pack count
4. Create checkout session via Lemon Squeezy API
5. Store pending transaction in database
6. Return checkout URL

**Lemon Squeezy API Call**:
```typescript
POST https://api.lemonsqueezy.com/v1/checkouts
Headers:
  Authorization: Bearer {LEMON_SQUEEZY_API_KEY}
  Accept: application/vnd.api+json
  Content-Type: application/vnd.api+json

Body:
{
  "data": {
    "type": "checkouts",
    "attributes": {
      "checkout_data": {
        "custom": {
          "user_id": "{userId}"
        }
      }
    },
    "relationships": {
      "store": {
        "data": {
          "type": "stores",
          "id": "{LEMON_SQUEEZY_STORE_ID}"
        }
      },
      "variant": {
        "data": {
          "type": "variants",
          "id": "{variantId}"
        }
      }
    }
  }
}
```

---

### 2. `POST /api/tokens/webhook`

**Purpose**: Handle Lemon Squeezy webhook events

**Webhook Events to Handle**:
- `order_created` - Payment successful, add tokens
- `order_refunded` - Refund processed, deduct tokens

**Request Headers**:
```
X-Signature: {signature}
Content-Type: application/json
```

**Implementation Steps**:
1. Verify webhook signature (CRITICAL for security)
2. Parse webhook payload
3. Extract user_id from custom data
4. Update transaction status
5. Add/deduct tokens based on event type
6. Return 200 OK

**Signature Verification**:
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

**Webhook Payload Example**:
```json
{
  "meta": {
    "event_name": "order_created",
    "custom_data": {
      "user_id": "uuid-here"
    }
  },
  "data": {
    "id": "order-id",
    "attributes": {
      "order_number": 123456,
      "total": 528,
      "status": "paid",
      "first_order_item": {
        "variant_id": "variant-id",
        "variant_name": "1 Pack"
      }
    }
  }
}
```

---

### 3. `GET /api/tokens/transactions`

**Purpose**: Get user's transaction history

**Query Parameters**:
```typescript
?limit=10&offset=0
```

**Response**:
```typescript
{
  success: boolean;
  transactions: Array<{
    id: string;
    created_at: string;
    tokens_purchased: number;
    amount_usd: number;
    status: string;
    variant_name: string;
  }>;
  total: number;
}
```

**Implementation**:
- Query `transactions` table for authenticated user
- Order by `created_at DESC`
- Support pagination
- Return sanitized transaction data

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create `transactions` table migration
- [ ] Run migration on Supabase
- [ ] Verify RLS policies
- [ ] Test transaction queries

### Phase 2: Lemon Squeezy Setup
- [ ] Create "Token Packs" product
- [ ] Create 10 variants (1-10 packs)
- [ ] Note down all variant IDs
- [ ] Create variant mapping file
- [ ] Set up webhook endpoint
- [ ] Copy webhook secret

### Phase 3: Backend Implementation
- [ ] Create `/api/tokens/purchase` endpoint
- [ ] Create `/api/tokens/webhook` endpoint
- [ ] Create `/api/tokens/transactions` endpoint
- [ ] Add Lemon Squeezy API client helper
- [ ] Implement signature verification
- [ ] Add transaction logging

### Phase 4: Frontend Updates
- [ ] Update TokenStore component
  - [ ] Remove `showComingSoon` prop
  - [ ] Add purchase handler
  - [ ] Add loading states
  - [ ] Add error handling
- [ ] Add purchase history UI to Dashboard
- [ ] Add success/error toasts

### Phase 5: Testing
- [ ] Test purchase flow (test mode)
- [ ] Test webhook delivery
- [ ] Test signature verification
- [ ] Test transaction logging
- [ ] Test refund flow
- [ ] Test error scenarios

### Phase 6: Production Deployment
- [ ] Add environment variables to Vercel
- [ ] Switch `LEMON_SQUEEZY_TEST_MODE=false`
- [ ] Update webhook URL to production
- [ ] Test with real payment
- [ ] Monitor error logs

---

## Error Handling

### Purchase Endpoint Errors

```typescript
// User not authenticated
{ success: false, error: 'Unauthorized' }

// Invalid pack count
{ success: false, error: 'Invalid pack count. Must be 1, 3, or 5.' }

// Lemon Squeezy API error
{ success: false, error: 'Failed to create checkout session' }

// Database error
{ success: false, error: 'Failed to create transaction record' }
```

### Webhook Endpoint Errors

```typescript
// Invalid signature
return new Response('Invalid signature', { status: 401 });

// Missing user_id
return new Response('Missing user_id in custom data', { status: 400 });

// Database error
return new Response('Failed to process transaction', { status: 500 });
```

**Important**: Always return 200 OK for webhooks after processing, even if there's an error updating the database. Log errors and retry manually if needed.

---

## Security Considerations

### 1. Webhook Signature Verification
- **ALWAYS** verify webhook signatures
- Use timing-safe comparison to prevent timing attacks
- Reject unsigned webhooks immediately

### 2. User Authorization
- Only authenticated users can purchase tokens
- Only allow users to view their own transactions
- Use RLS policies to enforce access control

### 3. Rate Limiting
- Limit purchase requests (e.g., 10 per hour per user)
- Prevent webhook replay attacks (check order IDs)

### 4. Idempotency
- Store Lemon Squeezy order IDs in database
- Prevent duplicate token grants for same order
- Handle duplicate webhook deliveries gracefully

### 5. Amount Validation
- Verify received amount matches expected price
- Log discrepancies for manual review
- Don't grant tokens if amounts don't match

---

## Testing Strategy

### Local Testing

1. **Use Lemon Squeezy Test Mode**:
   - Set `LEMON_SQUEEZY_TEST_MODE=true`
   - Use test API keys
   - Use test card: `4242 4242 4242 4242`

2. **Test Webhook Locally**:
   - Use ngrok: `ngrok http 5173`
   - Update webhook URL in Lemon Squeezy dashboard
   - Trigger test webhook from dashboard

3. **Manual Testing**:
   ```bash
   # Test purchase endpoint
   curl -X POST http://localhost:5173/api/tokens/purchase \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"packs": 1}'

   # Test webhook endpoint (with valid signature)
   curl -X POST http://localhost:5173/api/tokens/webhook \
     -H "X-Signature: {signature}" \
     -H "Content-Type: application/json" \
     -d @webhook-payload.json
   ```

### Production Testing

1. Make small test purchase ($5)
2. Verify webhook received
3. Verify tokens added
4. Test refund flow
5. Monitor logs for errors

---

## Monitoring & Logging

### What to Log

```typescript
// Purchase requests
console.log('[Purchase] User:', userId, 'Packs:', packs);

// Checkout creation
console.log('[Checkout] Created:', checkoutUrl);

// Webhook events
console.log('[Webhook] Event:', eventName, 'Order:', orderId);

// Token grants
console.log('[Tokens] Granted:', tokens, 'To user:', userId);

// Errors
console.error('[Error] Purchase failed:', error);
console.error('[Error] Webhook processing failed:', error);
```

### Metrics to Track

- Total revenue
- Average transaction value
- Conversion rate (visits → purchases)
- Failed transactions
- Refund rate
- Token usage patterns

---

## Support & Troubleshooting

### Common Issues

**Q: User paid but didn't receive tokens**
- Check webhook delivery in Lemon Squeezy dashboard
- Check `transactions` table for order
- Manually retry webhook if needed

**Q: Webhook signature verification failing**
- Verify webhook secret is correct
- Check for extra whitespace in env variable
- Verify payload format

**Q: Checkout URL not working**
- Check variant IDs are correct
- Verify store ID is correct
- Check API key permissions

**Q: Duplicate token grants**
- Check order ID uniqueness constraint
- Verify idempotency logic

---

## Future Improvements

### Short Term
- [ ] Add email receipt after purchase
- [ ] Add purchase confirmation page
- [ ] Show estimated delivery time

### Medium Term
- [ ] Implement subscription model (monthly tokens)
- [ ] Add gift cards/vouchers
- [ ] Referral program (earn tokens)

### Long Term
- [ ] Multi-currency support
- [ ] Promotional discounts/coupons
- [ ] Usage analytics dashboard

---

## References

- [Lemon Squeezy API Docs](https://docs.lemonsqueezy.com/api)
- [Lemon Squeezy Webhooks](https://docs.lemonsqueezy.com/help/webhooks)
- [Lemon Squeezy Checkouts](https://docs.lemonsqueezy.com/api/checkouts)

---

## Rollout Plan

### Week 1: Implementation
- Day 1-2: Database setup + backend endpoints
- Day 3-4: Frontend integration + testing
- Day 5: Staging deployment + QA

### Week 2: Launch
- Day 1: Production deployment
- Day 2-3: Monitor for issues
- Day 4-5: Collect feedback, iterate

### Success Metrics (First Month)
- [ ] 10+ successful purchases
- [ ] 0 failed/lost transactions
- [ ] < 5% refund rate
- [ ] $100+ revenue

---

Last Updated: 2025-12-11
Next Review: After initial deployment
