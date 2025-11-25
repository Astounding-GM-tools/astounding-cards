# Production Supabase Setup Guide

This guide walks you through setting up your production Supabase instance.

## Phase 1: Create Production Project

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. Click **"New project"**
3. Fill in details:
   - **Organization**: Select your organization
   - **Name**: `astounding-cards-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose the same region as your dev instance (or closest to your users)
   - **Pricing Plan**: Select your plan
4. Click **"Create new project"**
5. Wait ~2 minutes for the project to provision

## Phase 2: Run Migrations (In Order!)

All migrations are now organized in `supabase/migrations/` with proper numbering.

Go to **SQL Editor** → **New query** and run these migrations **one at a time, in this exact order**:

### Migration 1: Base Schema
**File**: `supabase/migrations/001_initial_schema.sql`

Creates the core tables:
- `users` (extends Supabase auth)
- `published_decks` (public gallery decks)
- `generated_images` (AI image tracking)
- `transactions` (credit purchases/usage)
- Base functions: `update_updated_at_column`, `reset_daily_free_decks`, `increment_view_count`, `grant_welcome_bonus`

**Status**: ⬜ Not run

---

### Migration 2: Community Images
**File**: `supabase/migrations/002_community_images.sql`

Adds:
- `community_images` table (image library with style variants)
- pgvector extension for semantic search
- Functions: `find_image_remix`, `search_similar_images`

**Status**: ⬜ Not run

---

### Migration 3: Token Functions
**File**: `supabase/migrations/003_token_functions.sql`

Adds:
- Function: `deduct_tokens` (atomic token deduction with race condition protection)

**Status**: ⬜ Not run

---

### Migration 4: Import Count
**File**: `supabase/migrations/004_add_import_count.sql`

Adds:
- Column to `published_decks`: `import_count`
- Function: `increment_import_count`

**Status**: ⬜ Not run

---

### Migration 5: Remix Lineage
**File**: `supabase/migrations/005_add_remix_lineage.sql`

Adds:
- Columns to `published_decks`: `remix_of`, `remix_count`
- Functions: `increment_remix_count`, `decrement_remix_count`

**Status**: ⬜ Not run

---

### Migration 6: User Decks
**File**: `supabase/migrations/006_user_decks.sql`

Adds:
- `user_decks` table (private working copies)
- Additional columns to `published_decks`: `source_deck_id`, `like_count`, `image_style`, `layout`
- Functions: `increment_like_count`, `decrement_like_count`

**Status**: ⬜ Not run

---

### Migration 7: Function Security Fix (IMPORTANT!)
**File**: `supabase/migrations/007_fix_function_search_path.sql`

Updates all functions with:
- `SECURITY DEFINER`
- `SET search_path = public, pg_temp`

This fixes the security warnings you saw in dev.

**Status**: ⬜ Not run

---

## Phase 3: Configure Security Settings

### Enable Leaked Password Protection
1. Go to **Authentication** → **Providers** → **Email**
2. Scroll to **"Password Security"**
3. Enable **"Check against leaked password databases"**
4. Click **"Save"**

### Verify Security
1. Go to **Database** → **Database Health**
2. Check that there are NO warnings
3. All 11 functions should have `search_path` set

---

## Phase 4: Configure Environment Variables

### Get Your Production Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: The `anon` `public` key
   - **service_role key**: The `service_role` `secret` key (keep this secret!)

### Update Your Production Environment

In your hosting platform (Vercel, etc.), set these environment variables:

```bash
# Supabase Production
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SECRET_API_KEY=eyJhbGc...

# Keep your existing vars
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=astounding-cards-images
PUBLIC_R2_PATH_PREFIX=prod
PUBLIC_R2_PUBLIC_URL=...
GEMINI_API_KEY=...
```

---

## Phase 5: Verification Checklist

Run these verification queries in **SQL Editor**:

### Check All Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:
- `community_images`
- `generated_images`
- `published_decks`
- `transactions`
- `user_decks`
- `users`

### Check All Functions Have Security Set
```sql
SELECT
  p.proname as function_name,
  CASE
    WHEN p.proconfig IS NULL THEN 'NO SEARCH PATH SET ❌'
    WHEN 'search_path' = ANY(string_to_array(unnest(p.proconfig), '=')[1]) THEN 'SEARCH PATH SET ✅'
    ELSE 'NO SEARCH PATH SET ❌'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY function_name;
```

All functions should show ✅

### Check Extensions
```sql
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');
```

Should show both extensions installed.

---

## Phase 6: Test Your Production Setup

1. Deploy your app with production environment variables
2. Sign up as a test user
3. Verify welcome bonus is granted (500 tokens)
4. Create a test deck
5. Publish it to the gallery
6. Check that it appears in the public gallery

---

## Troubleshooting

### Migration Fails
- Check that you ran migrations in order
- Read the error message carefully
- If a table/column already exists, that's usually OK (we use `IF NOT EXISTS`)

### Functions Not Found
- Make sure all migrations ran successfully
- Check **Database** → **Functions** to see all functions

### RLS Errors
- Verify policies are created: `SELECT * FROM pg_policies;`
- Check that RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`

### Token Deduction Fails
- Verify `deduct_tokens` function exists
- Check user has sufficient balance: `SELECT id, email, credits FROM users;`

---

## Post-Setup Notes

### Database Backups
Supabase automatically backs up your database. Configure backup retention in **Project Settings** → **Database**.

### Monitoring
- **Database** → **Database Health**: Check regularly for warnings
- **Logs** → **Postgres Logs**: Monitor for errors
- **Auth** → **Users**: Monitor signups

### Rate Limiting
Consider enabling rate limiting for your API routes to prevent abuse.

---

## Need Help?

If you encounter issues:
1. Check Supabase logs: **Logs** → **Postgres Logs**
2. Check your app logs in Vercel/hosting platform
3. Verify environment variables are set correctly
4. Test the SQL query directly in SQL Editor

---

**Last Updated**: 2025-11-25
**Migration Count**: 7 migrations total
**Estimated Setup Time**: 15-20 minutes

---

## Alternative: Use Supabase CLI (Recommended!)

Instead of manually running migrations, you can use the Supabase CLI to apply them automatically.

See `MIGRATION_WORKFLOW.md` for details on setting up the CLI workflow.

**Quick setup:**
```bash
# Login to Supabase
npx supabase login

# Link to your production project
npx supabase link --project-ref your-prod-ref

# Apply all migrations at once
npx supabase db push
```

This is the recommended approach for future migrations and CI/CD integration!
