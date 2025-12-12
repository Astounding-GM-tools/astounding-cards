# Payment System Implementation Checklist

**Started:** 2025-12-11
**Status:** In Progress

---

## Phase 1: Database Setup

- [ ] **Run migration** - Apply `016_add_transactions_table.sql` to Supabase
  - Command: Use Supabase dashboard or CLI
  - Verify: Check that `transactions` table exists
  - Test: Try inserting a test record

---

## Phase 2: Backend API Endpoints

### Purchase Endpoint (`/api/tokens/purchase`)

- [ ] **Create file** - `src/routes/api/tokens/purchase/+server.ts`
- [ ] **Implement POST handler**:
  - [ ] Verify user authentication
  - [ ] Validate pack count (1, 3, or 5)
  - [ ] Get variant ID from mapping
  - [ ] Create Lemon Squeezy checkout session
  - [ ] Store pending transaction in database
  - [ ] Return checkout URL
- [ ] **Error handling**:
  - [ ] 401 if not authenticated
  - [ ] 400 for invalid pack count
  - [ ] 500 for Lemon Squeezy errors
- [ ] **Test manually** with curl/Postman

### Webhook Endpoint (`/api/tokens/webhook`)

- [ ] **Create file** - `src/routes/api/tokens/webhook/+server.ts`
- [ ] **Implement POST handler**:
  - [ ] Get raw request body
  - [ ] Verify webhook signature (CRITICAL!)
  - [ ] Parse webhook payload
  - [ ] Handle `order_created` event:
    - [ ] Extract user_id from custom data
    - [ ] Update transaction status to 'completed'
    - [ ] Add tokens to user's balance
    - [ ] Log the transaction
  - [ ] Handle `order_refunded` event:
    - [ ] Update transaction status to 'refunded'
    - [ ] Deduct tokens from user's balance
    - [ ] Log the refund
  - [ ] Return 200 OK for all valid webhooks
- [ ] **Security**:
  - [ ] Verify signature with timing-safe comparison
  - [ ] Check for duplicate order IDs (idempotency)
  - [ ] Validate amount matches expected price
- [ ] **Test** with Lemon Squeezy test webhook

### Transactions Endpoint (`/api/tokens/transactions`)

- [ ] **Create file** - `src/routes/api/tokens/transactions/+server.ts`
- [ ] **Implement GET handler**:
  - [ ] Verify user authentication
  - [ ] Get user's transactions from database
  - [ ] Support pagination (limit/offset)
  - [ ] Order by created_at DESC
  - [ ] Return sanitized transaction data
- [ ] **Test** by fetching after creating test transaction

---

## Phase 3: Frontend Integration

### Update TokenStore Component

- [ ] **Modify** `src/lib/next/components/store/TokenStore.svelte`
- [ ] **Changes needed**:
  - [ ] Replace slider with 3 tier buttons
  - [ ] Add click handler to call purchase endpoint
  - [ ] Add loading state during checkout creation
  - [ ] Redirect to Lemon Squeezy checkout URL
  - [ ] Show error toast if purchase fails
  - [ ] Remove `showComingSoon` prop/logic
- [ ] **UI Design**:
  - [ ] Button for each tier (Starter, Popular, Power)
  - [ ] Show savings badge on Popular/Power
  - [ ] Disable during loading
  - [ ] Show spinner during checkout creation

### Update Dashboard

- [ ] **Add purchase success handler** to `src/routes/dashboard/+page.svelte`
  - [ ] Check for `?purchase=success` URL param
  - [ ] Show success toast
  - [ ] Clean up URL (replaceState)
  - [ ] Refresh token balance

- [ ] **Add transaction history section**
  - [ ] Create new section "Purchase History"
  - [ ] Fetch transactions on mount
  - [ ] Show table/list of past purchases
  - [ ] Display: date, tokens, amount, status
  - [ ] Support pagination if needed
  - [ ] Empty state if no purchases

---

## Phase 4: Testing

### Local Testing (Test Mode)

- [ ] **Purchase Flow**:
  - [ ] Click tier button in TokenStore
  - [ ] Redirected to Lemon Squeezy checkout
  - [ ] Use test card: `4242 4242 4242 4242`
  - [ ] Complete test purchase
  - [ ] Redirected back to dashboard with success message

