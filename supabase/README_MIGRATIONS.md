# Database Migrations Guide

Quick reference for managing your Supabase database migrations.

## 📁 Migration Files

All migrations are in `supabase/migrations/` in sequential order:

1. ✅ `001_initial_schema.sql` - Base tables (users, published_decks, etc.)
2. ✅ `002_community_images.sql` - Community image library
3. ✅ `003_token_functions.sql` - Token management
4. ✅ `004_add_import_count.sql` - Import tracking
5. ✅ `005_add_remix_lineage.sql` - Remix tracking
6. ✅ `006_user_decks.sql` - User deck storage
7. ✅ `007_fix_function_search_path.sql` - Security fix (IMPORTANT!)

## 🚀 Quick Start

### For Production Setup (One-time)

See: **`PRODUCTION_SETUP_GUIDE.md`**

Two options:
1. **Manual**: Copy/paste each migration into Supabase SQL Editor
2. **CLI** (recommended): Use `npx supabase db push`

### For Future Migrations

See: **`MIGRATION_WORKFLOW.md`**

```bash
# Create new migration
npx supabase migration new my_feature

# Apply to remote
npx supabase db push
```

## 📚 Documentation

- **`PRODUCTION_SETUP_GUIDE.md`** - Complete production setup checklist
- **`MIGRATION_WORKFLOW.md`** - Daily workflow and best practices
- **`.github/workflows/deploy-supabase.yml.example`** - CI/CD automation

## ✅ Dev Database Status

Your dev database (egtfbhpjwlytbfdapflu) has:
- ✅ All 7 migrations applied
- ✅ Security warnings fixed
- ✅ Ready for production replication

## 🎯 Next Steps

1. **Tonight/Soon**: Set up production Supabase project
2. **Optional**: Set up Supabase CLI workflow
3. **Future**: Enable CI/CD for automatic migrations

## 🔒 Security

All database functions now have:
- `SECURITY DEFINER` - Runs with elevated privileges
- `SET search_path = public, pg_temp` - Prevents injection attacks

## 📖 Answer to Your Question

> "Is it normal to link supabase and run migrations through it as part of a deploy step?"

**Yes! Absolutely.** Using Supabase CLI with CI/CD is the **professional standard** for production applications:

✅ **Version-controlled schema** - Database schema lives in git
✅ **Automated deployments** - No manual steps, fewer errors
✅ **Team collaboration** - Everyone uses the same migrations
✅ **Repeatable** - Can recreate database from scratch anytime
✅ **Safe rollbacks** - Can revert to previous state

**Your current setup:** Manual migrations (good for starting)
**Recommended next step:** Supabase CLI (when you have time)
**Pro level:** CI/CD automation (see workflow example)

You're now set up to do either manual or CLI-based migrations!
