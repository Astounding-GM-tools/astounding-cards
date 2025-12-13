# Supabase Migrations Guide

This document explains how to manage database schema changes using Supabase migrations.

## Overview

The project uses Supabase for:
- User authentication
- Token credits tracking
- Transaction history (Lemon Squeezy purchases)
- Community image gallery
- Deck sharing

## Migration Files

Migrations are stored in `/supabase/migrations/` and are numbered sequentially:

```
supabase/migrations/
├── 001_initial_schema.sql          # Users, credits, images
├── 002_community_images.sql        # Public gallery
├── 003_token_functions.sql         # Credit management
...
├── 016_add_transactions_table.sql  # Payment tracking
└── 017_add_test_mode_to_transactions.sql  # Test vs production
```

## Applying Migrations

### Option 1: Using Supabase Dashboard (Recommended for production)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the sidebar
4. Click **New Query**
5. Copy the contents of the migration file
6. Paste and click **Run**

For the transactions table:
1. Run `016_add_transactions_table.sql` first
2. Then run `017_add_test_mode_to_transactions.sql`

### Option 2: Using Supabase MCP (if connected)

If you have the Supabase MCP server configured:

```bash
# Apply a migration
npx tsx scripts/apply-migration.ts 016_add_transactions_table.sql
npx tsx scripts/apply-migration.ts 017_add_test_mode_to_transactions.sql
```

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Transaction Table Schema

After applying migrations 016 and 017, the `transactions` table has:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who made the purchase |
| `lemon_squeezy_order_id` | TEXT | Unique order ID from LS |
| `lemon_squeezy_checkout_id` | TEXT | Checkout session ID |
| `variant_id` | TEXT | Product variant ID |
| `variant_name` | TEXT | Variant name (e.g., "Medium") |
| `amount_usd` | DECIMAL(10,2) | Amount in USD |
| `tokens_purchased` | INTEGER | Number of tokens |
| `status` | TEXT | pending, completed, refunded, failed |
| `test_mode` | BOOLEAN | Whether this was a test purchase |
| `created_at` | TIMESTAMPTZ | When created |
| `updated_at` | TIMESTAMPTZ | When last updated |
| `webhook_payload` | JSONB | Full webhook data for debugging |

## Test vs Production Transactions

### Best Practices

1. **Keep test transactions** - Don't delete them! Reasons:
   - Audit trail for debugging
   - Helps identify test vs production issues
   - Useful for accounting reconciliation
   - Can demonstrate system functionality

2. **Filter by `test_mode`** - Always filter queries:
   ```sql
   -- Production transactions only
   SELECT * FROM transactions WHERE test_mode = false;

   -- Test transactions only
   SELECT * FROM transactions WHERE test_mode = true;
   ```

3. **Mark test transactions clearly** - The `test_mode` flag makes this automatic:
   ```typescript
   // API sets this based on LEMON_SQUEEZY_TEST_MODE
   test_mode: LEMON_SQUEEZY_TEST_MODE === 'true'
   ```

4. **Clean up periodically** - If needed, delete old test transactions:
   ```sql
   -- Delete test transactions older than 30 days
   DELETE FROM transactions
   WHERE test_mode = true
     AND created_at < NOW() - INTERVAL '30 days';
   ```

### Using Supabase Branches (Advanced)

For testing database changes before production:

1. **Create a branch** in Supabase Dashboard
2. **Test migrations** on the branch
3. **Merge to production** when ready

This is overkill for most cases - using `test_mode` flag is simpler.

## Common Queries

### View recent transactions

```sql
SELECT
  id,
  user_id,
  variant_name,
  amount_usd,
  tokens_purchased,
  status,
  test_mode,
  created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 10;
```

### Total revenue (production only)

```sql
SELECT
  SUM(amount_usd) as total_revenue,
  COUNT(*) as transaction_count
FROM transactions
WHERE test_mode = false
  AND status = 'completed';
```

### User's transaction history

```sql
SELECT
  variant_name,
  amount_usd,
  tokens_purchased,
  status,
  test_mode,
  created_at
FROM transactions
WHERE user_id = 'USER_UUID_HERE'
ORDER BY created_at DESC;
```

### Test transactions summary

```sql
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM transactions
WHERE test_mode = true;
```

## Troubleshooting

### Migration already applied

If you get an error that the table already exists:
- Check if the migration was already run
- Use `IF NOT EXISTS` in CREATE statements
- Migrations are idempotent (safe to run multiple times)

### Permission errors

Ensure your Supabase user has the correct permissions:
```sql
GRANT ALL ON public.transactions TO service_role;
GRANT SELECT ON public.transactions TO authenticated;
```

### RLS (Row Level Security) issues

The transactions table has RLS enabled with these policies:
1. Users can view their own transactions
2. Service role (API) can manage all transactions

If you need to query as admin:
1. Use the service role key
2. Or disable RLS temporarily (not recommended in production)

## Deployment Checklist

Before deploying Lemon Squeezy integration:

- [ ] Apply `016_add_transactions_table.sql` to production database
- [ ] Apply `017_add_test_mode_to_transactions.sql` to production database
- [ ] Verify table exists: `SELECT * FROM transactions LIMIT 1;`
- [ ] Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'transactions';`
- [ ] Test with a test mode purchase
- [ ] Verify `test_mode` flag is set correctly
- [ ] Switch to production mode and test with real card
- [ ] Verify production transactions have `test_mode = false`

## Further Reading

- [Supabase Migrations Docs](https://supabase.com/docs/guides/database/migrations)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
