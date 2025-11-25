# Supabase Migration Workflow

This guide explains how to properly manage database migrations using the Supabase CLI.

## Why Use Supabase CLI for Migrations?

✅ **Version Control**: Database schema lives in git
✅ **Repeatability**: Can recreate database anytime
✅ **Team Collaboration**: Everyone applies same migrations
✅ **CI/CD Integration**: Automated deployments
✅ **Safety**: Atomic migrations with rollback capability

---

## Initial Setup (One-Time)

### 1. Install Supabase CLI

You already have it via npx, but for better performance:

```bash
# macOS
brew install supabase/tap/supabase

# Or use npx (what you're currently doing)
npx supabase --version
```

### 2. Login to Supabase

You'll need a personal access token:

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Name it "CLI Access"
4. Copy the token
5. Run:

```bash
npx supabase login
```

Or set as environment variable:

```bash
export SUPABASE_ACCESS_TOKEN=your-token-here
```

### 3. Link to Your Projects

**For Dev:**
```bash
# Get your project ref from the URL:
# https://supabase.com/dashboard/project/egtfbhpjwlytbfdapflu
#                                        ^^^^^^^^^^^^^^^^^^^^
#                                        This is your project-ref

npx supabase link --project-ref egtfbhpjwlytbfdapflu
```

This creates `.supabase/` directory (already gitignored).

**For Production (after you create it):**
```bash
npx supabase link --project-ref your-prod-ref
```

---

## Daily Workflow

### Creating a New Migration

**Option A: Write SQL directly**
```bash
# Create a new migration file
npx supabase migration new add_user_preferences

# Edit the file: supabase/migrations/YYYYMMDDHHMMSS_add_user_preferences.sql
# Add your SQL
```

**Option B: Generate from schema diff** (Advanced)
```bash
# Make changes in Supabase Dashboard
# Then generate migration from the diff
npx supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_my_changes.sql
```

### Applying Migrations

**To Remote (Dev/Prod):**
```bash
# Apply all pending migrations to linked project
npx supabase db push
```

**To Local (if using Docker):**
```bash
npx supabase db reset  # Recreates from scratch
```

### Checking Migration Status

```bash
# See which migrations have been applied
npx supabase migration list

# See pending migrations
npx supabase db diff --schema public
```

---

## Migration Best Practices

### 1. Always Use Transactions

Migrations are automatically wrapped in transactions, but be careful with:
- `CREATE INDEX CONCURRENTLY` (can't be in transaction)
- Multiple DDL statements that depend on each other

### 2. Make Migrations Idempotent

Use `IF NOT EXISTS` / `IF EXISTS`:

```sql
-- Good ✅
CREATE TABLE IF NOT EXISTS users (...);
ALTER TABLE decks ADD COLUMN IF NOT EXISTS status TEXT;

-- Bad ❌
CREATE TABLE users (...);  -- Fails if already exists
ALTER TABLE decks ADD COLUMN status TEXT;  -- Fails if already exists
```

### 3. Test Migrations

```bash
# Apply to dev first
npx supabase link --project-ref your-dev-ref
npx supabase db push

# Test your app
# If good, apply to prod
npx supabase link --project-ref your-prod-ref
npx supabase db push
```

### 4. Never Edit Old Migrations

Once a migration is applied, **never modify it**. Create a new migration instead.

```bash
# Wrong ❌
# Edit supabase/migrations/001_initial.sql

# Right ✅
npx supabase migration new fix_users_table
```

---

## CI/CD Integration (GitHub Actions Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      # Run database migrations
      - name: Apply Supabase Migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
        run: |
          npx supabase link --project-ref $SUPABASE_PROJECT_REF
          npx supabase db push

      # Then deploy your app
      - name: Deploy to Vercel
        run: vercel deploy --prod
```

**Required GitHub Secrets:**
- `SUPABASE_ACCESS_TOKEN`: Your personal access token
- `SUPABASE_PROJECT_REF`: Your production project ref

---

## Current State of Your Project

### Existing Migrations

You have these migrations in `supabase/migrations/`:

1. ✅ `002_community_images.sql`
2. ✅ `003_token_functions.sql`
3. ✅ `002_add_import_count.sql` (duplicate number - should rename!)
4. ✅ `004_fix_function_search_path.sql`

### Migration Files Not in migrations/

These are in `supabase/` root but should be migrated:

- `schema.sql` - Base schema (should be `001_initial_schema.sql`)
- `EXECUTE_THIS_MIGRATION.sql` - User decks (should be numbered)
- `migration_001_user_decks.sql` - Duplicate of above
- `migration_002_add_remix_lineage.sql` - Should be in migrations/

---

## Recommended Next Steps

### 1. Clean Up Migration Files

Let's organize your migrations properly:

```bash
# Move and rename files to follow convention
mv supabase/schema.sql supabase/migrations/001_initial_schema.sql
mv supabase/migration_002_add_remix_lineage.sql supabase/migrations/005_add_remix_lineage.sql
mv supabase/EXECUTE_THIS_MIGRATION.sql supabase/migrations/003_user_decks.sql

# Rename the duplicate
mv supabase/migrations/002_add_import_count.sql supabase/migrations/003_add_import_count.sql

# Update the 003_user_decks.sql numbering
mv supabase/migrations/003_user_decks.sql supabase/migrations/006_user_decks.sql
```

**Final order:**
1. `001_initial_schema.sql` (base tables)
2. `002_community_images.sql` (community images)
3. `003_token_functions.sql` (token functions)
4. `004_add_import_count.sql` (import count - renamed)
5. `005_add_remix_lineage.sql` (remix tracking)
6. `006_user_decks.sql` (user decks table)
7. `007_fix_function_search_path.sql` (security fix - renamed)

### 2. Link CLI to Projects

```bash
# Link to dev
npx supabase link --project-ref egtfbhpjwlytbfdapflu

# Verify it's linked
npx supabase projects list
```

### 3. Future Migrations Use CLI

From now on, create migrations via:

```bash
npx supabase migration new descriptive_name
```

This ensures correct timestamps and ordering.

---

## Troubleshooting

### "Migration already applied"

This is fine! Supabase tracks applied migrations. If you see this, it means the migration was already run.

### "Migration failed"

1. Check the error message
2. Fix the SQL
3. Create a new migration with the fix
4. Never edit the failed migration if it was partially applied

### "Cannot connect to remote database"

1. Check you're linked: `npx supabase projects list`
2. Check your token: `echo $SUPABASE_ACCESS_TOKEN`
3. Re-link: `npx supabase link --project-ref your-ref`

---

## Quick Reference

```bash
# Login
npx supabase login

# Link to project
npx supabase link --project-ref your-ref

# Create migration
npx supabase migration new my_migration

# Apply migrations
npx supabase db push

# Check status
npx supabase migration list

# Pull remote schema
npx supabase db pull
```

---

**Last Updated**: 2025-11-25
