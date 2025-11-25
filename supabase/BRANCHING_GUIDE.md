# Supabase Branching Guide

Using Supabase branches for development workflows.

## What Are Supabase Branches?

Branches let you create **separate database instances** within the same Supabase project:
- Each branch is a complete database copy
- Perfect for testing, previews, and feature development
- Still in **beta** (use with caution)

## Recommended Setup

### For Production Apps
```
Separate Projects (Recommended):
├── Dev Project: astounding-cards-dev
└── Prod Project: astounding-cards-prod
```

### For Development Workflow (Optional)
```
Dev Project with Branches:
├── main (stable development)
├── preview-pr-123 (temporary PR preview)
└── feature-xyz (feature development)
```

## Creating a Branch

### Via CLI

```bash
# List existing branches
npx supabase branches list --project-ref egtfbhpjwlytbfdapflu

# Create a new branch from main
npx supabase branches create feature-ai-generation \
  --project-ref egtfbhpjwlytbfdapflu

# Get branch credentials
npx supabase branches get feature-ai-generation \
  --project-ref egtfbhpjwlytbfdapflu
```

### Via Dashboard

1. Go to your Supabase project
2. Click **"Branches"** in the left sidebar
3. Click **"Create branch"**
4. Choose source branch (usually `main`)
5. Name your branch

## Using Branches in CI/CD

### Preview Deployments for PRs

```yaml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Create/update Supabase branch for this PR
      - name: Create Supabase Preview Branch
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          BRANCH_NAME="preview-pr-${{ github.event.pull_request.number }}"

          # Create or reset branch
          npx supabase branches create $BRANCH_NAME \
            --project-ref ${{ secrets.SUPABASE_DEV_PROJECT_REF }} \
            || echo "Branch already exists"

      # Deploy to Vercel with branch credentials
      - name: Deploy to Vercel
        run: |
          # Get branch credentials and deploy
          # ...
```

## Branch Lifecycle

### Temporary Branches (PR Previews)

Create when PR opens, delete when PR closes:

```bash
# Create branch
npx supabase branches create preview-pr-123

# Use for testing
# ...

# Delete when done
npx supabase branches delete preview-pr-123
```

### Persistent Branches (Staging/QA)

Keep long-running branches for different environments:

```bash
# Create staging branch
npx supabase branches create staging

# This branch stays alive
# Use for QA testing before production
```

## Migration Testing Workflow

Test migrations on a branch before applying to production:

```bash
# 1. Create test branch from main
npx supabase branches create migration-test

# 2. Link to the branch
npx supabase link --project-ref your-ref --branch migration-test

# 3. Apply migration
npx supabase db push

# 4. Test thoroughly
# ...

# 5. If good, apply to main
npx supabase link --project-ref your-ref --branch main
npx supabase db push

# 6. Then apply to production (separate project!)
npx supabase link --project-ref your-prod-ref
npx supabase db push

# 7. Delete test branch
npx supabase branches delete migration-test
```

## Pricing & Limits

- **Free Plan**: Limited branching capability
- **Pro Plan**: More branches available
- **Team/Enterprise**: Full branching features

Check current limits: https://supabase.com/docs/guides/platform/branching

## When to Use Branching

### ✅ Good Use Cases

1. **PR Preview Deployments**
   - Spin up full environment for each PR
   - Test changes in isolation
   - Automatic cleanup when PR closes

2. **Migration Testing**
   - Test risky migrations on a branch first
   - Verify no breaking changes
   - Safe rollback if issues

3. **Feature Development**
   - Develop big features in isolation
   - Test with real data (copied from main)
   - Merge when ready

4. **Staging Environment**
   - Persistent staging branch
   - QA testing before production
   - Mirror production setup

### ❌ Not Recommended For

1. **Production Environment**
   - Use a separate project instead
   - Need strict isolation
   - Independent scaling/billing

2. **Long-Term Environments**
   - Branches are meant to be temporary/flexible
   - Better to use separate projects

3. **Critical Production Features**
   - Don't rely on beta features for prod
   - Wait until branching is stable

## Our Recommendation

For **Astounding Cards**:

### Current Setup (Recommended)
```
Dev Project: egtfbhpjwlytbfdapflu
├── main (current development)
└── (optional) preview branches for PRs

Prod Project: <new-project> (separate!)
└── main (production database)
```

### Why Separate Projects for Prod?

1. **Stability** - Prod needs proven, stable infrastructure
2. **Isolation** - No chance of dev affecting prod
3. **Security** - Completely separate credentials
4. **Scaling** - Different resource allocation
5. **Peace of mind** - Clear separation of concerns

### Optional: Add Branching to Dev Project

Once your production setup is stable, **optionally** add branching to your dev project for:
- PR previews
- Migration testing
- Feature development

But keep production as a **separate project**.

## Commands Reference

```bash
# Login
npx supabase login

# List branches
npx supabase branches list --project-ref <ref>

# Create branch
npx supabase branches create <name> --project-ref <ref>

# Get branch details
npx supabase branches get <name> --project-ref <ref>

# Delete branch
npx supabase branches delete <name> --project-ref <ref>

# Link to specific branch
npx supabase link --project-ref <ref> --branch <branch-name>
```

## Learn More

- [Supabase Branching Docs](https://supabase.com/docs/guides/platform/branching)
- [Preview Deployments Guide](https://supabase.com/docs/guides/platform/preview-environments)

---

**TL;DR**: Use **separate projects** for dev/prod, optionally add **branching** to dev project for PR previews and testing.
