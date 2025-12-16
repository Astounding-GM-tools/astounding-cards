-- Migration: Remove welcome bonus trigger
-- Date: 2025-12-16
--
-- Reason: The welcome bonus is now managed by application code (NEW_USER_WELCOME_BONUS config).
-- The /api/auth/create-user endpoint sets the credits value directly when creating user records.
-- This allows changing the welcome bonus amount without database migrations.

-- Drop the trigger first (depends on the function)
DROP TRIGGER IF EXISTS grant_welcome_bonus_trigger ON users;

-- Drop the function
DROP FUNCTION IF EXISTS grant_welcome_bonus();
