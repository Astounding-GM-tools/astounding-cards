# Tokens, Pricing, and Welcome Bonus

This document explains how our token economy works and how to change pricing and bonuses.

## Concepts

- Tokens (aka credits) are the in-app currency
- 100 tokens = 1 NOK (mental model)
- Community image generation costs 100 tokens (1 NOK)
- Deck generation is free (gateway to images)
- New users receive a welcome bonus of 500 tokens (configurable)

## Configuration

- Pricing and constants are defined in `src/lib/config/token-costs.ts`
- Change values there, and redeploy

```ts
export const NEW_USER_WELCOME_BONUS = 500; // tokens
export const TOKEN_COSTS = {
  IMAGE_GENERATION_COMMUNITY: 100,
  DECK_GENERATION: 0,
  IMAGE_GENERATION_PRIVATE: 240, // future
  CLOUD_STORAGE_MONTHLY: 50 // future
};
```

## Welcome Bonus (Grant on Signup)

- The database grants the welcome bonus via a trigger
- Defined in `supabase/schema.sql` as `grant_welcome_bonus()`
- To change the bonus amount:
  1. Update `NEW_USER_WELCOME_BONUS` in config
  2. Update the value in `grant_welcome_bonus()` function
  3. Apply the schema update in Supabase (SQL editor) or via migration

## Token Balance API

- GET `/api/tokens/balance` returns the user's balance
- POST `/api/tokens/dev-add` adds tokens in dev only (guarded by `R2_PATH_PREFIX=dev`)

## UI

- AiImageGenerationDialog displays cost and balance with ✅/❌ affordance
- AuthGatedCtaButton handles auth + CTA logic for features

## Strategy

- Deck generation is always free to maximize engagement
- Images are the monetization point (community library grows with use)
- 500 token welcome bonus lets users try ~5 images immediately