- [ ] **Webhook Testing**:
  - [ ] Use ngrok to expose localhost: `ngrok http 5173`
  - [ ] Update webhook URL in Lemon Squeezy to ngrok URL
  - [ ] Trigger test purchase
  - [ ] Verify webhook received and processed
  - [ ] Check transaction created in database
  - [ ] Verify tokens added to balance

- [ ] **Edge Cases**:
  - [ ] Purchase while not logged in (should fail)
  - [ ] Invalid pack count (should fail)
  - [ ] Duplicate webhook delivery (should be idempotent)
  - [ ] Invalid webhook signature (should reject)
  - [ ] Refund flow (should deduct tokens)

### Database Verification

- [ ] **After test purchase**:
  - [ ] Check `transactions` table has new record
  - [ ] Verify status is 'completed'
  - [ ] Check `users` table - token balance increased
  - [ ] Verify webhook_payload is stored correctly

---

## Phase 5: Production Deployment

### Environment Setup

- [ ] **Add to Vercel environment variables**:
  - [ ] `LEMON_SQUEEZY_API_KEY`
  - [ ] `LEMON_SQUEEZY_STORE_ID`
  - [ ] `LEMON_SQUEEZY_WEBHOOK_SECRET`
  - [ ] `LEMON_SQUEEZY_TEST_MODE=false`

- [ ] **Update webhook URL** in Lemon Squeezy:
  - [ ] Change from ngrok to production URL
  - [ ] `https://cards.astounding.games/api/tokens/webhook`

### Production Testing

- [ ] **Make real test purchase** (small amount)
  - [ ] Use real card with small purchase ($5)
  - [ ] Verify webhook received in production
  - [ ] Check tokens added
  - [ ] Verify email receipt sent

- [ ] **Monitor logs**:
  - [ ] Check Vercel function logs
  - [ ] Check Sentry for errors
  - [ ] Monitor Lemon Squeezy webhook delivery status

### Go Live

- [ ] **Update TokenStore**:
  - [ ] Remove any "coming soon" messages
  - [ ] Enable purchase buttons
  - [ ] Update dashboard InfoBox

- [ ] **Announce**:
  - [ ] Tweet/post about launch
  - [ ] Update homepage if needed
  - [ ] Add to changelog

---

## Phase 6: Post-Launch Monitoring

### Week 1 Checklist

- [ ] **Monitor daily**:
  - [ ] Check for failed transactions
  - [ ] Review webhook delivery logs
  - [ ] Check for user complaints
  - [ ] Monitor revenue in Lemon Squeezy

- [ ] **Track metrics**:
  - [ ] Number of purchases
  - [ ] Average transaction value
  - [ ] Conversion rate (visitors → purchasers)
  - [ ] Refund rate

### Issues to Watch For

- [ ] Webhook delivery failures
- [ ] Signature verification failures
- [ ] Duplicate token grants
- [ ] Users not receiving tokens
- [ ] Email receipts not sending

---

## Rollback Plan

If something goes wrong:

1. **Disable purchases**:
   - Set `showComingSoon={true}` in TokenStore
   - Deploy immediately

2. **Investigate**:
   - Check Vercel logs
   - Check Lemon Squeezy webhook logs
   - Check database transactions

3. **Manual fixes**:
   - Can manually add tokens via Supabase SQL
   - Can retry webhooks from Lemon Squeezy dashboard

4. **Communicate**:
   - Email affected users
   - Explain issue and resolution timeline

---

## Success Criteria

✅ **Launch is successful if**:
- [ ] At least 5 test purchases work perfectly
- [ ] 100% of webhooks processed successfully
- [ ] 0 duplicate token grants
- [ ] All users receive email receipts
- [ ] Transaction history displays correctly
- [ ] No critical errors in logs

---

## Next Steps After Launch

1. Add purchase analytics to dashboard
2. Implement subscription model (monthly tokens)
3. Add promotional codes/discounts
4. Create referral program
5. Add usage analytics (tokens spent by feature)

---

**Last Updated:** 2025-12-11
**Ready for:** Phase 1 - Database Setup
